import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { codePattern, normalizedString } from "./shared.js";

export const eventStatuses = ["draft", "published", "ongoing", "completed", "cancelled"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export interface EventVenue {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Event {
  name: string;
  code: string;
  description: string;
  college: Types.ObjectId;
  departments: Types.ObjectId[];
  venue: EventVenue;
  startsAt: Date;
  endsAt: Date;
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  capacity: number;
  registrationCount: number;
  status: EventStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const venueSchema = new Schema<EventVenue>(
  {
    name: normalizedString(200),
    address: normalizedString(500),
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  { _id: false }
);

const eventSchema = new Schema<Event>(
  {
    name: normalizedString(200),
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
      match: [codePattern, "Event code is invalid"]
    },
    description: normalizedString(5000),
    college: { type: Schema.Types.ObjectId, ref: "College", required: true },
    departments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
    venue: { type: venueSchema, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    registrationOpensAt: { type: Date, required: true },
    registrationClosesAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1, max: 1_000_000 },
    registrationCount: { type: Number, default: 0, required: true, min: 0 },
    status: { type: String, enum: eventStatuses, default: "draft", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true }
  },
  { timestamps: true, collection: "events" }
);

eventSchema.pre("validate", function validateDates() {
  if (this.endsAt <= this.startsAt) this.invalidate("endsAt", "Event end must follow its start");
  if (this.registrationClosesAt <= this.registrationOpensAt) {
    this.invalidate("registrationClosesAt", "Registration close must follow its opening");
  }
  if (this.registrationClosesAt > this.startsAt) {
    this.invalidate("registrationClosesAt", "Registration must close before the event starts");
  }
});

eventSchema.index({ college: 1, startsAt: -1 });
eventSchema.index({ status: 1, startsAt: 1 });
eventSchema.index({ departments: 1, status: 1 });

export type EventDocument = HydratedDocument<Event>;
export const EventModel: Model<Event> =
  (models.Event as Model<Event> | undefined) ?? model<Event>("Event", eventSchema);
