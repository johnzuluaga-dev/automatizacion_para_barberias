import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast/toast-context';
import {
  getAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
  type StatusActor,
} from '@/lib/citas';
import { config } from '@/lib/config';
import { sendCancellationToN8n } from '@/lib/n8n';
import { STATUS_META } from './status';

interface State {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

interface Options {
  /** Cómo se cargan las citas (por defecto, todas: agenda del admin). */
  load?: () => Promise<Appointment[]>;
  /** Quién cambia los estados. */
  actor?: StatusActor;
}

export function useAppointments({ load: loader = getAppointments, actor = 'admin' }: Options = {}) {
  const toast = useToast();
  const [state, setState] = useState<State>({ appointments: [], loading: true, error: null });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await loader();
      setState({ appointments: data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Error al cargar citas' }));
    }
  }, [loader]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    void load();
  }, [load]);

  const updateStatus = useCallback(
    async (appointment: Appointment, status: AppointmentStatus) => {
      setUpdatingId(appointment.id);
      try {
        await updateAppointmentStatus(appointment.id, status, actor);
        if (status === 'cancelada' && config.n8nCancelledEnabled) {
          // Aviso opcional por WhatsApp; si falla, la cancelación ya está guardada.
          void sendCancellationToN8n(appointment.id).catch(() => undefined);
        }
        setState((s) => ({
          ...s,
          appointments: s.appointments.map((a) => (a.id === appointment.id ? { ...a, status } : a)),
        }));
        toast({
          tone: 'success',
          title: `Cita ${STATUS_META[status].label.toLowerCase()}`,
          description: `${appointment.client_name} · ${appointment.appointment_time}`,
        });
      } catch {
        toast({ tone: 'danger', title: 'Error al actualizar el estado. Intenta de nuevo.' });
      } finally {
        setUpdatingId(null);
      }
    },
    [toast, actor],
  );

  return { ...state, updatingId, refresh, updateStatus };
}
