export type AuthUserModel = "Volunteer";

export interface VolunteerAccount {
  id: string;
  name: string;
  email: string;
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
  eventName: string;
  eventStartsAt: string;
  verificationStatus: "pending" | "approved" | "rejected";
  attendanceStatus: "registered" | "checked_in" | "checked_out" | "absent";
  venue: string;
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

export interface CacheSnapshot {
  students: StudentRecord[];
  attendanceEvents: AttendanceEvent[];
}
