import type { BadgeTone } from '@/components/ui/Badge';
import type { Appointment, AppointmentStatus } from '@/lib/citas';

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  confirmada: { label: 'Confirmada', tone: 'info' },
  completada: { label: 'Completada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
  no_asistio: { label: 'No asistió', tone: 'neutral' },
};

/** Ingreso estimado por cita (mismo cálculo que la versión anterior). */
export const ESTIMATED_TICKET = 20;

export interface AppointmentStats {
  total: number;
  revenue: number;
  cancelled: number;
  noShow: number;
  completed: number;
  confirmed: number;
  pending: number;
}

export function computeStats(appointments: readonly Appointment[]): AppointmentStats {
  const count = (s: AppointmentStatus) => appointments.filter((a) => a.status === s).length;
  const completed = count('completada');
  const confirmed = count('confirmada');
  return {
    total: appointments.length,
    revenue: (completed + confirmed) * ESTIMATED_TICKET,
    cancelled: count('cancelada'),
    noShow: count('no_asistio'),
    completed,
    confirmed,
    pending: count('pendiente'),
  };
}

/** Acciones disponibles según el estado actual (mismas reglas que antes). */
export function availableActions(status: AppointmentStatus) {
  return {
    confirm: status === 'pendiente',
    complete: status === 'pendiente' || status === 'confirmada',
    noShow: status === 'confirmada',
    cancel: status === 'pendiente' || status === 'confirmada',
  };
}
