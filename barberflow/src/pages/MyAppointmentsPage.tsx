import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router';
import { CalendarPlus, CalendarX2, RotateCw } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { STATUS_META } from '@/features/admin/status';
import { useMyAppointments } from '@/features/appointments/useMyAppointments';
import { useAuth } from '@/features/auth/auth-context';
import { formatLongDate, fromIsoDate, toIsoDate } from '@/features/booking/schedule';
import type { Appointment } from '@/lib/supabase';

function isUpcoming(a: Appointment, today: string) {
  return a.appointment_date >= today && (a.status === 'pending' || a.status === 'confirmed');
}

function AppointmentRow({
  appointment,
  onCancel,
  busy,
}: {
  appointment: Appointment;
  onCancel?: () => void;
  busy?: boolean;
}) {
  const meta = STATUS_META[appointment.status] ?? { label: appointment.status, tone: 'neutral' as const };
  return (
    <li className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-6">
      <div className="tabular flex w-14 flex-col items-center rounded-md border border-line bg-bg py-1.5 text-center">
        <span className="text-[0.6875rem] text-muted uppercase">{format(fromIsoDate(appointment.appointment_date), 'EEE', { locale: es }).replace('.', '')}</span>
        <span className="font-display text-xl leading-tight font-semibold">{appointment.appointment_date.slice(8, 10)}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{appointment.service}</p>
        <p className="text-sm text-muted first-letter:uppercase">
          {formatLongDate(appointment.appointment_date)} · <span className="tabular">{appointment.appointment_time}</span> ·{' '}
          {appointment.barber}
        </p>
        <Badge tone={meta.tone} dot className="mt-2">
          {meta.label}
        </Badge>
      </div>
      {onCancel && (
        <div className="col-span-2 sm:col-span-1">
          <Button
            variant="ghost"
            size="sm"
            loading={busy}
            className="text-danger-text hover:bg-danger-soft hover:text-danger-text"
            icon={<CalendarX2 aria-hidden className="size-4" />}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      )}
    </li>
  );
}

export default function MyAppointmentsPage() {
  const { profile } = useAuth();
  const { appointments, loading, error, cancellingId, refresh, cancel } = useMyAppointments();
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [today] = useState(() => toIsoDate(new Date()));

  const upcoming = appointments.filter((a) => isUpcoming(a, today)).reverse();
  const past = appointments.filter((a) => !isUpcoming(a, today));

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted">{profile?.full_name ?? 'Tu cuenta'}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Mis citas</h1>
          </div>
          <Link to="/" className={buttonStyles({ className: 'self-start sm:self-auto' })}>
            <CalendarPlus aria-hidden className="size-4" />
            Agendar cita
          </Link>
        </div>

        {error && (
          <Alert
            tone="danger"
            className="mt-8"
            title="No pudimos cargar tus citas"
            action={
              <Button size="sm" variant="secondary" icon={<RotateCw aria-hidden className="size-4" />} onClick={refresh}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading && (
          <ul aria-label="Cargando tus citas" className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-5 sm:px-6">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && (
          <div className="mt-8 flex flex-col gap-10">
            <section aria-labelledby="proximas">
              <h2 id="proximas" className="text-lg font-semibold">
                Próximas
              </h2>
              {upcoming.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-line-strong">
                  <EmptyState
                    icon={<CalendarPlus />}
                    title="No tienes citas próximas"
                    description="Elige servicio, barbero y hora; queda pendiente hasta que la barbería la confirme."
                    action={
                      <Link to="/" className={buttonStyles()}>
                        Agendar cita
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                  {upcoming.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} busy={cancellingId === a.id} onCancel={() => setToCancel(a)} />
                  ))}
                </ul>
              )}
            </section>

            {past.length > 0 && (
              <section aria-labelledby="anteriores">
                <h2 id="anteriores" className="text-lg font-semibold">
                  Anteriores y canceladas
                </h2>
                <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                  {past.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      <Modal
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        title="¿Cancelar esta cita?"
        description={
          toCancel ? `${toCancel.service} · ${formatLongDate(toCancel.appointment_date)} · ${toCancel.appointment_time}` : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setToCancel(null)}>
              Mantener
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toCancel) void cancel(toCancel);
                setToCancel(null);
              }}
            >
              Sí, cancelar
            </Button>
          </>
        }
      />
    </PublicLayout>
  );
}
