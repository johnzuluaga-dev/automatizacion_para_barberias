import { createContext, useContext } from 'react';
import type { AuthUser, Profile, Role } from './auth-api';

export interface AuthState {
  user: AuthUser | null;
  /** Perfil del usuario actual (null mientras carga o si no existe). */
  profile: Profile | null;
  role: Role | null;
  /** true hasta conocer la sesión inicial. */
  loading: boolean;
  /** true mientras se carga el perfil de un usuario con sesión. */
  profileLoading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
