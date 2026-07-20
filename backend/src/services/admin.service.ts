import { Types, type FilterQuery } from "mongoose";
import { AuditLogModel } from "../models/audit-log.model.js";
import { CollegeModel } from "../models/college.model.js";
import { DepartmentModel } from "../models/department.model.js";
import { EventModel, type EventStatus } from "../models/event.model.js";
import { NotificationModel } from "../models/notification.model.js";
import {
  StudentModel,
  type AttendanceStatus,
  type Student,
  type VerificationStatus
} from "../models/student.model.js";
import { AppError } from "../utils/app-error.js";

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

export const listRegistrations = async (
  filters: RegistrationFilters,
  page: number,
  limit: number
) => {
  const query = buildRegistrationFilter(filters);
  const [items, total] = await Promise.all([
    StudentModel.find(query)
      .select(
        "registrationId name rollNumber email phone year verificationStatus attendanceStatus createdAt selfie idFront idBack qrCode event college department"
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

export interface CreateEventInput {
  name: string;
  code: string;
  description: string;
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
    const event = await EventModel.create({ ...input, createdBy: adminId });
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
      "name code college departments venue startsAt endsAt registrationOpensAt registrationClosesAt capacity registrationCount status createdAt"
    )
    .populate("college", "name code")
    .populate("departments", "name code")
    .sort({ startsAt: -1 })
    .lean();

export const getRegistrationExportData = async (filters: RegistrationFilters) =>
  StudentModel.find(buildRegistrationFilter(filters))
    .select(
      "registrationId name rollNumber email phone year verificationStatus attendanceStatus entryTime exitTime createdAt event college department"
    )
    .populate("event", "name code")
    .populate("college", "name code")
    .populate("department", "name code")
    .sort({ createdAt: -1 })
    .limit(50_000)
    .lean();
