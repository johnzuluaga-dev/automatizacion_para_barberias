import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '../src/features/booking/BookingForm';
import { sendBookingToN8n } from '../src/lib/n8n';

vi.mock('../src/lib/n8n', () => ({
  sendBookingToN8n: vi.fn().mockResolvedValue({ success: true }),
}));

const mockedSend = vi.mocked(sendBookingToN8n);

// Miércoles 14 de octubre de 2026, 9:00 a. m. (antes de abrir).
const NOW = new Date(2026, 9, 14, 9, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  mockedSend.mockClear();
  mockedSend.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.useRealTimers();
});

async function fillValidBooking(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /corte \+ barba/i }));
  await user.click(screen.getByRole('radio', { name: 'Andrés Estilo' }));
  await user.click(screen.getByRole('radio', { name: /jueves 15 de octubre/i }));
  await user.click(screen.getByRole('radio', { name: '16:30' }));
  await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez');
  await user.type(screen.getByLabelText(/teléfono/i), '3001234567');
}

describe('BookingForm', () => {
  test('renderiza el formulario correctamente', () => {
    render(<BookingForm />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tu próximo corte/i);
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agendar cita/i })).toBeInTheDocument();
  });

  test('permite escribir en los inputs', async () => {
    const user = userEvent.setup();
    render(<BookingForm />);
    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/teléfono/i), '123456789');
    expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('Juan Pérez');
    expect(screen.getByLabelText(/teléfono/i)).toHaveValue('123456789');
  });

  test('bloquea los domingos', () => {
    render(<BookingForm />);
    expect(screen.getByRole('radio', { name: /domingo 18 de octubre, cerrado/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /sábado 17 de octubre/i })).toBeEnabled();
  });

  test('ofrece turnos de 30 minutos de 11:00 a 19:30, habilitados al elegir día', async () => {
    const user = userEvent.setup();
    render(<BookingForm />);
    const group = screen.getByRole('group', { name: /hora/i });
    const slots = within(group).getAllByRole('radio');
    expect(slots).toHaveLength(18);
    expect(slots[0]).toHaveAccessibleName('11:00');
    expect(slots.at(-1)).toHaveAccessibleName('19:30');
    expect(within(group).queryByRole('radio', { name: '10:00' })).not.toBeInTheDocument();
    expect(slots[0]).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /jueves 15 de octubre/i }));
    expect(slots[0]).toBeEnabled();
  });

  test('muestra errores y no envía si faltan datos', async () => {
    const user = userEvent.setup();
    render(<BookingForm />);
    await user.click(screen.getByRole('button', { name: /agendar cita/i }));
    expect(mockedSend).not.toHaveBeenCalled();
    expect(screen.getByText('Elige un servicio.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu nombre completo.')).toBeInTheDocument();
    expect(screen.getByText(/faltan 6 datos/i)).toBeInTheDocument();
  });

  test('envía el formulario con el mismo contrato y muestra confirmación', async () => {
    const user = userEvent.setup();
    render(<BookingForm />);
    await fillValidBooking(user);
    await user.click(screen.getByRole('button', { name: /agendar cita/i }));

    expect(mockedSend).toHaveBeenCalledWith({
      client_name: 'Juan Pérez',
      client_phone: '3001234567',
      service: 'Corte + Barba',
      barber: 'Andrés Estilo',
      appointment_date: '2026-10-15',
      appointment_time: '16:30',
      price: 25,
    });
    expect(await screen.findByRole('heading', { name: /cita confirmada/i })).toBeInTheDocument();
  });

  test('muestra el error del servicio si n8n falla', async () => {
    mockedSend.mockRejectedValueOnce(new Error('Error 500: Internal Server Error'));
    const user = userEvent.setup();
    render(<BookingForm />);
    await fillValidBooking(user);
    await user.click(screen.getByRole('button', { name: /agendar cita/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Error 500');
    expect(screen.getByRole('button', { name: /agendar cita/i })).toBeEnabled();
  });
});
