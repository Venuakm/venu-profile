"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "./api";
import type { AdminUser } from "./types";

type AuthState = {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AdminUser | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /** Reads the session, silently swapping an expired access token for a fresh one. */
  const refresh = useCallback(async () => {
    try {
      const { admin: me } = await api<{ admin: AdminUser }>("/api/auth/me");
      setAdmin(me);
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const { admin: renewed } = await api<{ admin: AdminUser }>("/api/auth/refresh", { method: "POST" });
          setAdmin(renewed);
          return renewed;
        } catch {
          setAdmin(null);
          return null;
        }
      }
      setAdmin(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Access tokens are short-lived; renew well before they lapse.
  useEffect(() => {
    if (!admin) return;
    const timer = setInterval(() => {
      void api("/api/auth/refresh", { method: "POST" }).catch(() => setAdmin(null));
    }, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [admin]);

  const login = useCallback(async (email: string, password: string) => {
    const { admin: me } = await api<{ admin: AdminUser }>("/api/auth/login", {
      json: { email, password },
    });
    setAdmin(me);
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setAdmin(null);
    router.push("/admin/login");
  }, [router]);

  const value = useMemo(
    () => ({ admin, loading, login, logout, refresh }),
    [admin, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
