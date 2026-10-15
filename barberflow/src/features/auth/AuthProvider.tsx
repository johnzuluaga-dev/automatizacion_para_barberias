import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getMyProfile, signOut as apiSignOut, subscribeToAuth, type Profile } from './auth-api';
import { AuthContext, type AuthState } from './auth-context';

interface ProfileEntry {
  userId: string;
  profile: Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [entry, setEntry] = useState<ProfileEntry | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(
    () =>
      subscribeToAuth((event, next) => {
        // No se llama a Supabase dentro de este callback (recomendación de supabase-js).
        setSession(next);
        setLoading(false);
        if (event === 'PASSWORD_RECOVERY') setRecovering(true);
        if (event === 'SIGNED_OUT') setRecovering(false);
      }),
    [],
  );

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getMyProfile(userId).then((profile) => {
      if (active) setEntry({ userId, profile });
    });
    return () => {
      active = false;
    };
  }, [userId, profileVersion]);

  const signOut = useCallback(async () => {
    await apiSignOut();
  }, []);

  const refreshProfile = useCallback(() => setProfileVersion((v) => v + 1), []);

  const value = useMemo<AuthState>(() => {
    const profile = entry && entry.userId === userId ? entry.profile : null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      // Sin perfil (p. ej. migración aún no aplicada) se trata como cliente.
      role: userId ? (profile?.role ?? 'client') : null,
      loading,
      profileLoading: Boolean(userId) && (!entry || entry.userId !== userId),
      recovering,
      signOut,
      refreshProfile,
    };
  }, [session, userId, entry, loading, recovering, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
