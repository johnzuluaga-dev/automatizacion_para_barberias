import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Check, CheckCheck, RotateCw, X } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import type { Appointment, AppointmentStatus } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { availableActions, STATUS_META } from './status';

type Filter = 'all' | AppointmentStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

function formatDay(iso: string) {
  return format(new Date(`${iso}T00:00:00`), "d 'de' MMM", { locale: es });
}

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  updatingId: string | null;
  onRetry: () => void;
  onUpdateStatus: (appointment: Appointment, status: AppointmentStatus) => void;
}

export function AppointmentList({ appointments, loading, error, updatingId, onRetry, onUpdateStatus }: AppointmentListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [toCancel, setToCancel] = useState<Appointment | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const a of appointments) c[a.status] += 1;
    return c;
  }, [appointments]);

  const showSkeleton = loading && appointments.length === 0;

  return (
    <section aria-labelledby="agenda-title" className="rounded-lg border border-line bg-surface">
      <div className="flex flex-col gap-4 border-b border-line px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="agenda-title" className="text-xl font-semibold">
            Agenda en Tiempo Real
          </h2>
          {loading && !showSkeleton && <Spinner label="Actualizando citas" className="text-muted" />}
        </div>
        <div role="group" aria-label="Filtrar por estado" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150',
                filter === f.value
                  ? 'border-ink bg-ink text-bg'
                  : 'border-line-strong text-muted hover:border-ink/40 hover:text-ink',
              )}
            >
              {f.label}
              <span className="tabular text-xs opacity-70">{counts[f.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 sm:p-6">
          <Alert
            tone="danger"
            title="No pudimos cargar la agenda"
            action={
              <Button size="sm" variant="secondary" icon={<RotateCw aria-hidden className="size-4" />} onClick={onRetry}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        </div>
      )}

      {showSkeleton && (
        <ul aria-label="Cargando citas" className="divide-y divide-line">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-5 sm:px-6">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-4 w-28 sm:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={<CalendarDays />}
          title={appointments.length === 0 ? 'No hay citas registradas todavía.' : 'Nada por aquí'}
          description={
            appointments.length === 0
              ? 'Cuando un cliente agende desde la web, su cita aparecerá en esta lista.'
              : 'No hay citas con este estado.'
          }
          action={
            appointments.length > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                Ver todas
              </Button>
            ) : undefined
          }
        />
      )}

      {visible.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sr-only md:not-sr-only">
              <tr className="border-b border-line text-xs whitespace-nowrap text-muted">
                <th scope="col" className="px-6 py-3 font-medium">Cliente</th>
                <th scope="col" className="px-4 py-3 font-medium">Servicio</th>
                <th scope="col" className="px-4 py-3 font-medium">Barbero</th>
                <th scope="col" className="px-4 py-3 font-medium">Fecha / Hora</th>
                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                <th scope="col" className="px-6 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((apt) => {
                const actions = availableActions(apt.status);
                const meta = STATUS_META[apt.status] ?? { label: apt.status, tone: 'neutral' as const };
                const busy = updatingId === apt.id;
                return (
                  <tr
                    key={apt.id}
                    className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-4 py-4 transition-colors duration-150 hover:bg-surface-2/50 sm:px-6 md:table-row md:p-0"
                  >
                    <td className="md:px-6 md:py-4">
                      <div className="font-semibold text-ink">{apt.client_name}</div>
                      <div className="tabular text-xs text-muted">{apt.client_phone}</div>
                    </td>
                    <td className="col-start-2 row-start-1 self-start md:hidden">
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="col-span-2 text-muted md:px-4 md:py-4">
                      <span className="text-ink md:text-muted">{apt.service}</span>
                      <span className="md:hidden"> · {apt.barber}</span>
                    </td>
                    <td className="hidden text-muted md:table-cell md:px-4 md:py-4">{apt.barber}</td>
                    <td className="col-span-2 md:px-4 md:py-4">
                      <span className="font-medium md:block">{formatDay(apt.appointment_date)}</span>
                      <span className="tabular text-muted md:block md:text-xs">
                        <span className="md:hidden"> · </span>
                        {apt.appointment_time}
                      </span>
                    </td>
                    <td className="hidden md:table-cell md:px-4 md:py-4">
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="col-span-2 md:px-6 md:py-4">
                      <div className="flex flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end">
                        {busy ? (
                          <Spinner label="Actualizando estado" className="size-5 text-muted" />
                        ) : (
                          <>
                            {actions.confirm && (
                              <Button size="sm" variant="secondary" icon={<Check aria-hidden className="size-4" />} onClick={() => onUpdateStatus(apt, 'confirmed')}>
                                Confirmar
                              </Button>
                            )}
                            {actions.complete && (
                              <Button size="sm" variant="secondary" icon={<CheckCheck aria-hidden className="size-4" />} onClick={() => onUpdateStatus(apt, 'completed')}>
                                Completar
                              </Button>
                            )}
                            {actions.cancel && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-danger-text hover:bg-danger-soft hover:text-danger-text"
                                icon={<X aria-hidden className="size-4" />}
                                onClick={() => setToCancel(apt)}
                              >
                                Cancelar
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        title="¿Cancelar esta cita?"
        description={
          toCancel
            ? `${toCancel.client_name} · ${toCancel.service} · ${formatDay(toCancel.appointment_date)} ${toCancel.appointment_time}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setToCancel(null)}>
              Mantener
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toCancel) onUpdateStatus(toCancel, 'cancelled');
                setToCancel(null);
              }}
            >
              Sí, cancelar
            </Button>
          </>
        }
      />
    </section>
  );
}
