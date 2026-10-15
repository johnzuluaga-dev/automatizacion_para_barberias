/**
 * Datos de citas en Supabase. Las consultas viajan con la sesión del usuario:
 * RLS decide qué filas ve cada uno (cliente: las suyas; admin: todas).
 */
import { supabase } from './supabase-client';

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

/** Error de datos con mensaje para mostrar y el código de Postgres/PostgREST. */
export class DataError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DataError';
    this.code = code;
  }
}

function fail(error: { message: string; code?: string }, fallback: string): never {
  if (error.code === '23505') throw new DataError('Esa hora acaba de ocuparse. Elige otra.', error.code);
  if (error.code === '42501' || error.code === 'PGRST301') {
    throw new DataError('No tienes permiso para esta acción. Ingresa de nuevo.', error.code);
  }
  throw new DataError(fallback, error.code);
}

/** Hora "HH:MM" (la columna puede devolver "HH:MM:SS"). */
function normalize(a: Appointment): Appointment {
  return { ...a, appointment_time: a.appointment_time.slice(0, 5) };
}

/* ------------------------------- Admin ------------------------------- */

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });
  if (error) fail(error, 'No pudimos cargar la agenda.');
  return (data as Appointment[]).map(normalize);
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) fail(error, 'No pudimos actualizar el estado.');
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) fail(error, 'No pudimos eliminar la cita.');
}

/* ------------------------------ Clientes ----------------------------- */

/** Crea la cita del usuario con sesión; queda "pendiente" hasta que el admin la confirme. */
export async function createAppointment(input: NewAppointment, userId: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...input, status: 'pending', user_id: userId })
    .select('*')
    .single();
  if (error) fail(error, 'No pudimos agendar tu cita. Inténtalo de nuevo.');
  return normalize(data as Appointment);
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });
  if (error) fail(error, 'No pudimos cargar tus citas.');
  return (data as Appointment[]).map(normalize);
}

/** Horas ya tomadas para un barbero y día (sin exponer datos de otras citas). */
export async function getTakenSlots(barber: string, date: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('horas_ocupadas', { p_barbero: barber, p_fecha: date });
  if (error) return [];
  return ((data as string[] | null) ?? []).map((t) => t.slice(0, 5));
}

export async function cancelMyAppointment(id: string): Promise<void> {
  const { data, error } = await supabase.rpc('cancelar_mi_cita', { p_id: id });
  if (error) fail(error, 'No pudimos cancelar la cita.');
  if (data !== true) throw new DataError('Esta cita ya no se puede cancelar.');
}

/** Cancelación desde el enlace del mensaje (/cancel?id=<token>), sin sesión. */
export async function cancelByToken(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancelar_cita_por_token', { p_token: token });
  if (error) fail(error, 'No pudimos cancelar la cita.');
  return data === true;
}
