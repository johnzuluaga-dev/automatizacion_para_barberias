import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          <span className="font-display font-semibold text-ink">BarberFlow</span> © {new Date().getFullYear()} · Estilo &amp;
          Automatización
        </p>
        <div className="flex items-center gap-5">
          <Link to="/terminos" className="rounded-sm underline-offset-4 hover:text-ink hover:underline">
            Términos y datos
          </Link>
          <Link to="/admin" className="rounded-sm underline-offset-4 hover:text-ink hover:underline">
            Panel del equipo
          </Link>
        </div>
      </div>
    </footer>
  );
}
