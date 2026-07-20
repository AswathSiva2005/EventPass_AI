import { model, models, Schema, type Model } from "mongoose";

export interface RegistrationCounter {
  key: string;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const registrationCounterSchema = new Schema<RegistrationCounter>(
  {
    key: { type: String, required: true, unique: true, immutable: true, maxlength: 180 },
    sequence: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: true, collection: "registrationcounters" }
);

export const RegistrationCounterModel: Model<RegistrationCounter> =
  (models.RegistrationCounter as Model<RegistrationCounter> | undefined) ??
  model<RegistrationCounter>("RegistrationCounter", registrationCounterSchema);
