/**
 * Doble de src/features/auth/auth-api para las pruebas: sesión controlable y
 * funciones espía. Uso: vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'))
 */
import { vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Profile, Role } from '../../src/features/auth/auth-api';

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

let session: Session | null = null;
let profile: Profile | null = null;
const listeners = new Set<Listener>();

export function setTestSession(user: { id?: string; email?: string; name?: string; role?: Role } | null) {
  if (!user) {
    session = null;
    profile = null;
  } else {
    const id = user.id ?? 'user-1';
    session = { user: { id, email: user.email ?? 'cliente@correo.com' } } as unknown as Session;
    profile = { id, full_name: user.name ?? 'Juan Pérez', phone: '3001234567', role: user.role ?? 'client' };
  }
  listeners.forEach((cb) => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
}

export function resetAuthMock() {
  session = null;
  profile = null;
  listeners.clear();
  for (const fn of [
    signUp,
    verifyEmailCode,
    resendSignupCode,
    signInWithPassword,
    sendLoginCode,
    sendSmsLoginCode,
    verifySmsCode,
    requestPasswordReset,
    verifyRecoveryCode,
    updatePassword,
  ]) {
    fn.mockReset();
    fn.mockResolvedValue(undefined);
  }
  signOut.mockReset();
  signOut.mockImplementation(async () => {
    setTestSession(null);
  });
}

export const subscribeToAuth = (cb: Listener) => {
  listeners.add(cb);
  queueMicrotask(() => cb('INITIAL_SESSION', session));
  return () => {
    listeners.delete(cb);
  };
};

export const getMyProfile = vi.fn(async () => profile);
export const signUp = vi.fn(async () => undefined);
export const verifyEmailCode = vi.fn(async () => undefined);
export const resendSignupCode = vi.fn(async () => undefined);
export const signInWithPassword = vi.fn(async () => undefined);
export const sendLoginCode = vi.fn(async () => undefined);
export const sendSmsLoginCode = vi.fn(async () => undefined);
export const verifySmsCode = vi.fn(async () => undefined);
export const requestPasswordReset = vi.fn(async () => undefined);
export const verifyRecoveryCode = vi.fn(async () => undefined);
export const updatePassword = vi.fn(async () => undefined);
export const signOut = vi.fn(async () => {
  setTestSession(null);
});
