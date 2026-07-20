import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearSession, readSession, saveSession } from "../api/client";
import type { AdminUser, ApiResponse } from "../types/api";

interface AuthContextValue {
  user: AdminUser | null; loading: boolean;
  login: (email:string,password:string,remember:boolean)=>Promise<void>;
  logout: ()=>Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(() => Boolean(readSession()));
  useEffect(() => {
    if (!readSession()) return;
    api.get<ApiResponse<AdminUser>>("/auth/me").then(({data}) => setUser(data.data)).catch(() => clearSession()).finally(() => setLoading(false));
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user, loading,
    login: async (email,password,remember) => {
      const { data } = await api.post<ApiResponse<{accessToken:string;refreshToken:string;user:AdminUser}>>("/auth/login", { email,password,userModel:"Admin",rememberLogin:remember });
      saveSession({ accessToken:data.data.accessToken, refreshToken:data.data.refreshToken, remember });
      setUser(data.data.user);
    },
    logout: async () => {
      const session=readSession();
      try { if(session) await api.post("/auth/logout",{refreshToken:session.refreshToken}); } finally { clearSession(); setUser(null); }
    }
  }), [loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const value=useContext(AuthContext);
  if(!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
