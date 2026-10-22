import { describe, expect, test } from 'vitest';
import { DEFAULT_SCHEDULE, isClosedDay, slotCells, slotsFor, upcomingDays } from '../src/features/booking/schedule';
import { validateBooking, EMPTY_BOOKING } from '../src/features/booking/validation';
import { BARBERS, SERVICES } from './mocks/catalogo';

// Jueves 15 y domingo 18 de octubre de 2026.
describe('horario por barbero', () => {
  test('lunes a sábado de 11:00 a 19:30 y domingo cerrado por defecto', () => {
    const slots = slotsFor('2026-10-15');
    expect(slots).toHaveLength(18);
    expect(slots[0]).toBe('11:00');
    expect(slots.at(-1)).toBe('19:30');
    expect(isClosedDay('2026-10-18')).toBe(true);
    expect(slotsFor('2026-10-18')).toEqual([]);
  });

  test('un servicio de 60 min no puede empezar a las 19:30', () => {
    const slots = slotsFor('2026-10-15', DEFAULT_SCHEDULE, 60);
    expect(slots.at(-1)).toBe('19:00');
  });

  test('respeta tramos partidos y días libres del barbero', () => {
    const schedule = {
      '4': [
        { desde: '09:00', hasta: '10:00' },
        { desde: '14:00', hasta: '15:00' },
      ],
    };
    expect(slotsFor('2026-10-15', schedule)).toEqual(['09:00', '09:30', '14:00', '14:30']);
    expect(isClosedDay('2026-10-16', schedule)).toBe(true);
    expect(upcomingDays(2, new Date(2026, 9, 15), schedule).map((d) => d.closed)).toEqual([false, true]);
  });

  test('un servicio ocupa uno o más turnos de 30 min', () => {
    expect(slotCells('16:30', 30)).toEqual(['16:30']);
    expect(slotCells('16:30', 60)).toEqual(['16:30', '17:00']);
  });
});

describe('validación con el catálogo', () => {
  const now = new Date(2026, 9, 14, 9, 0);
  const catalog = { services: SERVICES, barbers: BARBERS };
  const base = {
    ...EMPTY_BOOKING,
    client_name: 'Laura Gómez',
    client_phone: '3001234567',
    service: 'corte-barba',
    barber: 'andres-estilo',
    appointment_date: '2026-10-15',
  };

  test('acepta una reserva válida', () => {
    expect(validateBooking({ ...base, appointment_time: '16:30' }, catalog, now)).toEqual({});
  });

  test('rechaza un servicio que termina después del cierre', () => {
    expect(validateBooking({ ...base, appointment_time: '19:30' }, catalog, now).appointment_time).toMatch(/horario/);
  });

  test('rechaza un barbero que no ofrece el servicio', () => {
    const limited = { services: SERVICES, barbers: [{ ...(BARBERS[1] as (typeof BARBERS)[number]), serviceIds: ['corte-clasico'] }] };
    expect(validateBooking({ ...base, appointment_time: '16:30' }, limited, now).barber).toBeDefined();
  });
});
