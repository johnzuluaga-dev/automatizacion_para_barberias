export interface Service {
  id: string;
  name: string;
  price: number;
  /** Minutos que ocupa en la agenda (múltiplo de 30). */
  durationMin: number;
}

/** Tramo de atención de un día, p. ej. { desde: '11:00', hasta: '20:00' }. */
export interface TimeRange {
  desde: string;
  hasta: string;
}

/** Horario por día de la semana (0 = domingo … 6 = sábado); un día sin tramos está cerrado. */
export type WeeklySchedule = Record<string, TimeRange[]>;

export interface Barber {
  id: string;
  name: string;
  /** IDs de los servicios que ofrece. */
  serviceIds: string[];
  schedule: WeeklySchedule;
}

export interface Catalog {
  services: Service[];
  barbers: Barber[];
}

export function formatPrice(price: number): string {
  return `$${price}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}
