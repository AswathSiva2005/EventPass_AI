import { model, models, Schema, type HydratedDocument, type Model } from "mongoose";
import { authUserModels, type AuthUserModel } from "./auth-session.model.js";
import { emailPattern } from "./shared.js";

export const otpPurposes = ["forgot_password", "email_verification"] as const;
export type OtpPurpose = (typeof otpPurposes)[number];

export interface AuthOtp {
  email: string;
  userModel: AuthUserModel;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authOtpSchema = new Schema<AuthOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [emailPattern, "Email address is invalid"],
      immutable: true
    },
    userModel: { type: String, enum: authUserModels, required: true, immutable: true },
    purpose: { type: String, enum: otpPurposes, required: true, immutable: true },
    codeHash: { type: String, required: true, select: false, immutable: true },
    attempts: { type: Number, default: 0, required: true, min: 0 },
    maxAttempts: { type: Number, required: true, min: 1, immutable: true },
    expiresAt: { type: Date, required: true, immutable: true },
    consumedAt: Date
  },
  { timestamps: true, collection: "authotps", optimisticConcurrency: true }
);

authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authOtpSchema.index({ email: 1, userModel: 1, purpose: 1, createdAt: -1 });

export type AuthOtpDocument = HydratedDocument<AuthOtp>;
export const AuthOtpModel: Model<AuthOtp> =
  (models.AuthOtp as Model<AuthOtp> | undefined) ??
  model<AuthOtp>("AuthOtp", authOtpSchema);
