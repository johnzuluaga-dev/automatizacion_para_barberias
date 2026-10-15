import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { AppointmentStats } from './status';

interface StatsGridProps {
  stats: AppointmentStats;
  loading: boolean;
  /** Sin datos (falló la carga): muestra guiones en vez de ceros engañosos. */
  unavailable?: boolean;
}

/**
 * Métricas con jerarquía deliberada: el ingreso estimado es protagonista,
 * el resto acompaña en una banda compacta.
 */
export function StatsGrid({ stats, loading, unavailable = false }: StatsGridProps) {
  const show = (value: number | string) => (unavailable ? '—' : value);
  const secondary = [
    { label: 'Citas Totales', value: stats.total },
    { label: 'Completadas', value: stats.completed },
    { label: 'Canceladas', value: stats.cancelled },
  ];

  return (
    <section aria-label="Resumen" className="grid gap-3 md:grid-cols-[1.3fr_2fr]">
      <div className="flex flex-col justify-between rounded-lg bg-ink p-5 text-bg sm:p-6">
        <p className="text-sm text-bg/70">Ingresos Est.</p>
        {loading ? (
          <Skeleton className="mt-6 h-12 w-32 bg-bg/15" />
        ) : (
          <p className="tabular mt-6 font-display text-5xl font-bold tracking-tight">{show(`$${stats.revenue}`)}</p>
        )}
        <p className="mt-2 text-xs text-bg/60">Confirmadas + completadas</p>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface">
        {secondary.map(({ label, value }, i) => (
          <div key={label} className={cn('flex flex-col justify-between gap-6 p-4 sm:p-5', i === 2 && 'text-danger-text')}>
            <dt className={cn('text-xs sm:text-sm', i === 2 ? 'text-danger-text' : 'text-muted')}>{label}</dt>
            <dd className="tabular font-display text-3xl font-semibold">
              {loading ? <Skeleton className="h-9 w-10" /> : show(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
