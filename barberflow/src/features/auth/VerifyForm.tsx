import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { MailCheck, RotateCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast/toast-context';
import { formatSeconds, useCountdown } from '@/hooks/useCountdown';
import { config } from '@/lib/config';
import { reloadUser, resendVerification } from './auth-api';
import { messageFor } from './errors';
import { maskEmail } from './mask';

interface VerifyFormProps {
  /** Correo al que se envió el enlace. */
  email: string;
  /** Ya se envió el enlace hace un instante (recién registrado). */
  justSent: boolean;
  /** Destino al verificar. */
  redirectTo?: string;
}

export function VerifyForm({ email, justSent, redirectTo = '/' }: VerifyFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [sentAt, setSentAt] = useState(() => (justSent ? Date.now() : 0));
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const remaining = useCountdown(sentAt + config.resendSeconds * 1000);

  // Al volver a esta pestaña tras abrir el enlace del correo, se revisa solo.
  useEffect(() => {
    const onFocus = () => void reloadUser().catch(() => undefined);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  async function check() {
    setChecking(true);
    setError(null);
    try {
      await reloadUser();
      // AuthProvider recibe la sesión actualizada; si ya verificó, la página redirige.
      setError('Todavía no vemos tu verificación. Abre el enlace del correo y vuelve a intentarlo.');
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    try {
      await resendVerification();
      setSentAt(Date.now());
      toast({ tone: 'info', title: 'Te enviamos un enlace nuevo' });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-soft-ink">
        <MailCheck className="size-6" />
      </span>
      <p className="text-sm text-muted">
        Enviamos un enlace a <span className="font-medium text-ink">{maskEmail(email)}</span>. Ábrelo desde tu correo y
        luego vuelve aquí. Revisa también la carpeta de spam.
      </p>

      {error && <Alert tone="danger">{error}</Alert>}

      <Button size="lg" className="w-full" onClick={() => void check()} loading={checking} loadingText="Revisando...">
        Ya verifiqué mi correo
      </Button>
      <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate(redirectTo)}>
        Verificar más tarde
      </Button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">¿No te llegó?</span>
        {remaining > 0 ? (
          <span className="tabular text-muted" aria-live="polite">
            Reenviar en {formatSeconds(remaining)}
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void resend()}
            loading={resending}
            icon={<RotateCw aria-hidden className="size-4" />}
          >
            Reenviar enlace
          </Button>
        )}
      </div>
    </div>
  );
}
