import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { RotateCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { useToast } from '@/components/ui/toast/toast-context';
import { formatSeconds, useCountdown } from '@/hooks/useCountdown';
import { config } from '@/lib/config';
import {
  requestPasswordReset,
  resendSignupCode,
  sendLoginCode,
  sendSmsLoginCode,
  verifyEmailCode,
  verifyRecoveryCode,
  verifySmsCode,
} from './auth-api';
import { messageFor } from './errors';
import { clearPending, maskTarget, savePending, type PendingVerification } from './pending';

const RESEND: Record<PendingVerification['purpose'], (target: string) => Promise<void>> = {
  signup: resendSignupCode,
  login: sendLoginCode,
  recovery: requestPasswordReset,
  sms: sendSmsLoginCode,
};

const VERIFY: Record<PendingVerification['purpose'], (target: string, code: string) => Promise<void>> = {
  signup: verifyEmailCode,
  login: verifyEmailCode,
  recovery: verifyRecoveryCode,
  sms: verifySmsCode,
};

interface VerifyFormProps {
  pending: PendingVerification;
  /** Destino tras verificar (signup/login). */
  redirectTo?: string;
}

export function VerifyForm({ pending: initial, redirectTo = '/' }: VerifyFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState(initial);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const remaining = useCountdown(pending.sentAt + config.resendSeconds * 1000);
  const errorId = 'otp-error';

  async function verify(value: string) {
    if (value.length !== config.otpLength || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      await VERIFY[pending.purpose](pending.target, value);
      if (pending.purpose === 'recovery') {
        navigate('/nueva-contrasena', { replace: true });
        return;
      }
      clearPending();
      toast({
        tone: 'success',
        title: pending.purpose === 'signup' ? 'Tu cuenta quedó verificada' : 'Sesión iniciada',
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(messageFor(err));
      setCode('');
      setVerifying(false);
      document.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]')?.focus();
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    try {
      await RESEND[pending.purpose](pending.target);
      const next = { ...pending, sentAt: Date.now() };
      savePending(next);
      setPending(next);
      toast({ tone: 'info', title: 'Te enviamos un código nuevo' });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setResending(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== config.otpLength) {
      setError(`Escribe los ${config.otpLength} dígitos del código.`);
      return;
    }
    void verify(code);
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Verificar código" className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Enviamos un código de {config.otpLength} dígitos a <span className="font-medium text-ink">{maskTarget(pending.target)}</span>.
        {pending.purpose !== 'sms' && ' Revisa también la carpeta de spam.'}
      </p>

      <OtpInput
        value={code}
        onChange={(v) => {
          setCode(v);
          if (error) setError(null);
        }}
        onComplete={(v) => void verify(v)}
        invalid={Boolean(error)}
        describedBy={error ? errorId : undefined}
        disabled={verifying}
        autoFocus
      />

      {error && (
        <div id={errorId}>
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={verifying} loadingText="Verificando...">
        Verificar
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
            Reenviar código
          </Button>
        )}
      </div>

      {pending.purpose === 'signup' && (
        <p className="text-xs text-muted">Si ya tenías una cuenta con este correo, no te llegará código: ingresa con tu contraseña.</p>
      )}
    </form>
  );
}
