/**
 * Flujos de cuenta sobre Firebase Auth. Ningún token ni contraseña se escribe en
 * la consola; los errores salen ya traducidos (ver errors.ts).
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toAuthFlowError } from './errors';
import { toE164 } from './validation';

export type Role = 'admin' | 'barbero' | 'cliente';

/** Persona con sesión. El rol viene del custom claim del token, no del perfil. */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: Role;
  /** Solo para barberos: el barbero del catálogo que atienden (claim `barberoId`). */
  barberoId?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

const origin = () => window.location.origin;

/** Errores de Firebase cuando el dominio actual no está en "Dominios autorizados". */
const CONTINUE_URL_ERRORS = new Set(['auth/unauthorized-continue-uri', 'auth/invalid-continue-uri']);

/**
 * Envía el enlace de verificación volviendo a /ingresar. Si el dominio no está
 * autorizado en Firebase, lo envía sin URL de regreso en vez de no enviarlo.
 */
async function sendVerificationLink(user: User): Promise<void> {
  try {
    await sendEmailVerification(user, { url: `${origin()}/ingresar` });
  } catch (err) {
    if (!(err instanceof FirebaseError) || !CONTINUE_URL_ERRORS.has(err.code)) throw err;
    await sendEmailVerification(user);
  }
}

/** Ejecuta una llamada de Firebase Auth y lanza un AuthFlowError si falla. */
async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw toAuthFlowError(err);
  }
}

/* ---------------------------- Sesión y perfil ---------------------------- */

async function toAuthUser(user: User): Promise<AuthUser> {
  let role: Role = 'cliente';
  let barberoId: string | undefined;
  try {
    const { claims } = await user.getIdTokenResult();
    if (claims.rol === 'admin' || claims.rol === 'barbero') role = claims.rol;
    if (role === 'barbero' && typeof claims.barberoId === 'string') barberoId = claims.barberoId;
  } catch {
    // Sin token legible se trata como cliente; las reglas de Firestore mandan igual.
  }
  return { id: user.uid, email: user.email ?? '', emailVerified: user.emailVerified, role, barberoId };
}

const manualRefresh = new Set<() => void>();

/** Avisa la sesión actual (null si no hay) y cada cambio posterior. */
export function subscribeToAuth(callback: (user: AuthUser | null) => void) {
  let latest = 0;
  const push = async (user: User | null) => {
    const mine = ++latest;
    const next = user ? await toAuthUser(user) : null;
    if (mine === latest) callback(next);
  };
  const stop = onAuthStateChanged(auth, (user) => void push(user));
  const refresh = () => void push(auth.currentUser);
  manualRefresh.add(refresh);
  return () => {
    stop();
    manualRefresh.delete(refresh);
  };
}

/** Perfil en vivo: así aparece solo cuando el registro termina de guardarlo. */
export function subscribeToProfile(userId: string, callback: (profile: Profile | null) => void) {
  return onSnapshot(
    doc(db, 'perfiles', userId),
    (snap) => {
      const data = snap.data();
      callback(data ? { id: userId, full_name: data.nombre ?? null, phone: data.telefono ?? null } : null);
    },
    () => callback(null),
  );
}

export async function signOut(): Promise<void> {
  await run(() => firebaseSignOut(auth));
}

/** Vuelve a leer la cuenta y el token (tras abrir el enlace de verificación). */
export async function reloadUser(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await run(async () => {
    await user.reload();
    await user.getIdToken(true);
  });
  manualRefresh.forEach((refresh) => refresh());
}

/* -------------------------------- Registro ------------------------------- */

/** Crea la cuenta, guarda el perfil y envía el enlace para verificar el correo. */
export async function signUp({ fullName, email, phone, password }: SignUpInput): Promise<void> {
  await run(async () => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'perfiles', user.uid), {
      nombre: fullName,
      telefono: phone ? toE164(phone) : null,
      terminosAceptadosEn: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await sendVerificationLink(user);
  });
}

export async function resendVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw toAuthFlowError(new Error('sin sesión'));
  await run(() => sendVerificationLink(user));
}

/* ------------------------------ Inicio de sesión ------------------------- */

export async function signInWithPassword(email: string, password: string): Promise<void> {
  await run(() => signInWithEmailAndPassword(auth, email, password));
}

/* ------------------------------- Recuperación ---------------------------- */

/**
 * Envía el correo con el enlace para crear una contraseña nueva. Siempre "tiene
 * éxito" para no revelar si el correo existe, salvo límite de envíos o sin conexión.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await run(() => sendPasswordResetEmail(auth, email, { url: `${origin()}/ingresar` }));
  } catch (err) {
    const error = toAuthFlowError(err);
    if (error.code === 'over_request_rate_limit' || error.code === 'network') throw error;
  }
}
