import { Link } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PageFallback } from '@/components/layout/PageFallback';
import { buttonStyles } from '@/components/ui/button-styles';
import { useAuth } from '@/features/auth/auth-context';
import { NewPasswordForm } from '@/features/auth/NewPasswordForm';

export default function NewPasswordPage() {
  const { user, loading } = useAuth();

  if (loading) return <PageFallback />;

  // Se llega con sesión de recuperación (enlace o código) o con sesión normal.
  if (!user) {
    return (
      <AuthLayout
        title="El enlace venció"
        description="El enlace o código de recuperación ya no es válido. Pide uno nuevo para cambiar tu contraseña."
      >
        <Link to="/olvide-contrasena" className={buttonStyles({ size: 'lg', className: 'w-full' })}>
          Pedir un enlace nuevo
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crea una contraseña nueva" description="Elige una que no uses en otros sitios.">
      <NewPasswordForm />
    </AuthLayout>
  );
}
