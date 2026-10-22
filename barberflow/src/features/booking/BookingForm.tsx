import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { LogIn, Phone, User } from 'lucide-react';
import { RotateCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth/auth-context';
import { config } from '@/lib/config';
import { sendBookingToN8n } from '@/lib/n8n';
import { createAppointment, DataError } from '@/lib/citas';
import { BarberPicker } from './BarberPicker';
import { BookingHero } from './BookingHero';
import { BookingSuccess } from './BookingSuccess';
import { BookingTicket } from './BookingTicket';
import { DateTimePicker } from './DateTimePicker';
import { saveDraft, takeDraft } from './draft';
import { isPastSlot, slotCells } from './schedule';
import { ServicePicker } from './ServicePicker';
import { StepLegend } from './StepLegend';
import { useCatalog } from './useCatalog';
import { useTakenSlots } from './useTakenSlots';
import { EMPTY_BOOKING, FIELD_ORDER, validateBooking, type BookingErrors, type BookingFormValues } from './validation';

type Status = 'idle' | 'loading' | 'success';
type ContactField = 'client_name' | 'client_phone';

const SELECTION_FIELDS = FIELD_ORDER.filter((f) => f !== 'client_name' && f !== 'client_phone');

export function BookingForm() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [values, setValues] = useState<BookingFormValues>(() => ({ ...EMPTY_BOOKING, ...takeDraft() }));
  // Nombre y celular se precargan del perfil hasta que la persona los edite.
  const [touched, setTouched] = useState<Record<ContactField, boolean>>({ client_name: false, client_phone: false });
  const [errors, setErrors] = useState<BookingErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { catalog, error: catalogError, loading: catalogLoading, retry: retryCatalog } = useCatalog();
  const { taken, blocks, refresh: refreshTaken } = useTakenSlots(values.barber, values.appointment_date);

  const services = catalog?.services ?? [];
  const barbers = catalog?.barbers ?? [];
  const service = services.find((s) => s.id === values.service);
  const barber = barbers.find((b) => b.id === values.barber);
  const barbersForService = service ? barbers.filter((b) => b.serviceIds.includes(service.id)) : barbers;

  const signedIn = Boolean(user);
  const effective: BookingFormValues = {
    ...values,
    client_name: touched.client_name ? values.client_name : values.client_name || profile?.full_name || '',
    client_phone: touched.client_phone ? values.client_phone : values.client_phone || profile?.phone || '',
  };

  function validate(v: BookingFormValues): BookingErrors {
    const found = validateBooking(v, catalog ?? { services: [], barbers: [] });
    if (v.appointment_time && slotCells(v.appointment_time, service?.durationMin).some((cell) => taken.has(cell))) found.appointment_time = 'Esa hora ya está ocupada. Elige otra.';
    if (!signedIn) {
      delete found.client_name;
      delete found.client_phone;
    }
    return found;
  }

  function update<K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) {
    const next = { ...effective, [field]: value };
    // Si el barbero elegido no ofrece el nuevo servicio, se descarta la elección.
    if (field === 'service' && next.barber) {
      const offers = barbers.find((b) => b.id === next.barber)?.serviceIds.includes(value as string);
      if (!offers) next.barber = '';
    }
    // Si el nuevo día deja la hora elegida en el pasado, se descarta la hora.
    if (field === 'appointment_date' && next.appointment_time && isPastSlot(next.appointment_date, next.appointment_time)) {
      next.appointment_time = '';
    }
    if (field === 'client_name' || field === 'client_phone') setTouched((t) => ({ ...t, [field]: true }));
    setValues(next);
    if (attempted) setErrors(validate(next));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    setSubmitError(null);

    const found = validate(effective);
    setErrors(found);
    const firstInvalid = (signedIn ? FIELD_ORDER : SELECTION_FIELDS).find((key) => found[key]);
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }

    if (!user) {
      // Guarda la selección y pide ingresar; al volver, la reserva sigue donde iba.
      saveDraft(effective);
      navigate('/ingresar', { state: { from: '/' } });
      return;
    }

    if (!user.emailVerified) {
      // Las reglas exigen correo verificado para reservar: se guarda la selección y se pide verificar.
      saveDraft(effective);
      navigate('/verificar', { state: { from: '/' } });
      return;
    }

    setStatus('loading');
    try {
      if (!service || !barber) return;
      const created = await createAppointment(
        {
          client_name: effective.client_name.trim(),
          client_phone: effective.client_phone.trim(),
          service,
          barber,
          appointment_date: effective.appointment_date,
          appointment_time: effective.appointment_time,
        },
        user.id,
      );
      if (config.n8nEnabled) {
        // Aviso opcional: n8n lee la cita por su ID; si falla, la cita ya está guardada.
        void sendBookingToN8n(created.id).catch(() => undefined);
      }
      setValues(effective);
      setStatus('success');
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof DataError && err.code === 'slot_taken') {
        refreshTaken();
        setValues((v) => ({ ...v, appointment_time: '' }));
      }
      setSubmitError(err instanceof Error ? err.message : 'No pudimos agendar tu cita. Inténtalo de nuevo.');
      setStatus('idle');
    }
  }

  function reset() {
    setValues(EMPTY_BOOKING);
    setTouched({ client_name: false, client_phone: false });
    setErrors({});
    setAttempted(false);
    setSubmitError(null);
    setStatus('idle');
  }

  if (status === 'success') {
    return <BookingSuccess values={values} service={service} barber={barber} onReset={reset} />;
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Agendar cita"
      className="mx-auto grid max-w-6xl grid-cols-1 gap-x-12 px-4 pt-10 pb-12 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:pb-20"
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

        {catalogLoading && (
          <div role="status" aria-label="Cargando servicios y barberos" className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        {catalogError && (
          <Alert
            tone="danger"
            title="No pudimos cargar el catálogo"
            action={
              <Button size="sm" variant="secondary" icon={<RotateCw aria-hidden className="size-4" />} onClick={retryCatalog}>
                Reintentar
              </Button>
            }
          >
            {catalogError}
          </Alert>
        )}
        {catalog && (
          <>
            <ServicePicker services={services} value={values.service} onChange={(v) => update('service', v)} error={errors.service} />
            <BarberPicker barbers={barbersForService} value={values.barber} onChange={(v) => update('barber', v)} error={errors.barber} />
          </>
        )}
        <DateTimePicker
          date={values.appointment_date}
          time={values.appointment_time}
          onDateChange={(v) => update('appointment_date', v)}
          onTimeChange={(v) => update('appointment_time', v)}
          dateError={errors.appointment_date}
          timeError={errors.appointment_time}
          takenSlots={taken}
          schedule={barber?.schedule}
          durationMin={service?.durationMin}
          blocks={blocks}
        />

        <fieldset className="min-w-0">
          <legend className="mb-3 w-full">
            <StepLegend step={5} title="Tus datos" />
          </legend>
          {signedIn ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="field-client_name"
                label="Nombre completo"
                placeholder="Ej. Juan Pérez"
                autoComplete="name"
                required
                icon={<User />}
                value={effective.client_name}
                onChange={(e) => update('client_name', e.target.value)}
                error={errors.client_name}
              />
              <TextField
                id="field-client_phone"
                label="Celular"
                placeholder="Ej. 300 123 4567"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                icon={<Phone />}
                value={effective.client_phone}
                onChange={(e) => update('client_phone', e.target.value)}
                error={errors.client_phone}
                hint="La barbería lo usa si necesita contactarte."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-lg border border-dashed border-line-strong p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                {authLoading ? 'Revisando tu sesión…' : 'Para agendar necesitas una cuenta. Tu selección se guarda mientras ingresas.'}
              </p>
              <div className="flex shrink-0 gap-2">
                <Link
                  to="/registro"
                  onClick={() => saveDraft(effective)}
                  state={{ from: '/' }}
                  className="inline-flex h-9 items-center rounded-sm px-3 text-sm font-medium text-ink underline-offset-4 hover:underline"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}
        </fieldset>

        <p className="text-sm text-muted">* Solo se agenda dentro del horario de atención de cada barbero.</p>
      </div>

      <div className="lg:row-span-1">
        <BookingTicket
          values={effective}
          service={service}
          barber={barber}
          action={
            signedIn || authLoading ? (
              <Button type="submit" size="lg" className="w-full" loading={status === 'loading'} loadingText="Agendando..." disabled={authLoading}>
                Agendar Cita
              </Button>
            ) : (
              <Button type="submit" size="lg" className="w-full" icon={<LogIn aria-hidden className="size-4" />}>
                Ingresa para agendar
              </Button>
            )
          }
        />
      </div>
    </form>
  );
}
