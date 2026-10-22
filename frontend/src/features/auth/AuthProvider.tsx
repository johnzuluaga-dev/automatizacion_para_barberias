import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { signOut as apiSignOut, subscribeToAuth, subscribeToProfile, type AuthUser, type Profile } from './auth-api';
import { AuthContext, type AuthState } from './auth-context';

interface ProfileEntry {
  userId: string;
  profile: Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<ProfileEntry | null>(null);

  useEffect(
    () =>
      subscribeToAuth((next) => {
        setUser(next);
        setLoading(false);
      }),
    [],
  );

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    return subscribeToProfile(userId, (profile) => setEntry({ userId, profile }));
  }, [userId]);

  const signOut = useCallback(async () => {
    await apiSignOut();
  }, []);

  const value = useMemo<AuthState>(() => {
    const profile = entry && entry.userId === userId ? entry.profile : null;
    return {
      user,
      profile,
      role: user ? user.role : null,
      loading,
      profileLoading: Boolean(userId) && (!entry || entry.userId !== userId),
      signOut,
    };
  }, [user, userId, entry, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
