"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, currentUser, logout } from "@/lib/api-client";
import type { AuthenticatedUserResponse } from "@/lib/contracts";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AuthContextValue = {
  session: AuthenticatedUserResponse | null;
  status: AuthStatus;
  error: string | null;
  setSession: (session: AuthenticatedUserResponse | null) => void;
  refreshSession: () => Promise<AuthenticatedUserResponse | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, updateSession] = useState<AuthenticatedUserResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const setSession = useCallback((nextSession: AuthenticatedUserResponse | null) => {
    updateSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");
    setError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await currentUser();
      updateSession(nextSession);
      setStatus("authenticated");
      setError(null);
      return nextSession;
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        updateSession(null);
        setStatus("unauthenticated");
        setError(null);
        return null;
      }
      updateSession(null);
      setStatus("error");
      setError(refreshError instanceof Error ? refreshError.message : "Authentication service is unavailable.");
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    currentUser()
      .then((nextSession) => {
        if (!active) return;
        updateSession(nextSession);
        setStatus("authenticated");
        setError(null);
      })
      .catch((refreshError) => {
        if (!active) return;
        updateSession(null);
        if (refreshError instanceof ApiError && refreshError.status === 401) {
          setStatus("unauthenticated");
          setError(null);
          return;
        }
        setStatus("error");
        setError(refreshError instanceof Error ? refreshError.message : "Authentication service is unavailable.");
      });
    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      updateSession(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ session, status, error, setSession, refreshSession, signOut }),
    [error, refreshSession, session, setSession, signOut, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
