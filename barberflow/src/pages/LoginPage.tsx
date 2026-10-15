import { Link } from 'react-router';
import { m } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LoginForm } from '@/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca (solo escritorio): el quiebre asimétrico de la pantalla. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-bg lg:flex">
        <Logo />
        <div>
          <span aria-hidden className="bf-pole block h-3 w-16 rounded-full" />
          <p className="mt-8 max-w-[12ch] font-display text-display font-bold">Tu agenda, en orden.</p>
          <p className="mt-6 max-w-sm text-bg/70">
            Citas, estados y reportes del negocio en un solo lugar.
          </p>
        </div>
        <p className="text-sm text-bg/60">BarberFlow © 2026 — Acceso restringido</p>
      </aside>

      <main id="contenido" className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Volver a reservas
          </Link>
          <ThemeToggle />
        </div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="m-auto w-full max-w-sm py-12"
        >
          <Logo withWordmark={false} className="lg:hidden" />
          <h1 className="mt-6 text-3xl font-bold lg:mt-0">Panel Administrativo</h1>
          <p className="mt-2 text-muted">Ingresa con tu usuario para gestionar la agenda.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </m.div>

        <p className="text-center text-xs text-muted lg:hidden">BarberFlow © 2026 — Acceso restringido</p>
      </main>
    </div>
  );
}
