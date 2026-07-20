export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
export interface AdminUser { id: string; name: string; email: string; role: string; userModel: "Admin"; }
export interface DashboardData {
  totals: {
    todaysVisitors: number; totalRegistrations: number; insideCampus: number; exited: number;
    pending: number; rejected: number; colleges: number; departments: number;
  };
  registrationTrend: Array<{ date: string; label: string; registrations: number }>;
  collegeDistribution: Array<{ name: string; registrations: number }>;
}
export interface RefItem { _id: string; name: string; code: string; college?: string; }
export interface Registration {
  _id: string; registrationId: string; name: string; rollNumber: string; email: string; phone: string;
  year: number; verificationStatus: "pending"|"approved"|"rejected";
  attendanceStatus: "registered"|"checked_in"|"checked_out"|"absent"; createdAt: string;
  selfie: { url: string }; idFront: { url: string }; idBack: { url: string };
  event: RefItem | null; college: RefItem | null; department: RefItem | null;
}
export interface AdminEvent {
  _id: string; name: string; code: string; status: string; startsAt: string; endsAt: string;
  capacity: number; registrationCount: number; college: RefItem | null;
  venue: { name: string; address: string };
}
