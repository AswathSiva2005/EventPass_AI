export type AuthUserModel = "Volunteer";

export interface VolunteerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  userModel: AuthUserModel;
  emailVerified: boolean;
}

export interface LoginSession {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: VolunteerAccount;
}

export interface StudentRecord {
  registrationId: string;
  studentName: string;
  rollNumber: string;
  year: number;
  phone: string;
  email: string;
  collegeName: string;
  departmentName: string;
  eventName: string;
  eventStartsAt: string;
  verificationStatus: "pending" | "approved" | "rejected";
  attendanceStatus: "registered" | "checked_in" | "checked_out" | "absent";
  venue: string;
  selfie: { url: string };
  idFront: { url: string };
  idBack: { url: string };
  entryTime?: string;
  exitTime?: string;
  updatedAt: string;
}

export interface AttendanceEvent {
  id: string;
  registrationId: string;
  studentName: string;
  eventName: string;
  action: "entry" | "exit";
  method: "qr" | "barcode" | "manual";
  createdAt: string;
  synced: boolean;
}

export interface ExportEvent {
  _id: string;
  name: string;
  code: string;
  startsAt: string;
  endsAt: string;
  status: string;
  venue: { name: string; address: string };
}

export type StudentSearchField = "all" | "registrationId" | "rollNumber" | "phone" | "college" | "name" | "code";

export interface StudentSearchPage {
  items: StudentRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CacheSnapshot {
  students: StudentRecord[];
  attendanceEvents: AttendanceEvent[];
}
