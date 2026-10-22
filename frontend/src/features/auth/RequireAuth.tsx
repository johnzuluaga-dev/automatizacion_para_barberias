import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { PageFallback } from '@/components/layout/PageFallback';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { buttonStyles } from '@/components/ui/button-styles';
import { useAuth } from './auth-context';
import type { Role } from './auth-api';

interface RequireAuthProps {
  children: ReactNode;
  /** Rol exigido; sin rol basta con tener sesión. */
  role?: Role;
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, role: currentRole, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || (role && user && profileLoading)) return <PageFallback />;
  if (!user) return <Navigate to="/ingresar" replace state={{ from: `${location.pathname}${location.search}` }} />;

  if (role && currentRole !== role) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger-text">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-5 text-3xl font-bold">No tienes acceso a esta sección</h1>
          <p className="mt-2 text-muted">Esta parte es solo para el equipo de la barbería.</p>
          <Link to="/" className={buttonStyles({ className: 'mt-8' })}>
            Ir a reservas
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return <>{children}</>;
}
