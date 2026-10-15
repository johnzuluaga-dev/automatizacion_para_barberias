import { Link, NavLink, useNavigate } from 'react-router';
import { CalendarDays, LayoutDashboard, LogOut } from 'lucide-react';
import { buttonStyles } from '@/components/ui/button-styles';
import { useToast } from '@/components/ui/toast/toast-context';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-context';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150',
    isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink',
  );

/** Acciones de cuenta en la barra superior. */
export function AuthNav() {
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (loading) return <span aria-hidden className="h-10 w-24" />;

  if (!user) {
    return (
      <>
        <Link to="/ingresar" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
          Ingresar
        </Link>
        <Link to="/registro" className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'hidden sm:inline-flex' })}>
          Crear cuenta
        </Link>
      </>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0];

  async function handleSignOut() {
    try {
      await signOut();
      toast({ tone: 'info', title: 'Cerraste sesión' });
      navigate('/');
    } catch {
      toast({ tone: 'danger', title: 'No pudimos cerrar la sesión. Inténtalo de nuevo.' });
    }
  }

  return (
    <>
      {firstName && <span className="mr-1 hidden text-sm text-muted md:inline">Hola, {firstName}</span>}
      <NavLink to="/mis-citas" className={linkClass}>
        <CalendarDays aria-hidden className="size-4" />
        <span className="hidden sm:inline">Mis citas</span>
        <span className="sr-only sm:hidden">Mis citas</span>
      </NavLink>
      {role === 'admin' && (
        <NavLink to="/admin" className={linkClass}>
          <LayoutDashboard aria-hidden className="size-4" />
          <span className="hidden sm:inline">Panel</span>
          <span className="sr-only sm:hidden">Panel</span>
        </NavLink>
      )}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="grid size-10 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        <LogOut aria-hidden className="size-4.5" />
      </button>
    </>
  );
}
