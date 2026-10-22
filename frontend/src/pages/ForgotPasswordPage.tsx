import { AuthLayout } from '@/components/layout/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Recupera tu contraseña"
      description="Escribe el correo de tu cuenta y te enviaremos cómo crear una nueva."
      back={{ to: '/ingresar', label: 'Volver a ingresar' }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
