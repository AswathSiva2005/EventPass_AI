import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v1";
const storageKey = "eventpass-admin-session";

export interface StoredSession { accessToken: string; refreshToken: string; remember: boolean; }
export const readSession = (): StoredSession | null => {
  const raw = localStorage.getItem(storageKey) ?? sessionStorage.getItem(storageKey);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredSession; } catch { return null; }
};
export const saveSession = (session: StoredSession) => {
  localStorage.removeItem(storageKey); sessionStorage.removeItem(storageKey);
  (session.remember ? localStorage : sessionStorage).setItem(storageKey, JSON.stringify(session));
};
export const clearSession = () => { localStorage.removeItem(storageKey); sessionStorage.removeItem(storageKey); };

export const api = axios.create({ baseURL, timeout: 25_000 });
api.interceptors.request.use((config) => {
  const token = readSession()?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || error.config?.url?.includes("/auth/")) {
      throw error;
    }
    const original = error.config;
    if (!original || (original as { _retried?: boolean })._retried) throw error;
    const session = readSession();
    if (!session) throw error;
    (original as { _retried?: boolean })._retried = true;
    refreshing ??= axios
      .post<{ data: { accessToken: string; refreshToken: string } }>(`${baseURL}/auth/refresh`, { refreshToken: session.refreshToken })
      .then(({ data }) => {
        saveSession({ ...session, ...data.data });
        return data.data.accessToken;
      })
      .finally(() => { refreshing = null; });
    const accessToken = await refreshing;
    original.headers.Authorization = `Bearer ${accessToken}`;
    return api.request(original);
  }
);
