import { useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast/toast-context';
import { signInWithGoogle } from './auth-api';
import { messageFor } from './errors';

/** Logo de Google con sus colores oficiales (la guía de marca no permite cambiarlos). */
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * "Continuar con Google" para Ingresar y Registro. No navega: al quedar la sesión
 * abierta, la página (LoginPage / RegisterPage) redirige sola a donde corresponde.
 */
export function GoogleSignIn() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result === 'done') toast({ tone: 'success', title: 'Sesión iniciada' });
      // 'redirect' sale de la página; 'cancelled' (cerró la ventana) no es un error.
      if (result !== 'redirect') setLoading(false);
    } catch (err) {
      setError(messageFor(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        icon={<GoogleLogo />}
        loading={loading}
        loadingText="Conectando con Google..."
        onClick={() => void handleClick()}
      >
        Continuar con Google
      </Button>
      <p className="-mt-1 text-center text-xs text-muted">
        Al continuar con Google aceptas los{' '}
        <Link to="/terminos" target="_blank" className="underline underline-offset-3 hover:text-accent">
          términos y la política de datos
        </Link>
        .
      </p>
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />o con tu correo
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
