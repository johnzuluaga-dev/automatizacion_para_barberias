import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, m } from 'motion/react';
import { FileText, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Report } from './reports';

interface ReportsPanelProps {
  reports: Report[];
  generating: boolean;
}

export function ReportsPanel({ reports, generating }: ReportsPanelProps) {
  return (
    <section aria-label="Reportes" className="flex flex-col gap-4">
      {generating && (
        <div role="status" className="rounded-lg border border-line bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Sparkles aria-hidden className="size-4 text-accent" />
            Analizando la agenda...
          </p>
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      )}

      {reports.length === 0 && !generating && (
        <EmptyState icon={<FileText />} title="Aún no hay reportes" description="Genera el primero desde el botón de arriba." />
      )}

      <AnimatePresence initial={false}>
        {reports.map((report) => (
          <m.article
            key={report.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 rounded-lg border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[14rem_1fr]"
          >
            <header>
              <p className="flex items-center gap-1.5 text-xs font-medium text-accent">
                <FileText aria-hidden className="size-3.5" />
                Reporte
              </p>
              <h3 className="mt-2 text-xl font-semibold first-letter:uppercase">
                {format(new Date(`${report.week}T00:00:00`), "d 'de' MMMM yyyy", { locale: es })}
              </h3>
            </header>
            <div>
              {report.stats && (
                <dl className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
                  {[
                    ['Citas confirmadas', report.stats.confirmed],
                    ['Completadas', report.stats.completed],
                    ['Canceladas', report.stats.cancelled],
                    ['Ingresos estimados', `$${report.stats.revenue}`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-surface px-3 py-2.5">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="tabular font-display text-xl font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="max-w-prose leading-relaxed text-ink/85">{report.summary}</p>
            </div>
          </m.article>
        ))}
      </AnimatePresence>
    </section>
  );
}
