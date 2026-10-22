/**
 * Citas en Firestore. Las consultas viajan con la sesión del usuario: las reglas
 * (firebase/firestore.rules) deciden qué ve cada uno (cliente: las suyas; admin: todas).
 *
 * La interfaz hacia la UI conserva los nombres de campos y estados en inglés
 * (`client_name`, `pending`…); aquí se traducen a los documentos de Firestore.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { findService } from '@/features/booking/catalog';
import { auth, db } from './firebase';

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service: string;
  barber: string;
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
  service: string;
  barber: string;
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

const TO_DB: Record<AppointmentStatus, string> = {
  pending: 'pendiente',
  confirmed: 'confirmada',
  completed: 'completada',
  cancelled: 'cancelada',
};

const FROM_DB: Record<string, AppointmentStatus> = {
  pendiente: 'pending',
  confirmada: 'confirmed',
  completada: 'completed',
  cancelada: 'cancelled',
  no_asistio: 'cancelled',
};

const SLOT_MINUTES = 30;
/** Colombia es UTC-5 todo el año (sin horario de verano). */
const BOGOTA_OFFSET = '-05:00';

/** "Carlos The Blade" → "carlos-the-blade": los IDs de barberos y servicios del seed. */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Horas ("HH:mm") de los cupos de 30 minutos que ocupa una cita. */
function slotHours(time: string, durationMin: number): string[] {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return Array.from({ length: Math.ceil(durationMin / SLOT_MINUTES) }, (_, i) => hhmm(h * 60 + m + i * SLOT_MINUTES));
}

/** IDs de los cupos: barbero + día + hora. Un ID repetido hace fallar la reserva (doble reserva). */
function slotIdsFor(barberId: string, date: string, time: string, durationMin: number): string[] {
  return slotHours(time, durationMin).map((hour) => `${barberId}_${date}_${hour.replace(':', '')}`);
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
    appointment_date: data.fecha,
    appointment_time: data.horaInicio,
    status: FROM_DB[data.estado] ?? 'pending',
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

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  try {
    const ref = doc(db, 'citas', id);
    const batch = writeBatch(db);
    if (status === 'cancelled') {
      batch.update(ref, {
        estado: TO_DB.cancelled,
        canceladaEn: serverTimestamp(),
        canceladaPor: 'admin',
        updatedAt: serverTimestamp(),
      });
      await deleteSlots(batch, id);
    } else {
      batch.update(ref, { estado: TO_DB[status], updatedAt: serverTimestamp() });
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
  const service = findService(input.service);
  if (!service) throw new DataError('Elige un servicio válido.');

  const barberoId = slugify(input.barber);
  const slotIds = slotIdsFor(barberoId, input.appointment_date, input.appointment_time, service.durationMin);
  const taken = new Set(await getTakenSlots(input.barber, input.appointment_date));
  if (slotHours(input.appointment_time, service.durationMin).some((hour) => taken.has(hour))) {
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
      clienteTelefono: input.client_phone,
      barberoId,
      barberoNombre: input.barber,
      sedeId: 'sede-principal',
      fecha: input.appointment_date,
      horaInicio: input.appointment_time,
      inicio: Timestamp.fromDate(inicio),
      fin: Timestamp.fromDate(fin),
      estado: TO_DB.pending,
      notas: '',
      servicios: [
        { servicioId: slugify(service.name), nombre: service.name, precio: service.price, duracionMin: service.durationMin },
      ],
      precioTotal: service.price,
      origen: 'web',
      cancelToken,
      slotIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const horas = slotHours(input.appointment_time, service.durationMin);
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
    barber: input.barber,
    appointment_date: input.appointment_date,
    appointment_time: input.appointment_time,
    status: 'pending',
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
export async function getTakenSlots(barber: string, date: string): Promise<string[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'citas_slots'), where('barberoId', '==', slugify(barber)), where('fecha', '==', date)),
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
      estado: TO_DB.cancelled,
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
