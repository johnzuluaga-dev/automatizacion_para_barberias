/**
 * Doble de src/features/auth/auth-api para las pruebas: sesión controlable y
 * funciones espía. Uso: vi.mock('../src/features/auth/auth-api', () => import('./mocks/auth-api'))
 */
import { vi } from 'vitest';
import type { AuthUser, Profile, Role } from '../../src/features/auth/auth-api';

type Listener = (user: AuthUser | null) => void;

let current: AuthUser | null = null;
let profile: Profile | null = null;
const listeners = new Set<Listener>();

export function setTestSession(
  user: { id?: string; email?: string; name?: string; role?: Role; emailVerified?: boolean } | null,
) {
  if (!user) {
    current = null;
    profile = null;
  } else {
    const id = user.id ?? 'user-1';
    current = {
      id,
      email: user.email ?? 'cliente@correo.com',
      emailVerified: user.emailVerified ?? true,
      role: user.role ?? 'cliente',
    };
    profile = { id, full_name: user.name ?? 'Juan Pérez', phone: '3001234567' };
  }
  listeners.forEach((cb) => cb(current));
}

export function resetAuthMock() {
  current = null;
  profile = null;
  listeners.clear();
  for (const fn of [signUp, resendVerification, reloadUser, signInWithPassword, requestPasswordReset]) {
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
  queueMicrotask(() => cb(current));
  return () => {
    listeners.delete(cb);
  };
};

export const subscribeToProfile = (_userId: string, cb: (p: Profile | null) => void) => {
  queueMicrotask(() => cb(profile));
  return () => {};
};

export const signUp = vi.fn(async () => undefined);
export const resendVerification = vi.fn(async () => undefined);
export const reloadUser = vi.fn(async () => undefined);
export const signInWithPassword = vi.fn(async () => undefined);
export const requestPasswordReset = vi.fn(async () => undefined);
export const signOut = vi.fn(async () => {
  setTestSession(null);
});
