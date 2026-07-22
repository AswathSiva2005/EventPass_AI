import type { Request } from "express";
import {
  createEvent,
  createSubAdmin,
  getDashboardStatistics,
  getRegistrationExportData,
  listAdminEvents,
  listSubAdmins,
  listRegistrations,
  reviewRegistration,
  upsertColleges,
  type BulkCollegeInput,
  type CreateEventInput,
  type RegistrationFilters
} from "../services/admin.service.js";
import { createExcelExport, createPdfExport } from "../services/export.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

const auth = (request: Request) => {
  if (!request.auth) {
    throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  }
  return request.auth;
};

const filters = (request: Request): RegistrationFilters => {
  const result: RegistrationFilters = {};
  if (typeof request.query.search === "string") result.search = request.query.search;
  if (typeof request.query.event === "string") result.event = request.query.event;
  if (typeof request.query.college === "string") result.college = request.query.college;
  if (typeof request.query.department === "string") {
    result.department = request.query.department;
  }
  if (
    request.query.verificationStatus === "pending" ||
    request.query.verificationStatus === "approved" ||
    request.query.verificationStatus === "rejected"
  ) {
    result.verificationStatus = request.query.verificationStatus;
  }
  if (
    request.query.attendanceStatus === "registered" ||
    request.query.attendanceStatus === "checked_in" ||
    request.query.attendanceStatus === "checked_out" ||
    request.query.attendanceStatus === "absent"
  ) {
    result.attendanceStatus = request.query.attendanceStatus;
  }
  if (request.query.dateFrom instanceof Date) result.dateFrom = request.query.dateFrom;
  if (request.query.dateTo instanceof Date) result.dateTo = request.query.dateTo;
  return result;
};

const context = (request: Request) => {
  const userAgent = request.get("user-agent");
  return {
    ...(request.ip ? { ipAddress: request.ip } : {}),
    ...(userAgent ? { userAgent } : {})
  };
};

export const dashboardController = asyncHandler(async (_request, response) => {
  const statistics = await getDashboardStatistics();
  sendSuccess(response, { message: "Dashboard statistics retrieved", data: statistics });
});

export const subAdminsController = asyncHandler(async (_request, response) => {
  const admins = await listSubAdmins();
  sendSuccess(response, { message: "Sub-admin accounts retrieved", data: admins });
});

export const createSubAdminController = asyncHandler(async (request, response) => {
  const identity = auth(request);
  const body = request.body as { name: string; email: string; password: string; role: "admin" | "event_manager" };
  const admin = await createSubAdmin({ ...body, createdBy: identity.userId, ...context(request) });
  sendSuccess(response, { statusCode: 201, message: "Sub-admin account created", data: admin });
});

export const registrationsController = asyncHandler(async (request, response) => {
  const page = typeof request.query.page === "number" ? request.query.page : 1;
  const limit = typeof request.query.limit === "number" ? request.query.limit : 20;
  const result = await listRegistrations(filters(request), page, limit);
  sendSuccess(response, {
    message: "Registrations retrieved",
    data: result.items,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

export const reviewController = asyncHandler(async (request, response) => {
  const identity = auth(request);
  const body = request.body as { status: "approved" | "rejected"; notes?: string };
  const studentId = request.params.studentId;
  const registration = await reviewRegistration({
    studentId: typeof studentId === "string" ? studentId : "",
    status: body.status,
    ...(body.notes ? { notes: body.notes } : {}),
    adminId: identity.userId,
    ...context(request)
  });
  sendSuccess(response, { message: `Registration ${body.status}`, data: registration });
});

export const createEventController = asyncHandler(async (request, response) => {
  const identity = auth(request);
  const event = await createEvent(
    request.body as CreateEventInput,
    identity.userId,
    context(request)
  );
  sendSuccess(response, { statusCode: 201, message: "Event created", data: event });
});

export const eventsController = asyncHandler(async (_request, response) => {
  const events = await listAdminEvents();
  sendSuccess(response, { message: "Events retrieved", data: events });
});

export const bulkCollegesController = asyncHandler(async (request, response) => {
  const colleges = await upsertColleges((request.body as { colleges: BulkCollegeInput[] }).colleges);
  sendSuccess(response, { statusCode: 201, message: `${colleges.length} colleges saved`, data: colleges });
});

export const excelExportController = asyncHandler(async (request, response) => {
  const rows = await getRegistrationExportData(filters(request));
  const file = await createExcelExport(rows);
  const date = new Date().toISOString().slice(0, 10);
  response
    .status(200)
    .set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="eventpass-registrations-${date}.xlsx"`,
      "Content-Length": file.length.toString()
    })
    .end(file);
});

export const pdfExportController = asyncHandler(async (request, response) => {
  const rows = await getRegistrationExportData(filters(request));
  const file = await createPdfExport(rows);
  const date = new Date().toISOString().slice(0, 10);
  response
    .status(200)
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="eventpass-registrations-${date}.pdf"`,
      "Content-Length": file.length.toString()
    })
    .end(file);
});
