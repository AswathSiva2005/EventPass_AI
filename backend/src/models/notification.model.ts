import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";

export const notificationTypes = ["registration", "verification", "event", "attendance", "system"] as const;
export type NotificationType = (typeof notificationTypes)[number];
export const notificationChannels = ["in_app", "email", "push", "sms"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];
export const recipientModels = ["Admin", "Volunteer", "Student"] as const;
export type RecipientModel = (typeof recipientModels)[number];

export interface Notification {
  recipient: Types.ObjectId;
  recipientModel: RecipientModel;
  event?: Types.ObjectId;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  message: string;
  data?: Record<string, unknown>;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<Notification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      refPath: "recipientModel",
      required: true,
      immutable: true
    },
    recipientModel: { type: String, enum: recipientModels, required: true, immutable: true },
    event: { type: Schema.Types.ObjectId, ref: "Event" },
    type: { type: String, enum: notificationTypes, required: true },
    channels: {
      type: [{ type: String, enum: notificationChannels }],
      required: true,
      validate: {
        validator: (values: NotificationChannel[]) => values.length > 0,
        message: "At least one notification channel is required"
      }
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    data: { type: Schema.Types.Mixed },
    readAt: Date,
    sentAt: Date
  },
  { timestamps: true, collection: "notifications" }
);

notificationSchema.index({ recipient: 1, recipientModel: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ event: 1, type: 1, createdAt: -1 });
notificationSchema.index({ sentAt: 1 });

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationModel: Model<Notification> =
  (models.Notification as Model<Notification> | undefined) ??
  model<Notification>("Notification", notificationSchema);
