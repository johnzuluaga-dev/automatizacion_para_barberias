import { findService, BARBEROS } from './catalog';
import { isClosedDay, isPastDay, isPastSlot, TIME_SLOTS } from './schedule';

export interface BookingFormValues {
  client_name: string;
  client_phone: string;
  service: string;
  barber: string;
  appointment_date: string;
  appointment_time: string;
}

export type BookingErrors = Partial<Record<keyof BookingFormValues, string>>;

export const EMPTY_BOOKING: BookingFormValues = {
  client_name: '',
  client_phone: '',
  service: '',
  barber: '',
  appointment_date: '',
  appointment_time: '',
};

/** Orden en que se enfocan los campos con error. */
export const FIELD_ORDER: readonly (keyof BookingFormValues)[] = [
  'service',
  'barber',
  'appointment_date',
  'appointment_time',
  'client_name',
  'client_phone',
];

export function validateBooking(values: BookingFormValues, now: Date = new Date()): BookingErrors {
  const errors: BookingErrors = {};

  if (!findService(values.service)) errors.service = 'Elige un servicio.';
  if (!BARBEROS.includes(values.barber)) errors.barber = 'Elige quién te atiende.';

  if (!values.appointment_date) {
    errors.appointment_date = 'Elige un día.';
  } else if (isPastDay(values.appointment_date, now)) {
    errors.appointment_date = 'Esa fecha ya pasó.';
  } else if (isClosedDay(values.appointment_date)) {
    errors.appointment_date = 'Los domingos no abrimos. Elige otro día.';
  }

  if (!values.appointment_time) {
    errors.appointment_time = 'Elige una hora.';
  } else if (!TIME_SLOTS.includes(values.appointment_time)) {
    errors.appointment_time = 'Elige una hora dentro del horario (11:00 a 19:30).';
  } else if (values.appointment_date && isPastSlot(values.appointment_date, values.appointment_time, now)) {
    errors.appointment_time = 'Esa hora ya pasó. Elige otra.';
  }

  if (values.client_name.trim().length < 3) errors.client_name = 'Escribe tu nombre completo.';

  const digits = values.client_phone.replace(/\D/g, '');
  if (!digits) {
    errors.client_phone = 'Necesitamos tu WhatsApp para confirmarte.';
  } else if (!/^\+?[\d\s()-]+$/.test(values.client_phone.trim()) || digits.length < 7 || digits.length > 15) {
    errors.client_phone = 'Revisa el número: solo dígitos, entre 7 y 15.';
  }

  return errors;
}
