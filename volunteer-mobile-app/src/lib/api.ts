import { secureStorage } from "./storage";
import type { AuthUserModel, ExportEvent, LoginSession, StudentRecord, StudentSearchField, StudentSearchPage } from "./types";

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";
const refreshTokenKey = "eventpass.volunteer.refreshToken";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const parseEnvelope = async <T>(response: Response): Promise<{ data?: T; meta?: { page: number; limit: number; total: number; totalPages: number } }> => {
  const rawText = await response.text();
  let payload: { data?: T; meta?: { page: number; limit: number; total: number; totalPages: number }; error?: { message?: string }; message?: string } = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as typeof payload;
    } catch {
      throw new Error(
        `API returned ${response.status} ${response.statusText} instead of JSON. Check EXPO_PUBLIC_API_URL and the backend server.`
      );
    }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? payload.message ?? "Request failed");
  }

  return payload;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = await parseEnvelope<T>(response);
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
    phone: string;
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

  registerVolunteer: async (input: {
    name: string;
    phone: string;
    password: string;
    rememberLogin: boolean;
  }) => {
    const session = await requestJson<LoginSession>("/auth/volunteer/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input)
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
    return await requestJson<StudentRecord>(`/students/${encodeURIComponent(registrationId)}/verification`, { method: "GET" }, accessToken);
  },

  recordAttendance: async (
    accessToken: string,
    registrationId: string,
    input: { action: "entry" | "exit"; method: "qr" | "barcode" | "manual" }
  ) => {
    return await requestJson<StudentRecord>(
      `/students/${encodeURIComponent(registrationId)}/attendance`,
      { method: "POST", headers: jsonHeaders, body: JSON.stringify(input) },
      accessToken
    );
  },

  getExportEvents: async (accessToken: string) =>
    await requestJson<ExportEvent[]>("/students/attendance/export-events", { method: "GET" }, accessToken),

  searchStudents: async (accessToken: string, query: string, field: StudentSearchField, page = 1, limit = 20): Promise<StudentSearchPage> => {
    const params = new URLSearchParams({ q: query, field, page: String(page), limit: String(limit) });
    const response = await fetch(`${apiBaseUrl}/students/search?${params}`, { headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` } });
    const payload = await parseEnvelope<StudentRecord[]>(response);
    const meta = payload.meta ?? { page, limit, total: payload.data?.length ?? 0, totalPages: 1 };
    return { items: payload.data ?? [], ...meta };
  },

  getStoredRefreshToken: async () => await secureStorage.get(refreshTokenKey),
  clearStoredRefreshToken: async () => await secureStorage.set(refreshTokenKey, null)
};
