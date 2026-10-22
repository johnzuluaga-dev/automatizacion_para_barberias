import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/toast/toast-context';
import { signInWithPassword } from './auth-api';
import { messageFor } from './errors';
import { validateEmail } from './validation';

export function LoginForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const errs = { email: validateEmail(email), password: password ? undefined : 'Escribe tu contraseña.' };
    setFieldErrors(errs);
    if (errs.email || errs.password) return;

    setLoading(true);
    try {
      await signInWithPassword(email.trim().toLowerCase(), password);
      toast({ tone: 'success', title: 'Sesión iniciada' });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(messageFor(err));
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(e)} aria-label="Ingresar" className="flex flex-col gap-5">
      {error && <Alert tone="danger">{error}</Alert>}

      <TextField
        id="login-email"
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
        icon={<Mail />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <PasswordField
        id="login-password"
        label="Contraseña"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      <Link to="/olvide-contrasena" className="-mt-2 self-end rounded-sm text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
        Olvidé mi contraseña
      </Link>
      <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Ingresando...">
        Ingresar
      </Button>
    </form>
  );
}
