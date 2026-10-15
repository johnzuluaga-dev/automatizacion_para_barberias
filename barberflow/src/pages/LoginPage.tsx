import { Link, Navigate, useLocation } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PageFallback } from '@/components/layout/PageFallback';
import { useAuth } from '@/features/auth/auth-context';
import { LoginForm } from '@/features/auth/LoginForm';
import { redirectTarget } from '@/features/auth/redirect';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirectTo = redirectTarget(location.state);

  if (loading) return <PageFallback />;
  if (user) return <Navigate to={redirectTo} replace />;

  return (
    <AuthLayout
      title="Ingresa a tu cuenta"
      description="Para agendar y ver tus citas."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={location.state} className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            Créala aquí
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
