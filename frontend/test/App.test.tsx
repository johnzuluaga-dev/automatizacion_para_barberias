import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppProviders, AppRoutes } from '../src/App';
import { cancelByToken, getAppointments, updateAppointmentStatus, type Appointment } from '../src/lib/citas';
import * as authApi from './mocks/auth-api';

vi.mock('../src/lib/n8n', () => ({
  sendBookingToN8n: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../src/lib/citas', () => ({
  getAppointments: vi.fn(),
  updateAppointmentStatus: vi.fn().mockResolvedValue(undefined),
  getMyAppointments: vi.fn().mockResolvedValue([]),
  getTakenSlots: vi.fn().mockResolvedValue([]),
  cancelByToken: vi.fn(),
  getMyReviewedIds: vi.fn().mockResolvedValue(new Set()),
  createReview: vi.fn(),
  getBarberAppointments: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'));

const appointments: Appointment[] = [
  {
    id: 'a1',
    client_name: 'Laura Gómez',
    client_phone: '3001112233',
    service: 'Corte Clásico',
    barber: 'Juan Classic',
    barber_id: 'juan-classic',
    appointment_date: '2026-10-20',
    appointment_time: '11:30',
    status: 'pendiente',
    origin: 'web',
    created_at: '2026-10-14T10:00:00Z',
  },
  {
    id: 'a2',
    client_name: 'Pedro Ruiz',
    client_phone: '3004445566',
    service: 'Corte + Barba',
    barber: 'Carlos The Blade',
    barber_id: 'carlos-the-blade',
    appointment_date: '2026-10-21',
    appointment_time: '15:00',
    status: 'completada',
    origin: 'web',
    created_at: '2026-10-14T10:00:00Z',
  },
];

function renderAt(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

beforeEach(() => {
  authApi.resetAuthMock();
  vi.mocked(getAppointments).mockResolvedValue(appointments);
  vi.mocked(updateAppointmentStatus).mockClear();
});

describe('rutas', () => {
  test('"/" muestra la pantalla de reservas', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: /tu próximo corte/i })).toBeInTheDocument();
  });

  test('"/admin" sin sesión redirige al login', async () => {
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
  });

  test('una ruta desconocida muestra 404', async () => {
    renderAt('/no-existe');
    expect(await screen.findByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument();
  });
});

describe('admin', () => {
  beforeEach(() => authApi.setTestSession({ role: 'admin' }));

  test('lista las citas y calcula las métricas', async () => {
    renderAt('/admin');
    expect(await screen.findByText('Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('Pedro Ruiz')).toBeInTheDocument();
    // 1 completada × $20 (cálculo heredado)
    expect(screen.getByText('$20')).toBeInTheDocument();
  });

  test('confirma una cita pendiente', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    const row = (await screen.findByText('Laura Gómez')).closest('tr');
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Confirmar' }));
    expect(updateAppointmentStatus).toHaveBeenCalledWith('a1', 'confirmada', 'admin');
    expect(await screen.findByText('Cita confirmada')).toBeInTheDocument();
  });

  test('filtra por estado', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    await screen.findByText('Laura Gómez');
    await user.click(screen.getByRole('button', { name: /completadas/i, pressed: false }));
    expect(screen.queryByText('Laura Gómez')).not.toBeInTheDocument();
    expect(screen.getByText('Pedro Ruiz')).toBeInTheDocument();
  });

  test('muestra error y permite reintentar si falla la carga', async () => {
    vi.mocked(getAppointments).mockRejectedValueOnce(new Error('Error 500'));
    const user = userEvent.setup();
    renderAt('/admin');
    expect(await screen.findByText('Error 500')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Laura Gómez')).toBeInTheDocument();
  });
});

describe('cancelar cita', () => {
  test('sin id no permite confirmar', async () => {
    renderAt('/cancel');
    expect(await screen.findByRole('button', { name: 'Confirmar Cancelación' })).toBeDisabled();
  });

  test('con un enlace válido cancela la cita', async () => {
    vi.mocked(cancelByToken).mockResolvedValueOnce(true);
    const user = userEvent.setup();
    renderAt('/cancel?id=abc');
    await user.click(await screen.findByRole('button', { name: 'Confirmar Cancelación' }));
    expect(await screen.findByRole('heading', { name: '¡Cancelado!' })).toBeInTheDocument();
    expect(cancelByToken).toHaveBeenCalledWith('abc');
  });

  test('con un enlace vencido explica el problema', async () => {
    vi.mocked(cancelByToken).mockResolvedValueOnce(false);
    const user = userEvent.setup();
    renderAt('/cancel?id=viejo');
    await user.click(await screen.findByRole('button', { name: 'Confirmar Cancelación' }));
    expect(await screen.findByText(/no encontramos una cita activa/i)).toBeInTheDocument();
  });
});
