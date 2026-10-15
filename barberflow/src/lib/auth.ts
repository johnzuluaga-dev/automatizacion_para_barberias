/**
 * Sesión del panel administrativo (sessionStorage, igual que la versión anterior).
 */

const AUTH_KEY = 'barberflow_auth';

export const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'admin';
export const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'barberflow2026';

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function login(username: string, password: string): boolean {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY);
}
