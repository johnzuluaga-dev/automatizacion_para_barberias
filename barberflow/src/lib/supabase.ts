/**
 * Cliente REST de Supabase para BarberFlow
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Variables de Supabase no definidas en .env');
}

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
}

async function supabaseFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Supabase error ${res.status}: ${error}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : []) as T;
}

export async function getAppointments(): Promise<Appointment[]> {
  return supabaseFetch<Appointment[]>('/appointments?order=appointment_date.desc,appointment_time.desc');
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  await supabaseFetch(`/appointments?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAppointment(id: string): Promise<void> {
  await supabaseFetch(`/appointments?id=eq.${id}`, {
    method: 'DELETE',
  });
}
