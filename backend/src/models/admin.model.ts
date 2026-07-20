import { model, models, Schema, type HydratedDocument, type Model } from "mongoose";
import { emailPattern, normalizedString } from "./shared.js";

export const adminRoles = ["super_admin", "admin", "event_manager"] as const;
export type AdminRole = (typeof adminRoles)[number];

export interface Admin {
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<Admin>(
  {
    name: normalizedString(120),
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [emailPattern, "Email address is invalid"]
    },
    passwordHash: { type: String, required: true, select: false, minlength: 50, maxlength: 255 },
    role: { type: String, enum: adminRoles, default: "admin", required: true },
    isActive: { type: Boolean, default: true, required: true },
    emailVerifiedAt: Date,
    lastLoginAt: Date
  },
  { timestamps: true, collection: "admins" }
);

adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ createdAt: -1 });

export type AdminDocument = HydratedDocument<Admin>;
export const AdminModel: Model<Admin> =
  (models.Admin as Model<Admin> | undefined) ?? model<Admin>("Admin", adminSchema);
