import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/button-styles';
import { PasswordField } from '@/components/ui/PasswordField';
import { updatePassword } from './auth-api';
import { messageFor } from './errors';
import { clearPending } from './pending';
import { validatePassword } from './validation';

export function NewPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const found = {
      password: validatePassword(password),
      confirm: confirm !== password ? 'Las contraseñas no coinciden.' : undefined,
    };
    setErrors(found);
    if (found.password || found.confirm) return;

    setLoading(true);
    try {
      await updatePassword(password);
      clearPending();
      setDone(true);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-5">
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-success-soft text-success-text">
          <Check className="size-6" strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-display text-xl font-semibold">Contraseña actualizada</p>
          <p className="mt-1 text-muted">Ya puedes usar tu nueva contraseña. Tu sesión sigue abierta.</p>
        </div>
        <Link to="/" className={buttonStyles({ size: 'lg', className: 'w-full' })}>
          Ir a reservas
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Nueva contraseña" className="flex flex-col gap-5">
      {error && <Alert tone="danger">{error}</Alert>}
      <PasswordField
        id="new-password"
        label="Nueva contraseña"
        autoComplete="new-password"
        placeholder="Mínimo 10 caracteres"
        required
        showStrength
        hint="Usa al menos 10 caracteres."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <PasswordField
        id="new-password-confirm"
        label="Repite la contraseña"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <Button type="submit" size="lg" className="w-full" loading={loading} loadingText="Guardando...">
        Guardar contraseña
      </Button>
    </form>
  );
}
