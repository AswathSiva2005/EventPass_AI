import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export const auditActorTypes = ["Admin", "Volunteer", "System"] as const;
export type AuditActorType = (typeof auditActorTypes)[number];
export const auditOutcomes = ["success", "failure"] as const;
export type AuditOutcome = (typeof auditOutcomes)[number];

export interface AuditLog {
  actor?: Types.ObjectId;
  actorType: AuditActorType;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  event?: Types.ObjectId;
  outcome: AuditOutcome;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, refPath: "actorType", immutable: true },
    actorType: { type: String, enum: auditActorTypes, required: true, immutable: true },
    action: { type: String, required: true, trim: true, maxlength: 120, immutable: true },
    entityType: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
    entityId: { type: Schema.Types.ObjectId, immutable: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", immutable: true },
    outcome: { type: String, enum: auditOutcomes, required: true, immutable: true },
    changes: { type: Schema.Types.Mixed, immutable: true },
    metadata: { type: Schema.Types.Mixed, immutable: true },
    ipAddress: { type: String, trim: true, maxlength: 45, immutable: true },
    userAgent: { type: String, trim: true, maxlength: 1000, immutable: true }
  },
  {
    collection: "auditlogs",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = HydratedDocument<AuditLog>;
export const AuditLogModel: Model<AuditLog> =
  (models.AuditLog as Model<AuditLog> | undefined) ??
  model<AuditLog>("AuditLog", auditLogSchema);
