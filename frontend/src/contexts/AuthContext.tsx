'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import api, { authApi } from '@/lib/api';
import { isAuthenticated, logout as doLogout, setTokens } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login({ email, password });

    // Handle 2FA challenge
    if ('requires2fa' in result && result.requires2fa) {
      router.push(`/auth/2fa?token=${encodeURIComponent(result.tempToken)}`);
      return;
    }

    const { accessToken, refreshToken } = result as { accessToken: string; refreshToken: string };
    setTokens(accessToken, refreshToken);
    // Fetch the user profile now that tokens are stored
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
    router.push('/dashboard');
  };

  const logout = () => {
    doLogout();
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
