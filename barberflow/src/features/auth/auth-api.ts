/**
 * Flujos de cuenta sobre Supabase Auth. Ningún código, token ni contraseña se
 * escribe en la consola; los errores salen ya traducidos (ver errors.ts).
 */
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { AuthFlowError, toAuthFlowError } from './errors';

export type Role = 'admin' | 'client';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

const origin = () => window.location.origin;

/** Ejecuta una llamada de Supabase Auth y lanza un AuthFlowError si falla. */
async function run(fn: () => Promise<{ error: unknown }>): Promise<void> {
  let result: { error: unknown };
  try {
    result = await fn();
  } catch (err) {
    throw toAuthFlowError(err);
  }
  if (result.error) throw toAuthFlowError(result.error);
}

/* ---------------------------- Sesión y perfil ---------------------------- */

export function subscribeToAuth(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function signOut(): Promise<void> {
  await run(async () => supabase.auth.signOut());
}

/* -------------------------------- Registro ------------------------------- */

/**
 * Crea la cuenta y dispara el correo con el código de 6 dígitos.
 * Si el correo ya existe, Supabase responde igual que un registro nuevo
 * (no revela qué correos están registrados); el flujo continúa a /verificar.
 */
export async function signUp({ fullName, email, phone, password }: SignUpInput): Promise<void> {
  await run(async () =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin()}/ingresar`,
        data: {
          full_name: fullName,
          phone: phone || null,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    }),
  );
}

export async function verifyEmailCode(email: string, token: string): Promise<void> {
  await run(async () => supabase.auth.verifyOtp({ email, token, type: 'email' }));
}

export async function resendSignupCode(email: string): Promise<void> {
  await run(async () =>
    supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${origin()}/ingresar` } }),
  );
}

/* ------------------------------ Inicio de sesión ------------------------- */

export async function signInWithPassword(email: string, password: string): Promise<void> {
  await run(async () => supabase.auth.signInWithPassword({ email, password }));
}

/**
 * Envía un código para entrar sin contraseña. No crea cuentas nuevas y no
 * revela si el correo existe: un correo desconocido se trata como enviado.
 */
export async function sendLoginCode(email: string): Promise<void> {
  try {
    await run(async () => supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }));
  } catch (err) {
    const error = toAuthFlowError(err);
    if (error.code.startsWith('over_') || error.code === 'network') throw error;
  }
}

export async function sendSmsLoginCode(phone: string): Promise<void> {
  try {
    await run(async () => supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } }));
  } catch (err) {
    const error = toAuthFlowError(err);
    if (error.code.startsWith('over_') || error.code === 'network' || error.code === 'phone_provider_disabled') throw error;
  }
}

export async function verifySmsCode(phone: string, token: string): Promise<void> {
  await run(async () => supabase.auth.verifyOtp({ phone, token, type: 'sms' }));
}

/* ------------------------------- Recuperación ---------------------------- */

/**
 * Envía el correo de recuperación (enlace + código). Siempre "tiene éxito"
 * para no revelar si el correo existe, salvo límite de envíos o sin conexión.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await run(async () => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/nueva-contrasena` }));
  } catch (err) {
    const error = toAuthFlowError(err);
    if (error.code.startsWith('over_') || error.code === 'network') throw error;
  }
}

export async function verifyRecoveryCode(email: string, token: string): Promise<void> {
  await run(async () => supabase.auth.verifyOtp({ email, token, type: 'recovery' }));
}

export async function updatePassword(password: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw new AuthFlowError('session_expired', 'El enlace o código venció. Pide uno nuevo para cambiar tu contraseña.');
  }
  await run(async () => supabase.auth.updateUser({ password }));
}
