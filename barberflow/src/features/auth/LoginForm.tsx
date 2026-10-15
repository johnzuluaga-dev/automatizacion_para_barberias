import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { login } from '@/lib/auth';

export function LoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (login(username, password)) {
        navigate('/admin');
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
      setLoading(false);
    }, 800);
  }

  return (
    <form onSubmit={handleLogin} aria-label="Iniciar sesión" className="flex flex-col gap-5">
      <AnimatePresence initial={false}>
        {error && (
          <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert tone="danger">{error}</Alert>
          </m.div>
        )}
      </AnimatePresence>

      <TextField
        label="Usuario"
        placeholder="Usuario"
        autoComplete="username"
        required
        icon={<User />}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        label="Contraseña"
        placeholder="Contraseña"
        type={showPass ? 'text' : 'password'}
        autoComplete="current-password"
        required
        icon={<Lock />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        trailing={
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPass}
            className="grid size-9 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {showPass ? <EyeOff aria-hidden className="size-4.5" /> : <Eye aria-hidden className="size-4.5" />}
          </button>
        }
      />

      <Button type="submit" size="lg" className="mt-1 w-full" loading={loading} loadingText="Verificando...">
        Ingresar
      </Button>
    </form>
  );
}
