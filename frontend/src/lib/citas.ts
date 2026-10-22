/**
 * Citas en Firestore. Las consultas viajan con la sesión del usuario: las reglas
 * (firebase/firestore.rules) deciden qué ve cada uno (cliente: las suyas; admin: todas).
 *
 * La interfaz hacia la UI conserva los nombres de campos en inglés (`client_name`…);
 * aquí se traducen a los documentos de Firestore. Los estados son los mismos de la base.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { toE164 } from '@/features/auth/validation';
import type { Barber, Service } from '@/features/booking/catalog';
import { BOGOTA_OFFSET, slotCells } from '@/features/booking/schedule';
import { auth, db } from './firebase';

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service: string;
  barber: string;
  /** ID del barbero en el catálogo (barberos/{id}). */
  barber_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  created_at: string;
  cancel_token?: string;
  user_id?: string | null;
}

export interface NewAppointment {
  client_name: string;
  client_phone: string;
  service: Service;
  barber: Barber;
  appointment_date: string;
  appointment_time: string;
}

/** Error de datos con mensaje para mostrar y un código (`slot_taken` si la hora ya no está libre). */
export class DataError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DataError';
    this.code = code;
  }
}

/** IDs de los cupos: barbero + día + hora. Un ID repetido hace fallar la reserva (doble reserva). */
function slotIdsFor(barberId: string, date: string, time: string, durationMin: number): string[] {
  return slotCells(time, durationMin).map((cell) => `${barberId}_${date}_${cell.replace(':', '')}`);
}

function fail(error: unknown, fallback: string): never {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied' || code === 'unauthenticated') {
    throw new DataError('No tienes permiso para esta acción. Ingresa de nuevo.', code);
  }
  throw new DataError(fallback, code);
}

function toAppointment(id: string, data: DocumentData): Appointment {
  const servicios = (data.servicios ?? []) as { nombre: string }[];
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '';
  return {
    id,
    client_name: data.clienteNombre ?? '',
    client_phone: data.clienteTelefono ?? '',
    service: servicios.map((s) => s.nombre).join(' + '),
    barber: data.barberoNombre ?? '',
    barber_id: data.barberoId ?? '',
    appointment_date: data.fecha,
    appointment_time: data.horaInicio,
    status: data.estado,
    created_at: createdAt,
    cancel_token: data.cancelToken,
    user_id: data.clienteId ?? null,
  };
}

/* ------------------------------- Admin ------------------------------- */

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const snap = await getDocs(query(collection(db, 'citas'), orderBy('inicio', 'desc')));
    return snap.docs.map((d) => toAppointment(d.id, d.data()));
  } catch (error) {
    fail(error, 'No pudimos cargar la agenda.');
  }
}

/** Quién cambia el estado (queda en `canceladaPor` si cancela). */
export type StatusActor = 'admin' | 'barbero';

/** Citas de un barbero, la más reciente primero (para su agenda). */
export async function getBarberAppointments(barberoId: string): Promise<Appointment[]> {
  try {
    const snap = await getDocs(query(collection(db, 'citas'), where('barberoId', '==', barberoId), orderBy('inicio', 'asc')));
    return snap.docs.map((d) => toAppointment(d.id, d.data())).reverse();
  } catch (error) {
    fail(error, 'No pudimos cargar tu agenda.');
  }
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus, by: StatusActor = 'admin'): Promise<void> {
  try {
    const ref = doc(db, 'citas', id);
    const batch = writeBatch(db);
    if (status === 'cancelada') {
      batch.update(ref, {
        estado: 'cancelada',
        canceladaEn: serverTimestamp(),
        canceladaPor: by,
        updatedAt: serverTimestamp(),
      });
      await deleteSlots(batch, id);
    } else {
      batch.update(ref, { estado: status, updatedAt: serverTimestamp() });
    }
    await batch.commit();
  } catch (error) {
    fail(error, 'No pudimos actualizar el estado.');
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    await deleteSlots(batch, id);
    batch.delete(doc(db, 'citas', id));
    await batch.commit();
  } catch (error) {
    fail(error, 'No pudimos eliminar la cita.');
  }
}

/** Agrega al batch el borrado de los cupos de la cita (libera las horas). */
async function deleteSlots(batch: ReturnType<typeof writeBatch>, citaId: string): Promise<void> {
  const snap = await getDoc(doc(db, 'citas', citaId));
  const slotIds = (snap.data()?.slotIds ?? []) as string[];
  slotIds.forEach((slotId) => batch.delete(doc(db, 'citas_slots', slotId)));
}

/* ------------------------------ Clientes ----------------------------- */

/** Crea la cita del usuario con sesión; queda "pendiente" hasta que el admin la confirme. */
export async function createAppointment(input: NewAppointment, userId: string): Promise<Appointment> {
  const { service, barber } = input;
  const barberoId = barber.id;
  const slotIds = slotIdsFor(barberoId, input.appointment_date, input.appointment_time, service.durationMin);
  const taken = new Set(await getTakenSlots(barberoId, input.appointment_date));
  if (slotCells(input.appointment_time, service.durationMin).some((cell) => taken.has(cell))) {
    throw new DataError('Esa hora acaba de ocuparse. Elige otra.', 'slot_taken');
  }

  const inicio = new Date(`${input.appointment_date}T${input.appointment_time}:00${BOGOTA_OFFSET}`);
  const fin = new Date(inicio.getTime() + service.durationMin * 60_000);
  const cancelToken = crypto.randomUUID();
  const citaRef = doc(collection(db, 'citas'));

  try {
    const batch = writeBatch(db);
    batch.set(citaRef, {
      clienteId: userId,
      clienteNombre: input.client_name,
      clienteTelefono: toE164(input.client_phone),
      barberoId,
      barberoNombre: barber.name,
      sedeId: 'sede-principal',
      fecha: input.appointment_date,
      horaInicio: input.appointment_time,
      inicio: Timestamp.fromDate(inicio),
      fin: Timestamp.fromDate(fin),
      estado: 'pendiente',
      notas: '',
      servicios: [
        { servicioId: service.id, nombre: service.name, precio: service.price, duracionMin: service.durationMin },
      ],
      precioTotal: service.price,
      origen: 'web',
      cancelToken,
      slotIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const horas = slotCells(input.appointment_time, service.durationMin);
    slotIds.forEach((slotId, i) => {
      batch.set(doc(db, 'citas_slots', slotId), {
        barberoId,
        fecha: input.appointment_date,
        hora: horas[i],
        citaId: citaRef.id,
      });
    });
    await batch.commit();
  } catch (error) {
    // Un cupo ya existente no se puede pisar: la escritura completa falla (carrera entre dos reservas).
    if ((error as { code?: string }).code === 'permission-denied') {
      throw new DataError('Esa hora acaba de ocuparse. Elige otra.', 'slot_taken');
    }
    fail(error, 'No pudimos agendar tu cita. Inténtalo de nuevo.');
  }

  return {
    id: citaRef.id,
    client_name: input.client_name,
    client_phone: input.client_phone,
    service: service.name,
    barber: barber.name,
    barber_id: barber.id,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    status: 'pendiente',
    created_at: new Date().toISOString(),
    cancel_token: cancelToken,
    user_id: userId,
  };
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new DataError('Ingresa de nuevo para ver tus citas.');
  try {
    const snap = await getDocs(query(collection(db, 'citas'), where('clienteId', '==', uid), orderBy('inicio', 'desc')));
    return snap.docs.map((d) => toAppointment(d.id, d.data()));
  } catch (error) {
    fail(error, 'No pudimos cargar tus citas.');
  }
}

/** Horas ya tomadas para un barbero y día (los cupos no llevan datos de las personas). */
export async function getTakenSlots(barberId: string, date: string): Promise<string[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'citas_slots'), where('barberoId', '==', barberId), where('fecha', '==', date)),
    );
    return snap.docs.map((d) => d.data().hora as string);
  } catch {
    return [];
  }
}

export async function cancelMyAppointment(id: string): Promise<void> {
  try {
    const ref = doc(db, 'citas', id);
    const snap = await getDoc(ref);
    const data = snap.data();
    const open = data && (data.estado === 'pendiente' || data.estado === 'confirmada');
    if (!open || (data.inicio as Timestamp).toMillis() <= Date.now()) {
      throw new DataError('Esta cita ya no se puede cancelar.');
    }
    const batch = writeBatch(db);
    batch.update(ref, {
      estado: 'cancelada',
      canceladaEn: serverTimestamp(),
      canceladaPor: 'cliente',
      updatedAt: serverTimestamp(),
    });
    ((data.slotIds ?? []) as string[]).forEach((slotId) => batch.delete(doc(db, 'citas_slots', slotId)));
    await batch.commit();
  } catch (error) {
    if (error instanceof DataError) throw error;
    fail(error, 'No pudimos cancelar la cita.');
  }
}

/**
 * Cancelación desde el enlace del mensaje (/cancel?id=<token>), sin sesión.
 * La hace n8n con cuenta de servicio (busca la cita por `cancelToken` y libera los cupos).
 */
export async function cancelByToken(token: string): Promise<boolean> {
  const url = import.meta.env.VITE_N8N_CANCEL_WEBHOOK_URL;
  if (!url) {
    throw new DataError('La cancelación por enlace aún no está disponible. Ingresa a Mis citas para cancelar.');
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo_evento: 'cancelar_cita', cancel_token: token }),
    });
  } catch {
    throw new DataError('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.');
  }
  if (response.status === 404) return false;
  if (!response.ok) throw new DataError('No pudimos cancelar la cita.');
  const body = (await response.json().catch(() => ({}))) as { cancelada?: boolean };
  return body.cancelada !== false;
}

/* ------------------------------- Reseñas ------------------------------ */

/** IDs de las citas que la persona ya calificó (resenas/{citaId}). */
export async function getMyReviewedIds(): Promise<Set<string>> {
  const uid = auth.currentUser?.uid;
  if (!uid) return new Set();
  try {
    const snap = await getDocs(query(collection(db, 'resenas'), where('clienteId', '==', uid)));
    return new Set(snap.docs.map((d) => d.id));
  } catch {
    return new Set();
  }
}

/** Califica una cita completada (1 a 5). El ID de la reseña es el de la cita: una por cita. */
export async function createReview(appointment: Appointment, rating: number, comment: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new DataError('Ingresa de nuevo para calificar.');
  try {
    await setDoc(doc(db, 'resenas', appointment.id), {
      citaId: appointment.id,
      barberoId: appointment.barber_id,
      clienteId: uid,
      calificacion: rating,
      comentario: comment.trim(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    fail(error, 'No pudimos guardar tu calificación.');
  }
}
