import { api } from "./client";
import type { AdminEvent, ApiResponse, DashboardData, RefItem, Registration, SubAdmin } from "../types/api";

export const getDashboard = async () => (await api.get<ApiResponse<DashboardData>>("/admin/dashboard")).data.data;
export const getRegistrations = async (params: Record<string, string | number>) => (await api.get<ApiResponse<Registration[]>>("/admin/registrations", { params })).data;
export const reviewRegistration = async (id: string, status: "approved"|"rejected", notes?: string) => api.patch(`/admin/registrations/${id}/verification`, { status, notes });
export const getAdminEvents = async () => (await api.get<ApiResponse<AdminEvent[]>>("/admin/events")).data.data;
export const createEvent = async (payload: unknown) => api.post("/admin/events", payload);
export const getSubAdmins = async () => (await api.get<ApiResponse<SubAdmin[]>>("/admin/accounts")).data.data;
export const createSubAdmin = async (payload: {name:string;email:string;password:string;role:"admin"|"event_manager"}) =>
  (await api.post<ApiResponse<SubAdmin>>("/admin/accounts", payload)).data.data;
export const getColleges = async () => (await api.get<ApiResponse<RefItem[]>>("/colleges")).data.data;
export const getDepartments = async (college: string) => (await api.get<ApiResponse<RefItem[]>>("/departments", { params: { college } })).data.data;
export const saveColleges = async (colleges: Array<{name:string;code:string;city:string;departments:Array<{name:string;code:string}>}>) =>
  (await api.post<ApiResponse<Array<RefItem&{city:string;departmentCount:number}>>>("/admin/colleges/bulk", { colleges })).data.data;
export const downloadExport = async (format: "xlsx"|"pdf", params: Record<string,string|number>) => {
  const response = await api.get<Blob>(`/admin/exports/registrations.${format}`, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a"); link.href = url; link.download = `eventpass-registrations.${format}`; link.click();
  URL.revokeObjectURL(url);
};
