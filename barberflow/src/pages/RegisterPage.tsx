import { Link, Navigate, useLocation } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PageFallback } from '@/components/layout/PageFallback';
import { useAuth } from '@/features/auth/auth-context';
import { RegisterForm } from '@/features/auth/RegisterForm';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageFallback />;
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="Te enviaremos un código a tu correo para verificarla."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/ingresar" state={location.state} className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            Ingresa
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
