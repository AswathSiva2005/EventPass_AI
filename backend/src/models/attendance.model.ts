import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export const attendanceMethods = ["qr", "barcode", "manual"] as const;
export type AttendanceMethod = (typeof attendanceMethods)[number];
export const attendanceRecordStatuses = ["checked_in", "checked_out"] as const;
export type AttendanceRecordStatus = (typeof attendanceRecordStatuses)[number];

export interface Attendance {
  student: Types.ObjectId;
  event: Types.ObjectId;
  checkInAt: Date;
  checkOutAt?: Date;
  checkInMethod: AttendanceMethod;
  checkOutMethod?: AttendanceMethod;
  checkedInBy: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  status: AttendanceRecordStatus;
  venue: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<Attendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, immutable: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, immutable: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: Date,
    checkInMethod: { type: String, enum: attendanceMethods, required: true },
    checkOutMethod: { type: String, enum: attendanceMethods },
    checkedInBy: { type: Schema.Types.ObjectId, ref: "Volunteer", required: true },
    checkedOutBy: { type: Schema.Types.ObjectId, ref: "Volunteer" },
    status: { type: String, enum: attendanceRecordStatuses, default: "checked_in", required: true },
    venue: { type: String, required: true, trim: true, maxlength: 250 },
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true, collection: "attendance", optimisticConcurrency: true }
);

attendanceSchema.pre("validate", function validateCheckout() {
  if (this.checkOutAt && this.checkOutAt < this.checkInAt) {
    this.invalidate("checkOutAt", "Check-out cannot precede check-in");
  }
  if (this.status === "checked_out" && (!this.checkOutAt || !this.checkedOutBy)) {
    this.invalidate("status", "Checked-out attendance requires a time and volunteer");
  }
});

attendanceSchema.index({ event: 1, student: 1 }, { unique: true });
attendanceSchema.index({ event: 1, status: 1, checkInAt: -1 });
attendanceSchema.index({ checkedInBy: 1, checkInAt: -1 });

export type AttendanceDocument = HydratedDocument<Attendance>;
export const AttendanceModel: Model<Attendance> =
  (models.Attendance as Model<Attendance> | undefined) ??
  model<Attendance>("Attendance", attendanceSchema);
