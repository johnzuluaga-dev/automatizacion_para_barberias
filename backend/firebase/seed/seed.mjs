// Carga los datos de prueba en Firestore con la cuenta de servicio.
// Uso: GOOGLE_APPLICATION_CREDENTIALS=<ruta al JSON, fuera del repo> node seed/seed.mjs
// Es idempotente: vuelve a escribir los mismos IDs.
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const seed = JSON.parse(readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
const batch = db.batch();
for (const [collection, docs] of Object.entries(seed)) {
  for (const [id, data] of Object.entries(docs)) {
    batch.set(db.collection(collection).doc(id), {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
await batch.commit();
console.log('Datos de prueba cargados:', Object.keys(seed).join(', '));
