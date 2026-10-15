import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { findService, formatPrice } from './catalog';
import { Perforation, TicketDetails } from './BookingTicket';
import type { BookingFormValues } from './validation';

interface BookingSuccessProps {
  values: BookingFormValues;
  onReset: () => void;
}

export function BookingSuccess({ values, onReset }: BookingSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const service = findService(values.service);

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
          className="grid size-12 place-items-center rounded-full bg-success-soft text-success"
        >
          <Check className="size-6" strokeWidth={2.5} />
        </m.span>

        <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-3xl font-bold focus:outline-none">
          ¡Cita Confirmada!
        </h1>
        <p className="mt-2 text-muted">
          Tu cita ha sido registrada. Recibirás un mensaje de WhatsApp con los detalles en breve.
        </p>

        <Perforation className="-mx-6 sm:-mx-8" />

        <TicketDetails values={values} />
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-muted">Total</span>
          <span className="tabular font-display text-2xl font-bold">{service ? formatPrice(service.price) : '$0'}</span>
        </div>

        <p className="mt-5 flex items-start gap-2 rounded-md bg-accent-2-soft px-3 py-2.5 text-sm text-accent-2">
          <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          Enviaremos la confirmación a {values.client_phone}.
        </p>

        <Button size="lg" className="mt-6 w-full" onClick={onReset}>
          Agendar otra cita
        </Button>
      </m.div>
    </div>
  );
}
