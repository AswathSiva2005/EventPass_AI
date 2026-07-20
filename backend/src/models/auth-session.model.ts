import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export const authUserModels = ["Admin", "Volunteer"] as const;
export type AuthUserModel = (typeof authUserModels)[number];

export interface AuthSession {
  user: Types.ObjectId;
  userModel: AuthUserModel;
  jti: string;
  tokenHash: string;
  rememberLogin: boolean;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt?: Date;
  replacedByJti?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<AuthSession>(
  {
    user: { type: Schema.Types.ObjectId, refPath: "userModel", required: true, immutable: true },
    userModel: { type: String, enum: authUserModels, required: true, immutable: true },
    jti: { type: String, required: true, unique: true, immutable: true },
    tokenHash: { type: String, required: true, select: false, immutable: true },
    rememberLogin: { type: Boolean, default: false, required: true, immutable: true },
    expiresAt: { type: Date, required: true, immutable: true },
    lastUsedAt: { type: Date, required: true },
    revokedAt: Date,
    replacedByJti: { type: String, trim: true },
    ipAddress: { type: String, trim: true, maxlength: 45 },
    userAgent: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true, collection: "authsessions", optimisticConcurrency: true }
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ user: 1, userModel: 1, revokedAt: 1, expiresAt: -1 });

export type AuthSessionDocument = HydratedDocument<AuthSession>;
export const AuthSessionModel: Model<AuthSession> =
  (models.AuthSession as Model<AuthSession> | undefined) ??
  model<AuthSession>("AuthSession", authSessionSchema);
