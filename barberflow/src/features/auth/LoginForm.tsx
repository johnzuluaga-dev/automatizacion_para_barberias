import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Phone } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/toast/toast-context';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import { resendSignupCode, sendLoginCode, sendSmsLoginCode, signInWithPassword } from './auth-api';
import { messageFor, toAuthFlowError } from './errors';
import { savePending } from './pending';
import { toE164, validateEmail, validatePhone } from './validation';

type Mode = 'password' | 'code';
type Channel = 'email' | 'sms';

export function LoginForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('password');
  const [channel, setChannel] = useState<Channel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  async function handlePassword() {
    const errs = { email: validateEmail(email), password: password ? undefined : 'Escribe tu contraseña.' };
    setFieldErrors(errs);
    if (errs.email || errs.password) return;
    setLoading(true);
    try {
      await signInWithPassword(normalizedEmail, password);
      toast({ tone: 'success', title: 'Sesión iniciada' });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const flow = toAuthFlowError(err);
      if (flow.code === 'email_not_confirmed') {
        // La cuenta existe pero no se verificó: se envía un código y se continúa.
        try {
          await resendSignupCode(normalizedEmail);
        } catch {
          // Si el reenvío falla, la pantalla de verificación permite reintentar.
        }
        savePending({ purpose: 'signup', target: normalizedEmail, sentAt: Date.now() });
        navigate('/verificar', { state: { from: redirectTo } });
        return;
      }
      setError(flow.message);
      setLoading(false);
    }
  }

  async function handleCode() {
    if (channel === 'sms') {
      const phoneError = validatePhone(phone, true);
      setFieldErrors({ phone: phoneError });
      if (phoneError) return;
    } else {
      const emailError = validateEmail(email);
      setFieldErrors({ email: emailError });
      if (emailError) return;
    }
    setLoading(true);
    try {
      if (channel === 'sms') {
        const target = toE164(phone);
        await sendSmsLoginCode(target);
        savePending({ purpose: 'sms', target, sentAt: Date.now() });
      } else {
        await sendLoginCode(normalizedEmail);
        savePending({ purpose: 'login', target: normalizedEmail, sentAt: Date.now() });
      }
      navigate('/verificar', { state: { from: redirectTo } });
    } catch (err) {
      setError(messageFor(err));
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    void (mode === 'password' ? handlePassword() : handleCode());
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => {
        setMode(value);
        setError(null);
        setFieldErrors({});
      }}
      className={cn(
        'h-9 flex-1 rounded-sm text-sm font-medium transition-colors duration-150',
        mode === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  );

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Ingresar" className="flex flex-col gap-5">
      <div role="group" aria-label="Forma de ingresar" className="flex gap-1 rounded-md bg-surface-2 p-1">
        {tab('password', 'Con contraseña')}
        {tab('code', 'Con código')}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {mode === 'code' && config.smsEnabled && (
        <div className="flex gap-4 text-sm" role="radiogroup" aria-label="Enviar el código por">
          {(['email', 'sms'] as const).map((c) => (
            <label key={c} className="inline-flex items-center gap-2">
              <input type="radio" name="channel" checked={channel === c} onChange={() => setChannel(c)} className="accent-[var(--accent)]" />
              {c === 'email' ? 'Correo' : 'SMS al celular'}
            </label>
          ))}
        </div>
      )}

      {mode === 'code' && channel === 'sms' && config.smsEnabled ? (
        <TextField
          id="login-phone"
          label="Celular"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Ej. 300 123 4567"
          required
          icon={<Phone />}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={fieldErrors.phone}
        />
      ) : (
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
      )}

      {mode === 'password' ? (
        <>
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
        </>
      ) : (
        <>
          <p className="-mt-2 text-sm text-muted">Te enviamos un código de 6 dígitos para entrar sin contraseña.</p>
          <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Enviando código...">
            Enviarme un código
          </Button>
        </>
      )}
    </form>
  );
}
