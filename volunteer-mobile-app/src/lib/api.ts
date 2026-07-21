import { secureStorage } from "./storage";
import type { AuthUserModel, LoginSession, StudentRecord } from "./types";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const refreshTokenKey = "eventpass.volunteer.refreshToken";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as { data?: T; error?: { message?: string }; message?: string }) : {};

  if (!response.ok) {
    throw new Error(payload.error?.message ?? payload.message ?? "Request failed");
  }

  return (payload.data ?? (payload as T)) as T;
};

const requestJson = async <T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string
) => {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers
  });
  return await parseResponse<T>(response);
};

export const api = {
  login: async (input: {
    email: string;
    password: string;
    rememberLogin: boolean;
  }) => {
    const session = await requestJson<LoginSession>("/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        ...input,
        userModel: "Volunteer" satisfies AuthUserModel
      })
    });
    await secureStorage.set(refreshTokenKey, session.refreshToken);
    return session;
  },

  refresh: async (refreshToken: string) => {
    const session = await requestJson<Omit<LoginSession, "user">>("/auth/refresh", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ refreshToken })
    });
    await secureStorage.set(refreshTokenKey, session.refreshToken);
    return session;
  },

  logout: async (refreshToken: string) => {
    await requestJson<void>("/auth/logout", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ refreshToken })
    });
    await secureStorage.set(refreshTokenKey, null);
  },

  me: async (accessToken: string) => {
    return await requestJson<LoginSession["user"]>("/auth/me", { method: "GET" }, accessToken);
  },

  trackStudent: async (accessToken: string, registrationId: string) => {
    return await requestJson<StudentRecord>(`/students/track/${encodeURIComponent(registrationId)}`, { method: "GET" }, accessToken);
  },

  getStoredRefreshToken: async () => await secureStorage.get(refreshTokenKey),
  clearStoredRefreshToken: async () => await secureStorage.set(refreshTokenKey, null)
};
