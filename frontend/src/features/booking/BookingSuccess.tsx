import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router';
import { CalendarDays, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { formatPrice, type Barber, type Service } from './catalog';
import { Perforation, TicketDetails } from './BookingTicket';
import type { BookingFormValues } from './validation';

interface BookingSuccessProps {
  values: BookingFormValues;
  service?: Service;
  barber?: Barber;
  onReset: () => void;
}

export function BookingSuccess({ values, service, barber, onReset }: BookingSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border border-line bg-surface p-6 shadow-md sm:p-8"
      >
        <m.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 22 }}
          aria-hidden
          className="grid size-12 place-items-center rounded-full bg-success-soft text-success-text"
        >
          <Check className="size-6" strokeWidth={2.5} />
        </m.span>

        <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-3xl font-bold focus:outline-none">
          ¡Cita agendada!
        </h1>
        <p className="mt-2 text-muted">
          Quedó <strong className="font-semibold text-ink">pendiente</strong> hasta que la barbería la confirme. La verás en Mis citas.
        </p>

        <Perforation className="-mx-6 sm:-mx-8" />

        <TicketDetails values={values} service={service} barber={barber} />
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-muted">Total</span>
          <span className="tabular font-display text-2xl font-bold">{service ? formatPrice(service.price) : '$0'}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/mis-citas" className={buttonStyles({ size: 'lg', className: 'w-full' })}>
            <CalendarDays aria-hidden className="size-4" />
            Ver mis citas
          </Link>
          <Button variant="secondary" size="lg" className="w-full" onClick={onReset}>
            Agendar otra cita
          </Button>
        </div>
      </m.div>
    </div>
  );
}
