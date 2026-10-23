import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createReview, getBarberAppointments, getMyAppointments, updateAppointmentStatus, type Appointment } from '../src/lib/citas';
import * as api from './mocks/auth-api';
import { renderAt } from './mocks/render';

vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'));
vi.mock('../src/lib/citas', () => ({
  getAppointments: vi.fn().mockResolvedValue([]),
  getBarberAppointments: vi.fn(),
  getMyAppointments: vi.fn(),
  getMyReviewedIds: vi.fn().mockResolvedValue(new Set()),
  createReview: vi.fn().mockResolvedValue(undefined),
  updateAppointmentStatus: vi.fn().mockResolvedValue(undefined),
  getTakenSlots: vi.fn().mockResolvedValue([]),
}));

const cita = (over: Partial<Appointment>): Appointment => ({
  id: 'c1',
  client_name: 'Laura Gómez',
  client_phone: '+573001112233',
  service: 'Corte Clásico',
  barber: 'Juan Classic',
  barber_id: 'juan-classic',
  appointment_date: '2026-10-01',
  appointment_time: '11:30',
  status: 'completada',
  origin: 'web',
  created_at: '2026-09-30T10:00:00Z',
  ...over,
});

beforeEach(() => {
  api.resetAuthMock();
  vi.mocked(createReview).mockClear();
  vi.mocked(updateAppointmentStatus).mockClear();
});

describe('agenda del barbero', () => {
  test('carga solo las citas de su barbero y cambia estados como barbero', async () => {
    api.setTestSession({ role: 'barbero', barberoId: 'juan-classic' });
    vi.mocked(getBarberAppointments).mockResolvedValue([cita({ id: 'b1', status: 'pendiente', appointment_date: '2026-10-20' })]);
    const user = userEvent.setup();
    renderAt('/barbero');
    expect(await screen.findByRole('heading', { name: 'Mi agenda' })).toBeInTheDocument();
    expect(getBarberAppointments).toHaveBeenCalledWith('juan-classic');
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }));
    expect(updateAppointmentStatus).toHaveBeenCalledWith('b1', 'confirmada', 'barbero');
  });

  test('un cliente no entra a la agenda del barbero', async () => {
    api.setTestSession({ role: 'cliente' });
    renderAt('/barbero');
    expect(await screen.findByRole('heading', { name: 'No tienes acceso a esta sección' })).toBeInTheDocument();
  });
});

describe('calificar una cita completada', () => {
  test('envía las estrellas y el comentario', async () => {
    api.setTestSession({ role: 'cliente' });
    vi.mocked(getMyAppointments).mockResolvedValue([cita({})]);
    const user = userEvent.setup();
    renderAt('/mis-citas');
    await user.click(await screen.findByRole('button', { name: 'Calificar' }));
    await user.click(await screen.findByRole('radio', { name: '5 estrellas', hidden: true }));
    fireEvent.change(screen.getByLabelText(/comentario/i), { target: { value: 'Excelente corte' } });
    await user.click(screen.getByRole('button', { name: 'Enviar calificación', hidden: true }));
    expect(createReview).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }), 5, 'Excelente corte');
    expect(await screen.findByText('Ya la calificaste')).toBeInTheDocument();
  });
});
