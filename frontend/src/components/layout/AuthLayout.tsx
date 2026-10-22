import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { m } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Pie bajo el formulario (p. ej. "¿No tienes cuenta? Regístrate"). */
  footer?: ReactNode;
  back?: { to: string; label: string };
}

/**
 * Pantallas de cuenta: panel de marca a la izquierda en escritorio (el quiebre
 * asimétrico) y formulario angosto a la derecha. En móvil, solo el formulario.
 */
export function AuthLayout({ title, description, children, footer, back = { to: '/', label: 'Volver a reservas' } }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-bg lg:flex dark:border-r dark:border-line dark:bg-surface dark:text-ink">
        <Link to="/" aria-label="BarberFlow, inicio" className="w-fit rounded-md">
          <Logo />
        </Link>
        <div>
          <span aria-hidden className="bf-pole block h-3 w-16 rounded-full" />
          <p className="mt-8 max-w-[11ch] font-display text-display font-bold">Tu silla, a tu hora.</p>
          <p className="mt-6 max-w-sm opacity-75">Reserva, revisa y cancela tus citas desde tu cuenta.</p>
        </div>
        <p className="text-sm opacity-65">BarberFlow © {new Date().getFullYear()}</p>
      </aside>

      <main id="contenido" className="flex flex-col px-4 py-5 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {back.label}
          </Link>
          <ThemeToggle />
        </div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="m-auto w-full max-w-sm py-10"
        >
          <Logo withWordmark={false} className="lg:hidden" />
          <h1 className="mt-6 text-3xl font-bold lg:mt-0">{title}</h1>
          {description && <div className="mt-2 text-muted">{description}</div>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-line pt-6 text-sm text-muted">{footer}</div>}
        </m.div>
      </main>
    </div>
  );
}
