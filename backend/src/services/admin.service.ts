import { Types, type FilterQuery } from "mongoose";
import { AuditLogModel } from "../models/audit-log.model.js";
import { AdminModel, type AdminRole } from "../models/admin.model.js";
import { CollegeModel } from "../models/college.model.js";
import { DepartmentModel } from "../models/department.model.js";
import { EventModel, type EventStatus } from "../models/event.model.js";
import { EventDeletionRequestModel } from "../models/event-deletion-request.model.js";
import { AttendanceModel } from "../models/attendance.model.js";
import { NotificationModel } from "../models/notification.model.js";
import {
  StudentModel,
  type AttendanceStatus,
  type Student,
  type VerificationStatus
} from "../models/student.model.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword, verifyPassword } from "./password.service.js";

export interface RegistrationFilters {
  search?: string;
  event?: string;
  college?: string;
  department?: string;
  verificationStatus?: VerificationStatus;
  attendanceStatus?: AttendanceStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const objectId = (value?: string): Types.ObjectId | undefined =>
  value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;

export const buildRegistrationFilter = (
  filters: RegistrationFilters
): FilterQuery<Student> => {
  const query: FilterQuery<Student> = {};
  const event = objectId(filters.event);
  const college = objectId(filters.college);
  const department = objectId(filters.department);
  if (event) query.event = event;
  if (college) query.college = college;
  if (department) query.department = department;
  if (filters.verificationStatus) query.verificationStatus = filters.verificationStatus;
  if (filters.attendanceStatus) query.attendanceStatus = filters.attendanceStatus;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {
      ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { $lte: filters.dateTo } : {})
    };
  }
  if (filters.search?.trim()) {
    const pattern = new RegExp(escapeRegex(filters.search.trim()), "i");
    query.$or = [
      { registrationId: pattern },
      { name: pattern },
      { rollNumber: pattern },
      { email: pattern },
      { phone: pattern }
    ];
  }
  return query;
};

export const getDashboardStatistics = async () => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalRegistrations,
    todaysVisitors,
    insideCampus,
    exited,
    pending,
    rejected,
    colleges,
    departments,
    dailyRaw,
    collegeRaw
  ] = await Promise.all([
    StudentModel.countDocuments(),
    StudentModel.countDocuments({ entryTime: { $gte: todayStart, $lte: now } }),
    StudentModel.countDocuments({ attendanceStatus: "checked_in" }),
    StudentModel.countDocuments({ attendanceStatus: "checked_out" }),
    StudentModel.countDocuments({ verificationStatus: "pending" }),
    StudentModel.countDocuments({ verificationStatus: "rejected" }),
    CollegeModel.countDocuments({ isActive: true }),
    DepartmentModel.countDocuments({ isActive: true }),
    StudentModel.aggregate<{ _id: string; registrations: number }>([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
          registrations: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    StudentModel.aggregate<{ name: string; registrations: number }>([
      { $group: { _id: "$college", registrations: { $sum: 1 } } },
      { $sort: { registrations: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "colleges",
          localField: "_id",
          foreignField: "_id",
          as: "college"
        }
      },
      { $unwind: "$college" },
      { $project: { _id: 0, name: "$college.name", registrations: 1 } }
    ])
  ]);

  const dailyMap = new Map(dailyRaw.map((item) => [item._id, item.registrations]));
  const registrationTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      label: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
      registrations: dailyMap.get(key) ?? 0
    };
  });

  return {
    totals: {
      todaysVisitors,
      totalRegistrations,
      insideCampus,
      exited,
      pending,
      rejected,
      colleges,
      departments
    },
    registrationTrend,
    collegeDistribution: collegeRaw
  };
};

export const listSubAdmins = async () =>
  AdminModel.find({ role: { $ne: "super_admin" } })
    .select("name email role isActive emailVerifiedAt lastLoginAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

export const createSubAdmin = async (input: {
  name: string;
  email: string;
  password: string;
  role: Exclude<AdminRole, "super_admin">;
  createdBy: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const passwordHash = await hashPassword(input.password);
  try {
    const admin = await AdminModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
      emailVerifiedAt: new Date()
    });
    await AuditLogModel.create({
      actor: input.createdBy,
      actorType: "Admin",
      action: "admin.created",
      entityType: "Admin",
      entityId: admin._id,
      outcome: "success",
      changes: { email: admin.email, role: admin.role },
      ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      ...(input.userAgent ? { userAgent: input.userAgent } : {})
    });
    return {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      emailVerifiedAt: admin.emailVerifiedAt,
      createdAt: admin.createdAt
    };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new AppError("An admin account already uses this email", 409, "DUPLICATE_ADMIN_EMAIL");
    }
    throw error;
  }
};

export const listRegistrations = async (
  filters: RegistrationFilters,
  page: number,
  limit: number
) => {
  const query = buildRegistrationFilter(filters);
  const [items, total] = await Promise.all([
    StudentModel.find(query)
      .select(
        "registrationId name rollNumber email phone year verificationStatus attendanceStatus createdAt selfie idFront idBack qrCode event college department highlight"
      )
      .populate("event", "name code startsAt venue")
      .populate("college", "name code")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StudentModel.countDocuments(query)
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const reviewRegistration = async (input: {
  studentId: string;
  status: "approved" | "rejected";
  notes?: string;
  adminId: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const student = await StudentModel.findByIdAndUpdate(
    input.studentId,
    {
      $set: {
        verificationStatus: input.status,
        verificationNotes: input.notes ?? "",
        verifiedBy: input.adminId,
        verifiedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  ).select("registrationId name verificationStatus event");
  if (!student) throw new AppError("Registration was not found", 404, "REGISTRATION_NOT_FOUND");

  await Promise.all([
    AuditLogModel.create({
      actor: input.adminId,
      actorType: "Admin",
      action: `registration.${input.status}`,
      entityType: "Student",
      entityId: student._id,
      event: student.event,
      outcome: "success",
      changes: { verificationStatus: input.status, notes: input.notes },
      ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      ...(input.userAgent ? { userAgent: input.userAgent } : {})
    }),
    NotificationModel.create({
      recipient: student._id,
      recipientModel: "Student",
      event: student.event,
      type: "verification",
      channels: ["in_app", "email"],
      title: `Registration ${input.status}`,
      message: `Your registration ${student.registrationId} has been ${input.status}.`
    })
  ]);
  return student;
};

export interface EventHighlightInput {
  title: string;
  description?: string;
  image?: { url: string; publicId: string };
}

export interface CreateEventInput {
  name: string;
  code: string;
  description?: string;
  banner?: { url: string; publicId: string };
  highlights: EventHighlightInput[];
  teamSize: number;
  college: string;
  departments: string[];
  venue: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  startsAt: Date;
  endsAt: Date;
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  capacity: number;
  status: EventStatus;
}

export const createEvent = async (
  input: CreateEventInput,
  adminId: string,
  context: { ipAddress?: string; userAgent?: string }
) => {
  const [college, departmentCount] = await Promise.all([
    CollegeModel.findOne({ _id: input.college, isActive: true }).select("_id").lean(),
    DepartmentModel.countDocuments({
      _id: { $in: input.departments },
      college: input.college,
      isActive: true
    })
  ]);
  if (!college) throw new AppError("College is invalid or inactive", 422, "INVALID_COLLEGE");
  if (departmentCount !== input.departments.length) {
    throw new AppError("One or more departments are invalid", 422, "INVALID_DEPARTMENTS");
  }

  try {
    const event = await EventModel.create({
      ...input,
      description: input.description ?? input.highlights[0]?.description ?? input.highlights[0]?.title ?? input.name,
      createdBy: adminId
    });
    await AuditLogModel.create({
      actor: adminId,
      actorType: "Admin",
      action: "event.created",
      entityType: "Event",
      entityId: event._id,
      event: event._id,
      outcome: "success",
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {})
    });
    return event;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new AppError("Event code already exists", 409, "DUPLICATE_EVENT_CODE");
    }
    throw error;
  }
};

export const listAdminEvents = async () =>
  EventModel.find()
    .select(
      "name code description banner highlights teamSize college departments venue startsAt endsAt registrationOpensAt registrationClosesAt capacity registrationCount status createdAt"
    )
    .populate("college", "name code")
    .populate("departments", "name code")
    .sort({ startsAt: -1 })
    .lean();

export const updateEvent = async (
  eventId: string,
  input: CreateEventInput,
  adminId: string,
  context: { ipAddress?: string; userAgent?: string }
) => {
  const [college, departmentCount] = await Promise.all([
    CollegeModel.findOne({ _id: input.college, isActive: true }).select("_id").lean(),
    DepartmentModel.countDocuments({ _id: { $in: input.departments }, college: input.college, isActive: true })
  ]);
  if (!college) throw new AppError("College is invalid or inactive", 422, "INVALID_COLLEGE");
  if (departmentCount !== input.departments.length) {
    throw new AppError("One or more departments are invalid", 422, "INVALID_DEPARTMENTS");
  }

  const event = await EventModel.findById(eventId);
  if (!event) throw new AppError("Event was not found", 404, "EVENT_NOT_FOUND");
  Object.assign(event, {
    ...input,
    description: input.description ?? input.highlights[0]?.description ?? input.highlights[0]?.title ?? input.name,
    createdBy: event.createdBy
  });
  try {
    await event.save();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new AppError("Event code already exists", 409, "DUPLICATE_EVENT_CODE");
    }
    throw error;
  }
  await AuditLogModel.create({ actor: adminId, actorType: "Admin", action: "event.updated", entityType: "Event", entityId: event._id, event: event._id, outcome: "success", ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}), ...(context.userAgent ? { userAgent: context.userAgent } : {}) });
  return event;
};

export const deleteEvent = async (eventId: string, adminId: string, password: string | undefined, context: { ipAddress?: string; userAgent?: string }) => {
  const event = await EventModel.findById(eventId).select("_id registrationCount");
  if (!event) throw new AppError("Event was not found", 404, "EVENT_NOT_FOUND");
  if (event.registrationCount > 0) {
    if (!password) throw new AppError("Admin password is required to request deletion", 428, "ADMIN_PASSWORD_REQUIRED");
    const admin = await AdminModel.findById(adminId).select("+passwordHash").lean();
    if (!admin?.passwordHash || !(await verifyPassword(password, admin.passwordHash))) {
      throw new AppError("Admin password is incorrect", 401, "INVALID_ADMIN_PASSWORD");
    }
    const pending = await EventDeletionRequestModel.findOne({ event: eventId, status: "pending" }).lean();
    if (pending) throw new AppError("Deletion approval is already pending", 409, "DELETION_APPROVAL_PENDING");
    const request = await EventDeletionRequestModel.create({ event: eventId, requestedBy: adminId });
    await AuditLogModel.create({ actor: adminId, actorType: "Admin", action: "event.deletion_requested", entityType: "Event", entityId: event._id, event: event._id, outcome: "success", ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}), ...(context.userAgent ? { userAgent: context.userAgent } : {}) });
    return { deleted: false, approvalRequired: true, requestId: request._id.toString() };
  }
  await EventModel.deleteOne({ _id: eventId });
  await EventDeletionRequestModel.deleteMany({ event: eventId });
  await AuditLogModel.create({ actor: adminId, actorType: "Admin", action: "event.deleted", entityType: "Event", entityId: event._id, event: event._id, outcome: "success", ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}), ...(context.userAgent ? { userAgent: context.userAgent } : {}) });
  return { deleted: true, approvalRequired: false };
};

export const listEventDeletionRequests = async () => EventDeletionRequestModel.find({ status: "pending" })
  .populate("event", "name code registrationCount")
  .populate("requestedBy", "name email")
  .sort({ createdAt: 1 })
  .lean();

export const reviewEventDeletionRequest = async (requestId: string, reviewerId: string, approved: boolean, context: { ipAddress?: string; userAgent?: string }) => {
  const request = await EventDeletionRequestModel.findOne({ _id: requestId, status: "pending" });
  if (!request) throw new AppError("Deletion request was not found or already reviewed", 404, "DELETION_REQUEST_NOT_FOUND");
  request.status = approved ? "approved" : "rejected";
  request.reviewedBy = new Types.ObjectId(reviewerId);
  request.reviewedAt = new Date();
  await request.save();
  if (approved) {
    await Promise.all([
      StudentModel.deleteMany({ event: request.event }),
      AttendanceModel.deleteMany({ event: request.event }),
      NotificationModel.deleteMany({ event: request.event }),
      EventModel.deleteOne({ _id: request.event })
    ]);
  }
  await AuditLogModel.create({ actor: reviewerId, actorType: "Admin", action: approved ? "event.deletion_approved" : "event.deletion_rejected", entityType: "Event", entityId: request.event, event: request.event, outcome: "success", changes: { requestId: request._id.toString() }, ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}), ...(context.userAgent ? { userAgent: context.userAgent } : {}) });
  return { approved, deleted: approved, requestId: request._id.toString() };
};

export interface BulkCollegeInput {
  name: string;
  code: string;
  city: string;
  departments: Array<{ name: string; code: string }>;
}

export const upsertColleges = async (inputs: BulkCollegeInput[]) => {
  const results = [];
  for (const input of inputs) {
    const college = await CollegeModel.findOneAndUpdate(
      { code: input.code },
      {
        $set: {
          name: input.name,
          code: input.code,
          address: {
            line1: `${input.city} district`,
            city: input.city,
            state: "Tamil Nadu",
            postalCode: "Not provided",
            country: "India"
          },
          isActive: true
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    if (!college) throw new AppError(`Unable to save ${input.name}`, 500, "COLLEGE_SAVE_FAILED");
    await Promise.all(input.departments.map((department) =>
      DepartmentModel.findOneAndUpdate(
        { college: college._id, code: department.code },
        { $set: { ...department, isActive: true } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    ));
    results.push({ _id: college._id, name: college.name, code: college.code, city: input.city, departmentCount: input.departments.length });
  }
  return results;
};

export const getRegistrationExportData = async (filters: RegistrationFilters) =>
  StudentModel.find(buildRegistrationFilter(filters))
    .select(
      "registrationId name rollNumber email phone year verificationStatus attendanceStatus entryTime exitTime createdAt event college department highlight"
    )
    .populate("event", "name code")
    .populate("college", "name code")
    .populate("department", "name code")
    .sort({ createdAt: -1 })
    .limit(50_000)
    .lean();
