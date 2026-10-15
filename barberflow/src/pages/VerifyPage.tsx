import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { buttonStyles } from '@/components/ui/button-styles';
import { readPending } from '@/features/auth/pending';
import { VerifyForm } from '@/features/auth/VerifyForm';
import { redirectTarget } from '@/features/auth/redirect';

const TITLES = {
  signup: 'Verifica tu correo',
  login: 'Escribe tu código',
  sms: 'Escribe tu código',
  recovery: 'Código de recuperación',
} as const;

export default function VerifyPage() {
  const location = useLocation();
  const [pending] = useState(readPending);

  if (!pending) {
    return (
      <AuthLayout title="No hay un código pendiente" description="Pide un código nuevo desde el inicio de sesión o el registro.">
        <div className="flex flex-col gap-3">
          <Link to="/ingresar" className={buttonStyles({ size: 'lg', className: 'w-full' })}>
            Ir a ingresar
          </Link>
          <Link to="/registro" className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'w-full' })}>
            Crear cuenta
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={TITLES[pending.purpose]} back={{ to: pending.purpose === 'signup' ? '/registro' : '/ingresar', label: 'Volver' }}>
      <VerifyForm pending={pending} redirectTo={redirectTarget(location.state)} />
    </AuthLayout>
  );
}
