import { api } from "./client";
import type {
  ApiResponse,
  College,
  Department,
  Event,
  RegistrationResult,
  RegistrationStatus
} from "../types/api";

export const getUpcomingEvents = async (): Promise<Event[]> => {
  const { data } = await api.get<ApiResponse<Event[]>>("/events", {
    params: { status: "published", upcoming: true }
  });
  return data.data;
};

export const getColleges = async (): Promise<College[]> => {
  const { data } = await api.get<ApiResponse<College[]>>("/colleges", {
    params: { active: true }
  });
  return data.data;
};

export const getDepartments = async (collegeId: string): Promise<Department[]> => {
  const { data } = await api.get<ApiResponse<Department[]>>("/departments", {
    params: { college: collegeId, active: true }
  });
  return data.data;
};

export const createRegistration = async (payload: FormData): Promise<RegistrationResult> => {
  const { data } = await api.post<ApiResponse<RegistrationResult>>(
    "/students/register",
    payload
  );
  return data.data;
};

export const trackRegistration = async (
  registrationId: string
): Promise<RegistrationStatus> => {
  const { data } = await api.get<ApiResponse<RegistrationStatus>>(
    `/students/track/${encodeURIComponent(registrationId)}`
  );
  return data.data;
};

export const sendContactMessage = async (payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> => {
  await api.post("/contact", payload);
};
