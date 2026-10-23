import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { CalendarPlus, Check, CircleAlert, LinkIcon } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { linkWhatsAppAppointment } from '@/lib/citas';

type Status = 'idle' | 'loading' | 'success' | 'error';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2 },
};

function IconBadge({ tone, children }: { tone: 'accent' | 'danger' | 'success'; children: ReactNode }) {
  const styles = {
    accent: 'bg-accent-soft text-accent-soft-ink',
    danger: 'bg-danger-soft text-danger-text',
    success: 'bg-success-soft text-success-text',
  };
  return (
    <span aria-hidden className={`grid size-12 place-items-center rounded-full [&_svg]:size-6 ${styles[tone]}`}>
      {children}
    </span>
  );
}

/** Liga a la cuenta una cita reservada por WhatsApp con el enlace que mandó el chatbot. */
export function LinkAppointmentCard() {
  const [searchParams] = useSearchParams();
  const citaId = searchParams.get('cita');
  const token = searchParams.get('t');
  const valid = Boolean(citaId && token);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleLink = async () => {
    if (!citaId || !token) return;
    setStatus('loading');
    try {
      await linkWhatsAppAppointment(citaId, token);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'No pudimos agregar la cita a tu cuenta.');
    }
  };

  return (
    <Card className="rounded-xl p-6 shadow-md sm:p-8" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'idle' && (
          <m.div key="idle" {...fade}>
            <IconBadge tone="accent">
              <CalendarPlus />
            </IconBadge>
            <h1 className="mt-5 text-3xl font-bold">Agregar cita a tu cuenta</h1>
            <p className="mt-2 text-muted">
              Reservaste por WhatsApp. Agrégala a tu cuenta para verla en Mis citas y poder cancelarla desde la web.
            </p>
            {!valid && (
              <Alert tone="info" className="mt-5">
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon aria-hidden className="size-3.5" />
                  Abre esta página desde el enlace que te enviamos por WhatsApp al confirmar tu cita.
                </span>
              </Alert>
            )}
            <div className="mt-7 flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={() => void handleLink()} disabled={!valid}>
                Agregar a mi cuenta
              </Button>
              <Link to="/mis-citas" className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'w-full' })}>
                Ir a Mis citas
              </Link>
            </div>
          </m.div>
        )}

        {status === 'loading' && (
          <m.div key="loading" {...fade} className="flex flex-col items-center py-10 text-center">
            <Spinner className="size-8 text-accent" />
            <p className="mt-4 font-medium">Agregando tu cita...</p>
          </m.div>
        )}

        {status === 'success' && (
          <m.div key="success" {...fade}>
            <IconBadge tone="success">
              <Check />
            </IconBadge>
            <h1 className="mt-5 text-3xl font-bold">¡Listo!</h1>
            <p className="mt-2 text-muted">Tu cita ya está en tu cuenta.</p>
            <Link to="/mis-citas" className={buttonStyles({ size: 'lg', className: 'mt-7 w-full' })}>
              Ver Mis citas
            </Link>
          </m.div>
        )}

        {status === 'error' && (
          <m.div key="error" {...fade}>
            <IconBadge tone="danger">
              <CircleAlert />
            </IconBadge>
            <h1 className="mt-5 text-3xl font-bold">No se pudo agregar</h1>
            <p className="mt-2 text-muted">{message}</p>
            <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={() => setStatus('idle')}>
              Reintentar
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
