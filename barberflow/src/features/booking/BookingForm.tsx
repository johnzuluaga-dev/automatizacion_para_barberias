import { useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Phone, User } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { sendBookingToN8n } from '@/lib/n8n';
import { BarberPicker } from './BarberPicker';
import { BookingHero } from './BookingHero';
import { BookingSuccess } from './BookingSuccess';
import { BookingTicket } from './BookingTicket';
import { findService } from './catalog';
import { DateTimePicker } from './DateTimePicker';
import { isPastSlot } from './schedule';
import { ServicePicker } from './ServicePicker';
import { StepLegend } from './StepLegend';
import { EMPTY_BOOKING, FIELD_ORDER, validateBooking, type BookingErrors, type BookingFormValues } from './validation';

type Status = 'idle' | 'loading' | 'success';

export function BookingForm() {
  const [values, setValues] = useState<BookingFormValues>(EMPTY_BOOKING);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) {
    const next = { ...values, [field]: value };
    // Si el nuevo día deja la hora elegida en el pasado, se descarta la hora.
    if (field === 'appointment_date' && next.appointment_time && isPastSlot(next.appointment_date, next.appointment_time)) {
      next.appointment_time = '';
    }
    setValues(next);
    if (attempted) setErrors(validateBooking(next));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    setSubmitError(null);

    const found = validateBooking(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((key) => found[key]);
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }

    setStatus('loading');
    try {
      const price = findService(values.service)?.price ?? 0;
      await sendBookingToN8n({ ...values, price });
      setStatus('success');
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al agendar la cita. Intenta nuevamente.');
      setStatus('idle');
    }
  }

  function reset() {
    setValues(EMPTY_BOOKING);
    setErrors({});
    setAttempted(false);
    setSubmitError(null);
    setStatus('idle');
  }

  if (status === 'success') {
    return <BookingSuccess values={values} onReset={reset} />;
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Agendar cita"
      className="mx-auto grid max-w-6xl grid-cols-1 gap-x-12 px-4 pt-10 pb-36 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:pb-20"
    >
      <div className="flex min-w-0 flex-col gap-10">
        <BookingHero />

        <AnimatePresence initial={false}>
          {submitError && (
            <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert tone="danger" title="No pudimos agendar tu cita">
                {submitError}
              </Alert>
            </m.div>
          )}
          {attempted && errorCount > 0 && !submitError && (
            <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert tone="danger">
                {errorCount === 1 ? 'Falta un dato para agendar tu cita.' : `Faltan ${errorCount} datos para agendar tu cita.`}
              </Alert>
            </m.div>
          )}
        </AnimatePresence>

        <ServicePicker value={values.service} onChange={(v) => update('service', v)} error={errors.service} />
        <BarberPicker value={values.barber} onChange={(v) => update('barber', v)} error={errors.barber} />
        <DateTimePicker
          date={values.appointment_date}
          time={values.appointment_time}
          onDateChange={(v) => update('appointment_date', v)}
          onTimeChange={(v) => update('appointment_time', v)}
          dateError={errors.appointment_date}
          timeError={errors.appointment_time}
        />

        <fieldset className="min-w-0">
          <legend className="mb-3 w-full">
            <StepLegend step={5} title="Tus datos" />
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="field-client_name"
              label="Nombre completo"
              placeholder="Ej. Juan Pérez"
              autoComplete="name"
              required
              icon={<User />}
              value={values.client_name}
              onChange={(e) => update('client_name', e.target.value)}
              error={errors.client_name}
            />
            <TextField
              id="field-client_phone"
              label="Teléfono (WhatsApp)"
              placeholder="Ej. 300 123 4567"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              icon={<Phone />}
              value={values.client_phone}
              onChange={(e) => update('client_phone', e.target.value)}
              error={errors.client_phone}
              hint="Aquí te llega la confirmación y el recordatorio."
            />
          </div>
        </fieldset>

        <p className="text-sm text-muted">* No se agendan citas los domingos.</p>
      </div>

      <div className="lg:row-span-1">
        <BookingTicket
          values={values}
          action={
            <Button type="submit" size="lg" className="w-full" loading={status === 'loading'} loadingText="Verificando disponibilidad...">
              Agendar Cita
            </Button>
          }
        />
      </div>
    </form>
  );
}
