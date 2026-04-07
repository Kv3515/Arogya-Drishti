'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { api, tokenStore, type UserInfo } from '@/lib/api';

// ── Dev bypass ────────────────────────────────────────────────────────────────
// When NEXT_PUBLIC_DEV_BYPASS=true the auth flow is skipped entirely.
// A mock super_admin user is injected immediately so every dashboard loads
// without requiring a login. Matches DEV_BYPASS_AUTH=true on the backend.
// Remove / set to false when starting Phase 6 (auth hardening).
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

const DEV_MOCK_USER: UserInfo = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'dev_admin',
  email: null,
  role: 'super_admin',
  unitId: '00000000-0000-0000-0000-000000000000',
  individualId: null,
  serviceNumber: null,
};

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(DEV_BYPASS ? DEV_MOCK_USER : null);
  const [loading, setLoading] = useState(!DEV_BYPASS); // bypass = never loading

  // On mount: attempt silent refresh to restore session (skipped in bypass mode)
  useEffect(() => {
    if (DEV_BYPASS) return; // mock user already set above

    (async () => {
      try {
        const apiBase = typeof window !== 'undefined'
          ? `http://${window.location.hostname}:3001/api/v1`
          : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1');
        const res = await fetch(
          `${apiBase}/auth/refresh`,
          { method: 'POST', credentials: 'include' },
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data?.accessToken) {
            tokenStore.set(json.data.accessToken);
            const me = await api.getMe();
            setUser(me);
          }
        }
      } catch {
        // No valid session — user stays null
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (DEV_BYPASS) { setUser(DEV_MOCK_USER); return; }
    const tokens = await api.login(username, password);
    tokenStore.set(tokens.accessToken);
    setUser(tokens.user);
  }, []);

  const logout = useCallback(async () => {
    if (DEV_BYPASS) { setUser(DEV_MOCK_USER); return; } // no-op in bypass
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
