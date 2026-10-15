import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar({ actions }: { actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/90 backdrop-blur-sm supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="BarberFlow, inicio" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          {actions}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
