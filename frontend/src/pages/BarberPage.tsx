import { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { AppointmentList } from '@/features/admin/AppointmentList';
import { computeStats } from '@/features/admin/status';
import { StatsGrid } from '@/features/admin/StatsGrid';
import { useAppointments } from '@/features/admin/useAppointments';
import { useAuth } from '@/features/auth/auth-context';
import { getBarberAppointments } from '@/lib/citas';
import { cn } from '@/lib/utils';

/** Agenda del barbero: solo sus citas (las reglas de Firestore lo garantizan). */
export default function BarberPage() {
  const { user, profile } = useAuth();
  const barberoId = user?.barberoId;
  const load = useCallback(
    () => (barberoId ? getBarberAppointments(barberoId) : Promise.resolve([])),
    [barberoId],
  );
  const { appointments, loading, error, updatingId, refresh, updateStatus } = useAppointments({ load, actor: 'barbero' });
  const stats = computeStats(appointments);

  return (
    <PublicLayout>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted">{profile?.full_name ?? 'Tu cuenta'}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Mi agenda</h1>
          </div>
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={loading}
            icon={<RefreshCw aria-hidden className={cn('size-4', loading && 'animate-spin')} />}
          >
            Actualizar
          </Button>
        </div>

        {!barberoId && (
          <Alert tone="danger" title="Tu cuenta aún no está vinculada a un barbero">
            Pídele al administrador que te asigne tu perfil de barbero.
          </Alert>
        )}

        <StatsGrid stats={stats} loading={loading && appointments.length === 0} unavailable={Boolean(error) && appointments.length === 0} />

        <AppointmentList
          appointments={appointments}
          loading={loading}
          error={error}
          updatingId={updatingId}
          onRetry={refresh}
          onUpdateStatus={updateStatus}
        />
      </div>
    </PublicLayout>
  );
}
