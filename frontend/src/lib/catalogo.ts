/** Catálogo de la barbería en Firestore: servicios y barberos activos (lectura pública). */
import { collection, getDocs, query, Timestamp, where, type DocumentData } from 'firebase/firestore';
import type { Barber, Catalog, Service, WeeklySchedule } from '@/features/booking/catalog';
import { db } from './firebase';

const byOrder = (a: DocumentData, b: DocumentData) => (a.orden ?? 99) - (b.orden ?? 99);

export async function getCatalog(): Promise<Catalog> {
  const [servicios, barberos] = await Promise.all([
    getDocs(query(collection(db, 'servicios'), where('activo', '==', true))),
    getDocs(query(collection(db, 'barberos'), where('activo', '==', true))),
  ]);

  const services: Service[] = servicios.docs
    .map((d) => ({ id: d.id, data: d.data() }))
    .sort((a, b) => byOrder(a.data, b.data))
    .map(({ id, data }) => ({ id, name: data.nombre, price: data.precio, durationMin: data.duracionMin }));

  const barbers: Barber[] = barberos.docs
    .map((d) => ({ id: d.id, data: d.data() }))
    .sort((a, b) => byOrder(a.data, b.data))
    .map(({ id, data }) => ({
      id,
      name: data.nombre,
      serviceIds: data.servicioIds ?? [],
      schedule: (data.horarioSemanal ?? {}) as WeeklySchedule,
    }));

  return { services, barbers };
}

export interface Block {
  inicio: Date;
  fin: Date;
}

/** Vacaciones, descansos y días libres del barbero que aún no terminaron. Sin sesión no se leen. */
export async function getBlocks(barberId: string): Promise<Block[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'bloqueos_barbero'), where('barberoId', '==', barberId), where('fin', '>=', Timestamp.now())),
    );
    return snap.docs.map((d) => ({ inicio: d.data().inicio.toDate(), fin: d.data().fin.toDate() }));
  } catch {
    return [];
  }
}
