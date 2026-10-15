import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, Role } from './auth-api';

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** Perfil del usuario actual (null mientras carga o si no existe). */
  profile: Profile | null;
  role: Role | null;
  /** true hasta conocer la sesión inicial. */
  loading: boolean;
  /** true mientras se carga el perfil de un usuario con sesión. */
  profileLoading: boolean;
  /** Llegó desde un enlace de recuperación de contraseña. */
  recovering: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
