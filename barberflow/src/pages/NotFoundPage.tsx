import { Link } from 'react-router';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { buttonStyles } from '@/components/ui/button-styles';

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="tabular font-display text-display font-bold text-accent">404</p>
        <h1 className="mt-4 text-3xl font-bold">Esta página no existe</h1>
        <p className="mt-2 max-w-md text-muted">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <Link to="/" className={buttonStyles({ size: 'lg', className: 'mt-8' })}>
          Agendar una cita
        </Link>
      </div>
    </PublicLayout>
  );
}
