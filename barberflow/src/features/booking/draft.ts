import type { BookingFormValues } from './validation';

/**
 * Selección guardada mientras la persona ingresa o crea su cuenta, para no
 * perder servicio, barbero, día y hora. No guarda datos personales.
 */
const KEY = 'barberflow_booking_draft';

type Draft = Pick<BookingFormValues, 'service' | 'barber' | 'appointment_date' | 'appointment_time'>;

export function saveDraft(values: BookingFormValues): void {
  const draft: Draft = {
    service: values.service,
    barber: values.barber,
    appointment_date: values.appointment_date,
    appointment_time: values.appointment_time,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Sin almacenamiento: la persona elegirá de nuevo.
  }
}

export function takeDraft(): Partial<Draft> {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Draft>;
    const clean: Partial<Draft> = {};
    for (const key of ['service', 'barber', 'appointment_date', 'appointment_time'] as const) {
      if (typeof parsed[key] === 'string') clean[key] = parsed[key];
    }
    return clean;
  } catch {
    return {};
  }
}
