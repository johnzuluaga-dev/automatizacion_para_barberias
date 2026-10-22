// Asigna el rol de una cuenta (equivale a snippets/hacer_admin.sql de Supabase).
// Uso: GOOGLE_APPLICATION_CREDENTIALS=<ruta> node scripts/asignar_rol.mjs correo@dominio.com admin
//      node scripts/asignar_rol.mjs correo@dominio.com barbero carlos-the-blade
//      node scripts/asignar_rol.mjs correo@dominio.com cliente
// La persona debe cerrar sesión y volver a entrar para que el token traiga el nuevo rol.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const [email, rol, barberoId] = process.argv.slice(2);
if (!email || !['admin', 'barbero', 'cliente'].includes(rol) || (rol === 'barbero' && !barberoId)) {
  console.error('Uso: node scripts/asignar_rol.mjs <correo> <admin|barbero|cliente> [barberoId]');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, rol === 'barbero' ? { rol, barberoId } : { rol });
await getFirestore().collection('perfiles').doc(user.uid).set(
  { rol, ...(rol === 'barbero' ? { barberoId } : {}), updatedAt: FieldValue.serverTimestamp() },
  { merge: true },
);
console.log(`${email} ahora es ${rol}${rol === 'barbero' ? ` (${barberoId})` : ''}.`);
