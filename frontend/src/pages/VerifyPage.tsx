import { Link, Navigate, useLocation } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PageFallback } from '@/components/layout/PageFallback';
import { buttonStyles } from '@/components/ui/button-styles';
import { useAuth } from '@/features/auth/auth-context';
import { redirectTarget } from '@/features/auth/redirect';
import { VerifyForm } from '@/features/auth/VerifyForm';

export default function VerifyPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirectTo = redirectTarget(location.state);
  const justSent = (location.state as { sent?: unknown } | null)?.sent === true;

  if (loading) return <PageFallback />;

  if (!user) {
    return (
      <AuthLayout title="Ingresa para verificar tu correo" description="Necesitamos saber de qué cuenta se trata.">
        <div className="flex flex-col gap-3">
          <Link to="/ingresar" state={location.state} className={buttonStyles({ size: 'lg', className: 'w-full' })}>
            Ir a ingresar
          </Link>
          <Link to="/registro" className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'w-full' })}>
            Crear cuenta
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (user.emailVerified) return <Navigate to={redirectTo} replace />;

  return (
    <AuthLayout title="Verifica tu correo" back={{ to: '/', label: 'Volver al inicio' }}>
      <VerifyForm email={user.email} justSent={justSent} redirectTo={redirectTo} />
    </AuthLayout>
  );
}
