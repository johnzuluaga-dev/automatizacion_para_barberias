import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router';
import { AppProviders, AppRoutes } from '../src/App';
import { getAppointments } from '../src/lib/supabase';

vi.mock('../src/lib/n8n', () => ({ sendBookingToN8n: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({
  getAppointments: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}));

async function auditAt(path: string, ready: () => Promise<unknown>) {
  const { container } = render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
  await ready();
  // jsdom no calcula estilos: el contraste se verifica aparte con los tokens.
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

beforeEach(() => {
  vi.mocked(getAppointments).mockResolvedValue([
    {
      id: 'a1',
      client_name: 'Laura Gómez',
      client_phone: '3001112233',
      service: 'Corte Clásico',
      barber: 'Juan Classic',
      appointment_date: '2026-10-20',
      appointment_time: '11:30',
      status: 'pending',
      created_at: '',
    },
  ]);
});

describe('accesibilidad (axe-core)', () => {
  test('reserva', async () => {
    expect(await auditAt('/', () => screen.findByRole('heading', { level: 1 }))).toEqual([]);
  });

  test('login', async () => {
    expect(await auditAt('/login', () => screen.findByRole('button', { name: 'Ingresar' }))).toEqual([]);
  });

  test('cancelar cita', async () => {
    expect(await auditAt('/cancel?id=1', () => screen.findByRole('button', { name: 'Confirmar Cancelación' }))).toEqual([]);
  });

  test('admin', async () => {
    sessionStorage.setItem('barberflow_auth', 'true');
    expect(await auditAt('/admin', () => screen.findByText('Laura Gómez'))).toEqual([]);
  });
});
