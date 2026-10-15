import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppProviders, AppRoutes } from '../../src/App';

/** Renderiza la app completa en una ruta (con providers reales y auth simulada). */
export function renderAt(path: string, state?: unknown) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[{ pathname: path.split('?')[0] ?? '/', search: path.includes('?') ? `?${path.split('?')[1]}` : '', state }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}
