import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sendBookingToN8n } from '../src/lib/n8n';
import { createAppointment, DataError, getTakenSlots } from '../src/lib/citas';
import type * as CitasModule from '../src/lib/citas';
import * as api from './mocks/auth-api';
import { renderAt } from './mocks/render';

vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'));
vi.mock('../src/lib/n8n', () => ({ sendBookingToN8n: vi.fn() }));
vi.mock('../src/lib/citas', async () => {
  const actual = await vi.importActual<typeof CitasModule>('../src/lib/citas');
  return {
    DataError: actual.DataError,
    createAppointment: vi.fn(),
    getTakenSlots: vi.fn(),
    getMyAppointments: vi.fn().mockResolvedValue([]),
    getAppointments: vi.fn().mockResolvedValue([]),
    getMyReviewedIds: vi.fn().mockResolvedValue(new Set()),
  };
});

// Miércoles 14 de octubre de 2026, 9:00 a. m. (antes de abrir).
const NOW = new Date(2026, 9, 14, 9, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  api.resetAuthMock();
  vi.mocked(createAppointment).mockReset().mockImplementation(async (input) => ({
    ...input,
    service: input.service.name,
    barber: input.barber.name,
    barber_id: input.barber.id,
    id: 'nueva',
    status: 'pendiente',
    created_at: '',
  }));
  vi.mocked(getTakenSlots).mockReset().mockResolvedValue([]);
  vi.mocked(sendBookingToN8n).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

async function chooseSelection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('radio', { name: /corte \+ barba/i }));
  await user.click(screen.getByRole('radio', { name: 'Andrés Estilo' }));
  await user.click(screen.getByRole('radio', { name: /jueves 15 de octubre/i }));
  await user.click(await screen.findByRole('radio', { name: '16:30' }));
}

describe('reserva sin sesión', () => {
  test('pide ingresar y conserva la selección al volver', async () => {
    api.signInWithPassword.mockImplementationOnce(async () => {
      api.setTestSession({ name: 'Laura Gómez' });
    });
    const user = userEvent.setup();
    renderAt('/');
    await chooseSelection(user);
    expect(screen.queryByLabelText(/^nombre completo/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ingresa para agendar' }));

    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^correo/i), 'laura@correo.com');
    await user.type(screen.getByLabelText(/^contraseña/i), 'Tijeras-Azules-2026');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('heading', { level: 1, name: /tu próximo corte/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /corte \+ barba/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: '16:30' })).toBeChecked();
    expect(screen.getByLabelText(/^nombre completo/i)).toHaveValue('Laura Gómez');
    expect(createAppointment).not.toHaveBeenCalled();
  });

  test('bloquea los domingos y ofrece 18 turnos de 11:00 a 19:30', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(await screen.findByRole('radio', { name: /domingo 18 de octubre, cerrado/i })).toBeDisabled();
    const group = screen.getByRole('group', { name: /hora/i });
    const slots = within(group).getAllByRole('radio');
    expect(slots).toHaveLength(18);
    expect(slots[0]).toHaveAccessibleName('11:00');
    expect(slots.at(-1)).toHaveAccessibleName('19:30');
    expect(slots[0]).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /jueves 15 de octubre/i }));
    expect(slots[0]).toBeEnabled();
  });
});

describe('reserva con sesión', () => {
  beforeEach(() => api.setTestSession({ id: 'user-9', name: 'Laura Gómez' }));

  test('muestra errores y no envía si faltan datos', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: 'Agendar Cita' }));
    expect(screen.getByText('Elige un servicio.')).toBeInTheDocument();
    expect(screen.getByText(/faltan 4 datos/i)).toBeInTheDocument();
    expect(createAppointment).not.toHaveBeenCalled();
  });

  test('crea la cita confirmada en Firestore con los datos del perfil', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await chooseSelection(user);
    expect(screen.getByLabelText(/^celular/i)).toHaveValue('3001234567');
    await user.click(screen.getByRole('button', { name: 'Agendar Cita' }));

    expect(createAppointment).toHaveBeenCalledWith(
      {
        client_name: 'Laura Gómez',
        client_phone: '3001234567',
        service: expect.objectContaining({ id: 'corte-barba', durationMin: 60 }),
        barber: expect.objectContaining({ id: 'andres-estilo', name: 'Andrés Estilo' }),
        appointment_date: '2026-10-15',
        appointment_time: '16:30',
      },
      'user-9',
    );
    expect(await screen.findByRole('heading', { name: '¡Cita agendada!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver mis citas/i })).toHaveAttribute('href', '/mis-citas');
    // n8n está desactivado por defecto.
    expect(sendBookingToN8n).not.toHaveBeenCalled();
  });

  test('con el correo sin verificar pide verificar antes de crear la cita', async () => {
    api.setTestSession({ id: 'user-9', name: 'Laura Gómez', emailVerified: false });
    const user = userEvent.setup();
    renderAt('/');
    await chooseSelection(user);
    await user.click(screen.getByRole('button', { name: 'Agendar Cita' }));
    expect(await screen.findByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(createAppointment).not.toHaveBeenCalled();
  });

  test('las horas ocupadas aparecen deshabilitadas', async () => {
    vi.mocked(getTakenSlots).mockResolvedValue(['16:30']);
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('radio', { name: 'Andrés Estilo' }));
    await user.click(screen.getByRole('radio', { name: /jueves 15 de octubre/i }));
    expect(await screen.findByRole('radio', { name: '16:30, ocupada' })).toBeDisabled();
    expect(getTakenSlots).toHaveBeenCalledWith('andres-estilo', '2026-10-15');
  });

  test('si otra persona toma la hora al mismo tiempo, lo explica', async () => {
    vi.mocked(createAppointment).mockRejectedValueOnce(new DataError('Esa hora acaba de ocuparse. Elige otra.', 'slot_taken'));
    const user = userEvent.setup();
    renderAt('/');
    await chooseSelection(user);
    await user.click(screen.getByRole('button', { name: 'Agendar Cita' }));
    expect(await screen.findByText('Esa hora acaba de ocuparse. Elige otra.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '16:30' })).not.toBeChecked();
  });
});
