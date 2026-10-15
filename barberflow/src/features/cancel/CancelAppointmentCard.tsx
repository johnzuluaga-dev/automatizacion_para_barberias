import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { CalendarX2, Check, CircleAlert, LinkIcon } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { Spinner } from '@/components/ui/Spinner';

type Status = 'idle' | 'loading' | 'success' | 'error';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2 },
};

function IconBadge({ tone, children }: { tone: 'danger' | 'success'; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={
        tone === 'danger'
          ? 'grid size-12 place-items-center rounded-full bg-danger-soft text-danger [&_svg]:size-6'
          : 'grid size-12 place-items-center rounded-full bg-success-soft text-success [&_svg]:size-6'
      }
    >
      {children}
    </span>
  );
}

export function CancelAppointmentCard() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleCancel = () => {
    if (!appointmentId) return;

    setStatus('loading');

    // Simulación de cancelación (igual que la versión anterior).
    setTimeout(() => {
      setStatus('success');
      setMessage('Tu cita ha sido cancelada exitosamente (Simulación)');
    }, 1500);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-md sm:p-8" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'idle' && (
          <m.div key="idle" {...fade}>
            <IconBadge tone="danger">
              <CalendarX2 />
            </IconBadge>
            <h1 className="mt-5 text-3xl font-bold">Cancelar Cita</h1>
            <p className="mt-2 text-muted">
              ¿Estás seguro de que deseas cancelar tu cita en BarberFlow? Esta acción no se puede deshacer.
            </p>
            {!appointmentId && (
              <Alert tone="info" className="mt-5">
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon aria-hidden className="size-3.5" />
                  Abre esta página desde el enlace de cancelación que recibiste por WhatsApp.
                </span>
              </Alert>
            )}
            <div className="mt-7 flex flex-col gap-2">
              <Button variant="danger" size="lg" className="w-full" onClick={handleCancel} disabled={!appointmentId}>
                Confirmar Cancelación
              </Button>
              <Link to="/" className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'w-full' })}>
                Mantener Cita
              </Link>
            </div>
          </m.div>
        )}

        {status === 'loading' && (
          <m.div key="loading" {...fade} className="flex flex-col items-center py-10 text-center">
            <Spinner className="size-8 text-accent" />
            <p className="mt-4 font-medium">Procesando cancelación...</p>
          </m.div>
        )}

        {status === 'success' && (
          <m.div key="success" {...fade}>
            <IconBadge tone="success">
              <Check />
            </IconBadge>
            <h1 className="mt-5 text-3xl font-bold">¡Cancelado!</h1>
            <p className="mt-2 text-muted">{message}</p>
            <Link to="/" className={buttonStyles({ size: 'lg', className: 'mt-7 w-full' })}>
              Volver al Inicio
            </Link>
          </m.div>
        )}

        {status === 'error' && (
          <m.div key="error" {...fade}>
            <IconBadge tone="danger">
              <CircleAlert />
            </IconBadge>
            <h1 className="mt-5 text-3xl font-bold">Error</h1>
            <p className="mt-2 text-muted">{message}</p>
            <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={() => setStatus('idle')}>
              Reintentar
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
