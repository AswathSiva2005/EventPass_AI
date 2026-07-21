import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { VolunteerAccount } from "../lib/types";

interface AuthContextValue {
  account: VolunteerAccount | null;
  accessToken: string | null;
  hydrated: boolean;
  signingIn: boolean;
  login: (input: { email: string; password: string; rememberLogin: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  loadStudent: (registrationId: string) => Promise<Awaited<ReturnType<typeof api.trackStudent>>>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<VolunteerAccount | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const restoreSession = useCallback(async () => {
    const refreshToken = await api.getStoredRefreshToken();
    if (!refreshToken) {
      setHydrated(true);
      return;
    }

    try {
      const session = await api.refresh(refreshToken);
      setAccessToken(session.accessToken);
      const profile = await api.me(session.accessToken);
      setAccount(profile);
    } catch {
      await api.clearStoredRefreshToken();
      setAccessToken(null);
      setAccount(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (input: { email: string; password: string; rememberLogin: boolean }) => {
    setSigningIn(true);
    try {
      const session = await api.login(input);
      setAccessToken(session.accessToken);
      setAccount(session.user);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = await api.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error("No saved session.");
    }

    const session = await api.refresh(refreshToken);
    setAccessToken(session.accessToken);
    const profile = await api.me(session.accessToken);
    setAccount(profile);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await api.getStoredRefreshToken();
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        await api.clearStoredRefreshToken();
      }
    }
    setAccessToken(null);
    setAccount(null);
  }, []);

  const loadStudent = useCallback(
    async (registrationId: string) => {
      if (!accessToken) {
        throw new Error("Sign in first.");
      }
      return await api.trackStudent(accessToken, registrationId);
    },
    [accessToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      accessToken,
      hydrated,
      signingIn,
      login,
      logout,
      loadStudent,
      refreshSession
    }),
    [account, accessToken, hydrated, signingIn, login, logout, loadStudent, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
};
