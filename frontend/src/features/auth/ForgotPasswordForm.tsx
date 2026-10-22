import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { MailCheck, Mail } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { TextField } from '@/components/ui/TextField';
import { requestPasswordReset } from './auth-api';
import { messageFor } from './errors';
import { validateEmail } from './validation';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const invalid = validateEmail(email);
    setFieldError(invalid);
    if (invalid) return;

    setLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success" title="Revisa tu correo">
          Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva.
        </Alert>
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-soft-ink">
          <MailCheck className="size-6" />
        </span>
        <p className="text-sm text-muted">Abre el enlace, elige tu contraseña nueva y luego ingresa con ella.</p>
        <Link to="/ingresar" className={buttonStyles({ size: 'lg', className: 'w-full' })}>
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(e)} aria-label="Recuperar contraseña" className="flex flex-col gap-5">
      {error && <Alert tone="danger">{error}</Alert>}
      <TextField
        id="forgot-email"
        label="Correo de tu cuenta"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
        icon={<Mail />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldError}
      />
      <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Enviando...">
        Enviar instrucciones
      </Button>
    </form>
  );
}
