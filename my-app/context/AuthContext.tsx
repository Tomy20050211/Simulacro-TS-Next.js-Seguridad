'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import type { AuthUser } from '@/types/domain';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshSession: () => Promise<AuthUser | null>;
  login: (input: { email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const payload = await readJson<{ success: boolean; data?: { user?: AuthUser }; message?: string }>(response);

      if (!response.ok) {
        setUser(null);
        setError(payload?.message ?? 'No fue posible validar la sesión.');
        return null;
      }

      const nextUser = payload?.data?.user ?? null;
      setUser(nextUser);
      setError(null);
      return nextUser;
    } catch {
      setUser(null);
      setError('No fue posible validar la sesión.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (input: { email: string; password: string }): Promise<AuthUser> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const payload = await readJson<{ success: boolean; data?: { user: AuthUser; dashboardPath: string }; message?: string }>(
      response,
    );

    if (!response.ok) {
      throw new Error(payload?.message ?? 'No fue posible iniciar sesión.');
    }

    const nextUser = payload?.data?.user;

    if (!nextUser) {
      throw new Error('La respuesta de sesión no incluye usuario.');
    }

    setUser(nextUser);
    setError(null);
    router.push(payload?.data?.dashboardPath ?? `/dashboard/${nextUser.role.toLowerCase()}`);
    return nextUser;
  }, [router]);

  const logout = useCallback(async (): Promise<void> => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: Boolean(user),
        refreshSession,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
