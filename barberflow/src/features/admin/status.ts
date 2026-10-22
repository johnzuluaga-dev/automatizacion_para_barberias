import type { BadgeTone } from '@/components/ui/Badge';
import type { Appointment, AppointmentStatus } from '@/lib/citas';

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  confirmed: { label: 'Confirmada', tone: 'info' },
  completed: { label: 'Completada', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
};

/** Ingreso estimado por cita (mismo cálculo que la versión anterior). */
export const ESTIMATED_TICKET = 20;

export interface AppointmentStats {
  total: number;
  revenue: number;
  cancelled: number;
  completed: number;
  confirmed: number;
  pending: number;
}

export function computeStats(appointments: readonly Appointment[]): AppointmentStats {
  const count = (s: AppointmentStatus) => appointments.filter((a) => a.status === s).length;
  const completed = count('completed');
  const confirmed = count('confirmed');
  return {
    total: appointments.length,
    revenue: (completed + confirmed) * ESTIMATED_TICKET,
    cancelled: count('cancelled'),
    completed,
    confirmed,
    pending: count('pending'),
  };
}

/** Acciones disponibles según el estado actual (mismas reglas que antes). */
export function availableActions(status: AppointmentStatus) {
  return {
    confirm: status === 'pending',
    complete: status !== 'completed' && status !== 'cancelled',
    cancel: status !== 'cancelled',
  };
}
