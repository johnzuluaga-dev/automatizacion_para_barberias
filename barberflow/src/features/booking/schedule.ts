import { addDays, format, isSunday, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

/** Horario de atención: 11:00 a 20:00, turnos de 30 minutos (el último inicia 19:30). */
export const OPENING_HOUR = 11;
export const CLOSING_HOUR = 20;
export const SLOT_MINUTES = 30;

export const TIME_SLOTS: readonly string[] = Array.from(
  { length: ((CLOSING_HOUR - OPENING_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => {
    const minutes = OPENING_HOUR * 60 + i * SLOT_MINUTES;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  },
);

export const ISO_DATE = 'yyyy-MM-dd';

export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE);
}

/** Convierte "yyyy-MM-dd" a Date local (sin desfase por zona horaria). */
export function fromIsoDate(iso: string): Date {
  return parseISO(iso);
}

export interface DayOption {
  iso: string;
  date: Date;
  closed: boolean;
}

/** Próximos `count` días a partir de hoy; los domingos vienen marcados como cerrados. */
export function upcomingDays(count: number, today: Date = new Date()): DayOption[] {
  const start = startOfDay(today);
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i);
    return { iso: toIsoDate(date), date, closed: isSunday(date) };
  });
}

export function isClosedDay(iso: string): boolean {
  return isSunday(fromIsoDate(iso));
}

export function isPastDay(iso: string, now: Date = new Date()): boolean {
  return fromIsoDate(iso) < startOfDay(now);
}

/** Un turno ya no se puede reservar si es hoy y su hora ya pasó. */
export function isPastSlot(iso: string, slot: string, now: Date = new Date()): boolean {
  if (iso !== toIsoDate(now)) return isPastDay(iso, now);
  const [h = 0, m = 0] = slot.split(':').map(Number);
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
}

export function formatLongDate(iso: string): string {
  return format(fromIsoDate(iso), "EEEE d 'de' MMMM", { locale: es });
}
