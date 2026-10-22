/** Doble de src/lib/catalogo: el catálogo del seed, sin tocar Firestore. */
import type { Barber, Catalog, Service } from '../../src/features/booking/catalog';

const OPEN_DAY = [{ desde: '11:00', hasta: '20:00' }];
const SCHEDULE = { '1': OPEN_DAY, '2': OPEN_DAY, '3': OPEN_DAY, '4': OPEN_DAY, '5': OPEN_DAY, '6': OPEN_DAY };

export const SERVICES: Service[] = [
  { id: 'corte-clasico', name: 'Corte Clásico', price: 15, durationMin: 30 },
  { id: 'corte-barba', name: 'Corte + Barba', price: 25, durationMin: 60 },
  { id: 'perfilado-barba', name: 'Perfilado de Barba', price: 10, durationMin: 30 },
  { id: 'tratamiento-facial', name: 'Tratamiento Facial', price: 30, durationMin: 60 },
];

const ALL = SERVICES.map((s) => s.id);

export const BARBERS: Barber[] = [
  { id: 'carlos-the-blade', name: 'Carlos The Blade', serviceIds: ALL, schedule: SCHEDULE },
  { id: 'andres-estilo', name: 'Andrés Estilo', serviceIds: ALL, schedule: SCHEDULE },
  { id: 'juan-classic', name: 'Juan Classic', serviceIds: ALL, schedule: SCHEDULE },
];

export const getCatalog = async (): Promise<Catalog> => ({ services: SERVICES, barbers: BARBERS });
export const getBlocks = async () => [];
