import { startSession, Types } from "mongoose";
import { AttendanceModel, type AttendanceMethod } from "../models/attendance.model.js";
import { StudentModel } from "../models/student.model.js";
import { AppError } from "../utils/app-error.js";
import { EventModel } from "../models/event.model.js";

export const recordStudentAttendance = async (input: {
  registrationId: string;
  action: "entry" | "exit";
  method: AttendanceMethod;
  volunteerId: string;
}) => {
  const session = await startSession();
  try {
    await session.withTransaction(async () => {
      const student = await StudentModel.findOne({
        registrationId: input.registrationId.toUpperCase()
      }).session(session);

      if (!student) {
        throw new AppError("Registration was not found", 404, "REGISTRATION_NOT_FOUND");
      }
      if (student.verificationStatus !== "approved") {
        throw new AppError(
          "Attendance is available only after registration approval",
          409,
          "REGISTRATION_NOT_APPROVED"
        );
      }

      const now = new Date();
      if (input.action === "entry") {
        if (student.attendanceStatus !== "registered") {
          throw new AppError(
            student.attendanceStatus === "checked_in"
              ? "Entry has already been recorded for this student"
              : "This student has already completed attendance",
            409,
            "ENTRY_ALREADY_RECORDED"
          );
        }

        await AttendanceModel.create(
          [{
            student: student._id,
            event: student.event,
            checkInAt: now,
            checkInMethod: input.method,
            checkedInBy: input.volunteerId,
            status: "checked_in",
            venue: student.venue
          }],
          { session }
        );
        student.attendanceStatus = "checked_in";
        student.entryTime = now;
        student.volunteerAssigned = new Types.ObjectId(input.volunteerId);
        await student.save({ session });
        return;
      }

      if (student.attendanceStatus !== "checked_in") {
        throw new AppError(
          student.attendanceStatus === "registered"
            ? "Entry must be recorded before exit"
            : "Exit has already been recorded for this student",
          409,
          student.attendanceStatus === "registered" ? "ENTRY_REQUIRED" : "EXIT_ALREADY_RECORDED"
        );
      }

      const attendance = await AttendanceModel.findOne({
        student: student._id,
        event: student.event,
        status: "checked_in"
      }).session(session);
      if (!attendance) {
        throw new AppError("The entry attendance record is missing", 409, "ENTRY_RECORD_MISSING");
      }

      attendance.status = "checked_out";
      attendance.checkOutAt = now;
      attendance.checkOutMethod = input.method;
      attendance.checkedOutBy = new Types.ObjectId(input.volunteerId);
      await attendance.save({ session });

      student.attendanceStatus = "checked_out";
      student.exitTime = now;
      await student.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const student = await StudentModel.findOne({
    registrationId: input.registrationId.toUpperCase()
  })
    .populate<{ event: { name: string; startsAt: Date } }>("event", "name startsAt")
    .populate<{ college: { name: string } }>("college", "name")
    .populate<{ department: { name: string } }>("department", "name")
    .select("registrationId name rollNumber year phone email verificationStatus attendanceStatus venue entryTime exitTime updatedAt event college department selfie idFront idBack")
    .lean();
  if (!student) throw new AppError("Registration was not found", 404, "REGISTRATION_NOT_FOUND");

  return {
    registrationId: student.registrationId,
    studentName: student.name,
    rollNumber: student.rollNumber,
    year: student.year,
    phone: student.phone,
    email: student.email,
    collegeName: student.college.name,
    departmentName: student.department.name,
    eventName: student.event.name,
    eventStartsAt: student.event.startsAt,
    verificationStatus: student.verificationStatus,
    attendanceStatus: student.attendanceStatus,
    selfie: { url: student.selfie.url },
    idFront: { url: student.idFront.url },
    idBack: { url: student.idBack.url },
    venue: student.venue,
    entryTime: student.entryTime,
    exitTime: student.exitTime,
    updatedAt: student.updatedAt
  };
};

export const listVolunteerExportEvents = async (volunteerId: string) => {
  const eventIds = await AttendanceModel.distinct("event", {
    $or: [{ checkedInBy: volunteerId }, { checkedOutBy: volunteerId }]
  });
  return EventModel.find({ _id: { $in: eventIds } })
    .select("name code startsAt endsAt venue status")
    .sort({ endsAt: -1 })
    .lean();
};

export const getVolunteerAttendanceExportRows = async (volunteerId: string, eventId: string) => {
  const event = await EventModel.findById(eventId).select("name code endsAt").lean();
  if (!event) throw new AppError("Event was not found", 404, "EVENT_NOT_FOUND");
  const records = await AttendanceModel.find({
    event: eventId,
    $or: [{ checkedInBy: volunteerId }, { checkedOutBy: volunteerId }]
  }).select("student").lean();
  if (records.length === 0) {
    throw new AppError("No attendance records are available for this event", 404, "ATTENDANCE_NOT_FOUND");
  }

  const students = await StudentModel.find({ _id: { $in: records.map((record) => record.student) } })
    .select("registrationId name rollNumber email phone year verificationStatus attendanceStatus entryTime exitTime createdAt event college department")
    .populate("event", "name code")
    .populate("college", "name code")
    .populate("department", "name code")
    .sort({ entryTime: 1 })
    .lean();
  return { event, students };
};
