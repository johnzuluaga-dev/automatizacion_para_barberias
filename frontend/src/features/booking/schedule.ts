import { addDays, format, getDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TimeRange, WeeklySchedule } from './catalog';

/** Cada turno dura 30 minutos; los servicios ocupan uno o más turnos seguidos. */
export const SLOT_MINUTES = 30;

/** Horario por defecto (antes de elegir barbero): lunes a sábado, 11:00 a 20:00. */
const OPEN_DAY: TimeRange[] = [{ desde: '11:00', hasta: '20:00' }];
export const DEFAULT_SCHEDULE: WeeklySchedule = { '1': OPEN_DAY, '2': OPEN_DAY, '3': OPEN_DAY, '4': OPEN_DAY, '5': OPEN_DAY, '6': OPEN_DAY };

export const ISO_DATE = 'yyyy-MM-dd';

export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE);
}

/** Convierte "yyyy-MM-dd" a Date local (sin desfase por zona horaria). */
export function fromIsoDate(iso: string): Date {
  return parseISO(iso);
}

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Tramos de atención del día según el horario. */
export function dayRanges(iso: string, schedule: WeeklySchedule = DEFAULT_SCHEDULE): TimeRange[] {
  return schedule[String(getDay(fromIsoDate(iso)))] ?? [];
}

export function isClosedDay(iso: string, schedule: WeeklySchedule = DEFAULT_SCHEDULE): boolean {
  return dayRanges(iso, schedule).length === 0;
}

/** Horas de inicio posibles ese día: el servicio debe terminar dentro del tramo de atención. */
export function slotsFor(iso: string, schedule: WeeklySchedule = DEFAULT_SCHEDULE, durationMin: number = SLOT_MINUTES): string[] {
  return dayRanges(iso, schedule).flatMap(({ desde, hasta }) => {
    const slots: string[] = [];
    for (let t = toMinutes(desde); t + durationMin <= toMinutes(hasta); t += SLOT_MINUTES) slots.push(toTime(t));
    return slots;
  });
}

/** Turnos de 30 minutos que ocupa un servicio que empieza a `time` ("HH:mm"). */
export function slotCells(time: string, durationMin: number = SLOT_MINUTES): string[] {
  const start = toMinutes(time);
  return Array.from({ length: Math.ceil(durationMin / SLOT_MINUTES) }, (_, i) => toTime(start + i * SLOT_MINUTES));
}

/** Colombia es UTC-5 todo el año (sin horario de verano). */
export const BOGOTA_OFFSET = '-05:00';

/** Momento exacto (UTC) en que empieza un turno de la barbería. */
export function slotStart(iso: string, time: string): Date {
  return new Date(`${iso}T${time}:00${BOGOTA_OFFSET}`);
}

export interface DayOption {
  iso: string;
  date: Date;
  closed: boolean;
}

/** Próximos `count` días a partir de hoy; los días sin atención vienen marcados como cerrados. */
export function upcomingDays(count: number, today: Date = new Date(), schedule: WeeklySchedule = DEFAULT_SCHEDULE): DayOption[] {
  const start = startOfDay(today);
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i);
    const iso = toIsoDate(date);
    return { iso, date, closed: isClosedDay(iso, schedule) };
  });
}

export function isPastDay(iso: string, now: Date = new Date()): boolean {
  return fromIsoDate(iso) < startOfDay(now);
}

/** Un turno ya no se puede reservar si es hoy y su hora ya pasó. */
export function isPastSlot(iso: string, slot: string, now: Date = new Date()): boolean {
  if (iso !== toIsoDate(now)) return isPastDay(iso, now);
  return toMinutes(slot) <= now.getHours() * 60 + now.getMinutes();
}

export function formatLongDate(iso: string): string {
  return format(fromIsoDate(iso), "EEEE d 'de' MMMM", { locale: es });
}
