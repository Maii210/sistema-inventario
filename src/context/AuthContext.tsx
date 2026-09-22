import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { supabase, Profile, Role } from '@/lib/supabase';

interface AuthContextValue {
  session: { user: { id: string } } | null;
  user: { id: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role?: Role) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('camila_user');
      const sessData = localStorage.getItem('camila_session');
      if (stored && sessData) {
        setProfile(JSON.parse(stored));
        setSession(JSON.parse(sessData));
      }
    } catch {}
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      setProfile(data.user);
      setSession(data.session);
      localStorage.setItem('camila_user', JSON.stringify(data.user));
      localStorage.setItem('camila_session', JSON.stringify(data.session));
      return { error: null };
    }
    return { error: 'No se pudo iniciar sesión' };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: Role = 'vendedor') => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('camila_user');
    localStorage.removeItem('camila_session');
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    try {
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfile(data);
        localStorage.setItem('camila_user', JSON.stringify(data));
      }
    } catch {}
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
