import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export const deletionRequestStatuses = ["pending", "approved", "rejected"] as const;
export type DeletionRequestStatus = (typeof deletionRequestStatuses)[number];

export interface EventDeletionRequest {
  event: Types.ObjectId;
  requestedBy: Types.ObjectId;
  status: DeletionRequestStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventDeletionRequestSchema = new Schema<EventDeletionRequest>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, immutable: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true, immutable: true },
    status: { type: String, enum: deletionRequestStatuses, default: "pending", required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    reviewedAt: Date,
    reviewNotes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true, collection: "eventdeletionrequests" }
);

eventDeletionRequestSchema.index({ event: 1, status: 1 });
eventDeletionRequestSchema.index({ status: 1, createdAt: -1 });

export type EventDeletionRequestDocument = HydratedDocument<EventDeletionRequest>;
export const EventDeletionRequestModel: Model<EventDeletionRequest> =
  (models.EventDeletionRequest as Model<EventDeletionRequest> | undefined) ??
  model<EventDeletionRequest>("EventDeletionRequest", eventDeletionRequestSchema);
