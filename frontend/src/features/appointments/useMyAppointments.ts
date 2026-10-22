import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast/toast-context';
import { cancelMyAppointment, getMyAppointments, type Appointment } from '@/lib/citas';

interface State {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

export function useMyAppointments() {
  const toast = useToast();
  const [state, setState] = useState<State>({ appointments: [], loading: true, error: null });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMyAppointments();
      setState({ appointments: data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'No pudimos cargar tus citas.' }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    void load();
  }, [load]);

  const cancel = useCallback(
    async (appointment: Appointment) => {
      setCancellingId(appointment.id);
      try {
        await cancelMyAppointment(appointment.id);
        setState((s) => ({
          ...s,
          appointments: s.appointments.map((a) => (a.id === appointment.id ? { ...a, status: 'cancelada' } : a)),
        }));
        toast({ tone: 'success', title: 'Cita cancelada', description: `${appointment.service} · ${appointment.appointment_time}` });
      } catch (err) {
        toast({ tone: 'danger', title: err instanceof Error ? err.message : 'No pudimos cancelar la cita.' });
      } finally {
        setCancellingId(null);
      }
    },
    [toast],
  );

  return { ...state, cancellingId, refresh, cancel };
}
