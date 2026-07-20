import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import {
  emailPattern,
  generatedCodeSchema,
  type GeneratedCode,
  mediaAssetSchema,
  type MediaAsset,
  normalizedString,
  phonePattern
} from "./shared.js";

export const attendanceStatuses = ["registered", "checked_in", "checked_out", "absent"] as const;
export type AttendanceStatus = (typeof attendanceStatuses)[number];
export const verificationStatuses = ["pending", "approved", "rejected"] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Student {
  registrationId: string;
  event: Types.ObjectId;
  name: string;
  rollNumber: string;
  college: Types.ObjectId;
  department: Types.ObjectId;
  year: number;
  phone: string;
  email: string;
  emergencyContact: EmergencyContact;
  selfie: MediaAsset;
  idFront: MediaAsset;
  idBack: MediaAsset;
  qrCode: GeneratedCode;
  barcode: GeneratedCode;
  entryTime?: Date;
  exitTime?: Date;
  attendanceStatus: AttendanceStatus;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  venue: string;
  volunteerAssigned?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyContactSchema = new Schema<EmergencyContact>(
  {
    name: normalizedString(120),
    relationship: normalizedString(50),
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [phonePattern, "Emergency contact phone must be in international format"]
    }
  },
  { _id: false }
);

const studentSchema = new Schema<Student>(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 64
    },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, immutable: true },
    name: normalizedString(120),
    rollNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    college: { type: Schema.Types.ObjectId, ref: "College", required: true, immutable: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, immutable: true },
    year: { type: Number, required: true, min: 1, max: 8, validate: Number.isInteger },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [phonePattern, "Phone must be in international format"]
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [emailPattern, "Email address is invalid"]
    },
    emergencyContact: { type: emergencyContactSchema, required: true },
    selfie: { type: mediaAssetSchema, required: true },
    idFront: { type: mediaAssetSchema, required: true },
    idBack: { type: mediaAssetSchema, required: true },
    qrCode: { type: generatedCodeSchema, required: true },
    barcode: { type: generatedCodeSchema, required: true },
    entryTime: Date,
    exitTime: Date,
    attendanceStatus: {
      type: String,
      enum: attendanceStatuses,
      default: "registered",
      required: true
    },
    verificationStatus: {
      type: String,
      enum: verificationStatuses,
      default: "pending",
      required: true
    },
    verificationNotes: { type: String, trim: true, maxlength: 1000 },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    verifiedAt: Date,
    venue: normalizedString(250),
    volunteerAssigned: { type: Schema.Types.ObjectId, ref: "Volunteer" }
  },
  { timestamps: true, collection: "students", optimisticConcurrency: true }
);

studentSchema.pre("validate", function validateAttendanceTimes() {
  if (this.exitTime && !this.entryTime) {
    this.invalidate("exitTime", "Exit time requires an entry time");
  }
  if (this.exitTime && this.entryTime && this.exitTime < this.entryTime) {
    this.invalidate("exitTime", "Exit time cannot precede entry time");
  }
});

studentSchema.index({ event: 1, rollNumber: 1 }, { unique: true });
studentSchema.index({ event: 1, email: 1 }, { unique: true });
studentSchema.index({ event: 1, phone: 1 }, { unique: true });
studentSchema.index({ "qrCode.value": 1 }, { unique: true });
studentSchema.index({ "barcode.value": 1 }, { unique: true });
studentSchema.index({ event: 1, verificationStatus: 1, createdAt: -1 });
studentSchema.index({ event: 1, attendanceStatus: 1 });
studentSchema.index({ volunteerAssigned: 1, attendanceStatus: 1 });
studentSchema.index({ college: 1, department: 1, year: 1 });

export type StudentDocument = HydratedDocument<Student>;
export const StudentModel: Model<Student> =
  (models.Student as Model<Student> | undefined) ??
  model<Student>("Student", studentSchema);
