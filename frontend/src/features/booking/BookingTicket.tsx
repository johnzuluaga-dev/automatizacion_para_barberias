import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice, type Barber, type Service } from './catalog';
import { formatLongDate } from './schedule';
import type { BookingFormValues } from './validation';

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={cn('text-right text-sm font-medium first-letter:uppercase', !value && 'text-muted/70')}>{value || '—'}</dd>
    </div>
  );
}

/** Separador troquelado del ticket: línea punteada con dos muescas laterales. */
export function Perforation({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative my-4 h-px', className)}>
      <div className="absolute inset-x-5 top-0 border-t border-dashed border-line-strong" />
      <span className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full border border-line bg-bg [clip-path:inset(0_0_0_50%)]" />
      <span className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full border border-line bg-bg [clip-path:inset(0_50%_0_0)]" />
    </div>
  );
}

interface TicketDetailsProps {
  values: BookingFormValues;
  service?: Service;
  barber?: Barber;
}

export function TicketDetails({ values, service, barber }: TicketDetailsProps) {
  return (
    <dl className="divide-y divide-line/70">
      <Row label="Servicio" value={service?.name} />
      <Row label="Barbero" value={barber?.name} />
      <Row label="Día" value={values.appointment_date ? formatLongDate(values.appointment_date) : undefined} />
      <Row label="Hora" value={values.appointment_time} />
    </dl>
  );
}

interface BookingTicketProps {
  values: BookingFormValues;
  service?: Service;
  barber?: Barber;
  /** Botón de envío (único en el DOM; se reubica según el ancho). */
  action: ReactNode;
}

/**
 * Resumen tipo "ticket". En escritorio queda fijo en la columna derecha;
 * en móvil se convierte en una barra inferior con total y botón.
 */
export function BookingTicket({ values, service, barber, action }: BookingTicketProps) {
  const compact = [service?.name, values.appointment_time].filter(Boolean).join(' · ');

  return (
    <aside
      aria-label="Resumen de tu cita"
      className={cn(
        'bf-mobile-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-sm',
        'lg:sticky lg:top-24 lg:inset-x-auto lg:bottom-auto lg:rounded-xl lg:border lg:bg-surface lg:p-6 lg:shadow-md lg:backdrop-blur-none',
      )}
    >
      <div className="hidden lg:block">
        <p className="font-display text-xl font-semibold">Tu cita</p>
        <div className="mt-3">
          <TicketDetails values={values} service={service} barber={barber} />
        </div>
        <Perforation className="-mx-6" />
      </div>

      <div className="flex items-center gap-4 lg:flex-col lg:items-stretch">
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted lg:text-sm">Total</p>
            <p className="truncate text-xs text-muted lg:hidden">{compact || 'Elige tu servicio'}</p>
          </div>
          <p className="tabular font-display text-2xl font-bold lg:text-3xl" aria-live="polite">
            {service ? formatPrice(service.price) : '$0'}
          </p>
        </div>
        <div className="shrink-0 lg:w-full">{action}</div>
      </div>

      <p className="mt-3 hidden text-xs text-muted lg:block">
        Queda confirmada al instante si el horario está libre.
      </p>
    </aside>
  );
}
