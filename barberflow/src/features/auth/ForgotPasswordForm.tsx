import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { MailCheck, Mail } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { requestPasswordReset } from './auth-api';
import { messageFor } from './errors';
import { savePending } from './pending';
import { validateEmail } from './validation';

export function ForgotPasswordForm() {
  const navigate = useNavigate();
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
      const target = email.trim().toLowerCase();
      await requestPasswordReset(target);
      savePending({ purpose: 'recovery', target, sentAt: Date.now() });
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
          Si el correo está registrado, te enviamos un enlace y un código para crear una contraseña nueva.
        </Alert>
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-soft-ink">
          <MailCheck className="size-6" />
        </span>
        <Button size="lg" className="w-full" onClick={() => navigate('/verificar')}>
          Tengo un código
        </Button>
        <p className="text-sm text-muted">También puedes abrir el enlace del correo desde este mismo dispositivo.</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Recuperar contraseña" className="flex flex-col gap-5">
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
