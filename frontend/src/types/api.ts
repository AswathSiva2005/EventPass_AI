export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface College {
  _id: string;
  name: string;
  code: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  college: string;
}

export interface Event {
  _id: string;
  name: string;
  code: string;
  description: string;
  college: College | string | null;
  departments: Department[];
  venue: {
    name: string;
    address: string;
  };
  startsAt: string;
  endsAt: string;
  registrationClosesAt: string;
  capacity: number;
  status: "published" | "ongoing" | "completed" | "cancelled";
}

export interface RegistrationResult {
  registrationId: string;
  eventName: string;
  studentName: string;
  verificationStatus: "pending" | "approved" | "rejected";
  qrCode?: {
    imageUrl: string;
  };
}

export interface RegistrationStatus extends RegistrationResult {
  attendanceStatus: "registered" | "checked_in" | "checked_out" | "absent";
  venue: string;
  eventStartsAt: string;
  updatedAt: string;
}
