import type { RequestHandler } from "express";
import {
  registerStudent,
  trackStudentRegistration,
  getStudentVerificationRecord,
  getStudentPassData,
  searchStudents,
  type StudentSearchField,
  type RegistrationFiles,
  type RegistrationInput
} from "../services/registration.service.js";
import { getVolunteerAttendanceExportRows, listVolunteerExportEvents, recordStudentAttendance } from "../services/attendance.service.js";
import { createExcelExport, createStudentPassPdf } from "../services/export.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

interface RegistrationBody {
  event: string;
  name: string;
  rollNumber: string;
  college: string;
  department: string;
  year: number;
  phone: string;
  email: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  "emergencyContact[name]"?: string;
  "emergencyContact[relationship]"?: string;
  "emergencyContact[phone]"?: string;
}

const registrationFiles = (request: Parameters<RequestHandler>[0]): RegistrationFiles => {
  const files = request.files;
  if (!files || Array.isArray(files)) {
    throw new AppError("Registration images are required", 422, "FILES_REQUIRED");
  }
  const selfie = files.selfie?.[0];
  const idFront = files.idFront?.[0];
  const idBack = files.idBack?.[0];
  if (!selfie || !idFront || !idBack) {
    throw new AppError("Registration images are required", 422, "FILES_REQUIRED");
  }
  return { selfie, idFront, idBack };
};

export const registerStudentController = asyncHandler(async (request, response) => {
  const body = request.body as RegistrationBody;
  const input: RegistrationInput = {
    event: body.event,
    name: body.name,
    rollNumber: body.rollNumber,
    college: body.college,
    department: body.department,
    year: body.year,
    phone: body.phone,
    email: body.email,
    emergencyContact: {
      name: body.emergencyContact?.name ?? body["emergencyContact[name]"] ?? "",
      relationship:
        body.emergencyContact?.relationship ??
        body["emergencyContact[relationship]"] ??
        "",
      phone: body.emergencyContact?.phone ?? body["emergencyContact[phone]"] ?? ""
    }
  };
  const registration = await registerStudent(input, registrationFiles(request));
  sendSuccess(response, {
    statusCode: 201,
    message: "Registration completed successfully",
    data: registration
  });
});

export const trackStudentController = asyncHandler(async (request, response) => {
  const value = request.params.registrationId;
  const registration = await trackStudentRegistration(
    typeof value === "string" ? value : ""
  );
  sendSuccess(response, {
    message: "Registration status retrieved",
    data: registration
  });
});

export const studentPassController = asyncHandler(async (request, response) => {
  const value = request.params.registrationId;
  const registrationId = typeof value === "string" ? value : "";
  const pass = await getStudentPassData(registrationId);
  const file = await createStudentPassPdf(pass);
  response.status(200).set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${pass.registrationId.toLowerCase()}-event-pass.pdf"`,
    "Content-Length": file.length.toString()
  }).end(file);
});

export const getStudentVerificationController = asyncHandler(async (request, response) => {
  const value = request.params.registrationId;
  const registration = await getStudentVerificationRecord(typeof value === "string" ? value : "");
  sendSuccess(response, {
    message: "Student verification record retrieved",
    data: registration
  });
});

export const searchStudentsController = asyncHandler(async (request, response) => {
  const result = await searchStudents({
    query: typeof request.query.q === "string" ? request.query.q : "",
    field: (typeof request.query.field === "string" ? request.query.field : "all") as StudentSearchField,
    page: typeof request.query.page === "number" ? request.query.page : 1,
    limit: typeof request.query.limit === "number" ? request.query.limit : 20
  });
  sendSuccess(response, {
    message: "Students retrieved",
    data: result.items,
    meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
  });
});

export const recordStudentAttendanceController = asyncHandler(async (request, response) => {
  if (!request.auth) {
    throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  }
  const value = request.params.registrationId;
  const body = request.body as {
    action: "entry" | "exit";
    method: "qr" | "barcode" | "manual";
  };
  const student = await recordStudentAttendance({
    registrationId: typeof value === "string" ? value : "",
    action: body.action,
    method: body.method,
    volunteerId: request.auth.userId
  });
  sendSuccess(response, {
    message: body.action === "entry" ? "Entry recorded" : "Exit recorded",
    data: student
  });
});

export const volunteerExportEventsController = asyncHandler(async (request, response) => {
  const identity = request.auth;
  if (!identity) throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  const events = await listVolunteerExportEvents(identity.userId);
  sendSuccess(response, { message: "Attendance export events retrieved", data: events });
});

export const volunteerAttendanceExportController = asyncHandler(async (request, response) => {
  const identity = request.auth;
  if (!identity) throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  const value = request.params.eventId;
  const { event, students } = await getVolunteerAttendanceExportRows(identity.userId, typeof value === "string" ? value : "");
  const file = await createExcelExport(students);
  response.status(200).set({
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${event.code.toLowerCase()}-attendance.xlsx"`,
    "Content-Length": file.length.toString()
  }).end(file);
});
