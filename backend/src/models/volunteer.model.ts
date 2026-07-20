import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { emailPattern, normalizedString, phonePattern } from "./shared.js";

export const volunteerStatuses = ["invited", "active", "suspended", "inactive"] as const;
export type VolunteerStatus = (typeof volunteerStatuses)[number];

export interface Volunteer {
  volunteerId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  college: Types.ObjectId;
  department?: Types.ObjectId;
  assignedEvents: Types.ObjectId[];
  status: VolunteerStatus;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSchema = new Schema<Volunteer>(
  {
    volunteerId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    name: normalizedString(120),
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [emailPattern, "Email address is invalid"]
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [phonePattern, "Phone must be in international format"]
    },
    passwordHash: { type: String, required: true, select: false, minlength: 50, maxlength: 255 },
    college: { type: Schema.Types.ObjectId, ref: "College", required: true },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    assignedEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    status: { type: String, enum: volunteerStatuses, default: "invited", required: true },
    emailVerifiedAt: Date,
    lastLoginAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true }
  },
  { timestamps: true, collection: "volunteers" }
);

volunteerSchema.index({ college: 1, status: 1 });
volunteerSchema.index({ assignedEvents: 1, status: 1 });

export type VolunteerDocument = HydratedDocument<Volunteer>;
export const VolunteerModel: Model<Volunteer> =
  (models.Volunteer as Model<Volunteer> | undefined) ??
  model<Volunteer>("Volunteer", volunteerSchema);
