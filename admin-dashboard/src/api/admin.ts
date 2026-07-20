import { api } from "./client";
import type { AdminEvent, ApiResponse, DashboardData, RefItem, Registration } from "../types/api";

export const getDashboard = async () => (await api.get<ApiResponse<DashboardData>>("/admin/dashboard")).data.data;
export const getRegistrations = async (params: Record<string, string | number>) => (await api.get<ApiResponse<Registration[]>>("/admin/registrations", { params })).data;
export const reviewRegistration = async (id: string, status: "approved"|"rejected", notes?: string) => api.patch(`/admin/registrations/${id}/verification`, { status, notes });
export const getAdminEvents = async () => (await api.get<ApiResponse<AdminEvent[]>>("/admin/events")).data.data;
export const createEvent = async (payload: unknown) => api.post("/admin/events", payload);
export const getColleges = async () => (await api.get<ApiResponse<RefItem[]>>("/colleges")).data.data;
export const getDepartments = async (college: string) => (await api.get<ApiResponse<RefItem[]>>("/departments", { params: { college } })).data.data;
export const downloadExport = async (format: "xlsx"|"pdf", params: Record<string,string|number>) => {
  const response = await api.get<Blob>(`/admin/exports/registrations.${format}`, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a"); link.href = url; link.download = `eventpass-registrations.${format}`; link.click();
  URL.revokeObjectURL(url);
};
