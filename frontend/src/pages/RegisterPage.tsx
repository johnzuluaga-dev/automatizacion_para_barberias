import { Link, Navigate, useLocation } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { GoogleSignIn } from '@/features/auth/GoogleSignIn';
import { PageFallback } from '@/components/layout/PageFallback';
import { useAuth } from '@/features/auth/auth-context';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { redirectTarget } from '@/features/auth/redirect';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageFallback />;
  // Tras crear la cuenta (o entrar con Google) vuelve a donde iba, p. ej. /vincular.
  if (user) return <Navigate to={redirectTarget(location.state)} replace />;

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Te enviaremos un enlace a tu correo para verificarla."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/ingresar" state={location.state} className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            Ingresa
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <GoogleSignIn />
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
