import { model, models, Schema, type HydratedDocument, type Model } from "mongoose";
import { codePattern, emailPattern, normalizedString, phonePattern } from "./shared.js";

export interface CollegeAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface College {
  name: string;
  code: string;
  address?: CollegeAddress;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<CollegeAddress>(
  {
    line1: normalizedString(200),
    line2: { type: String, trim: true, maxlength: 200 },
    city: normalizedString(100),
    state: normalizedString(100),
    postalCode: normalizedString(20),
    country: normalizedString(100)
  },
  { _id: false }
);

const collegeSchema = new Schema<College>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
      match: [codePattern, "College code is invalid"]
    },
    address: { type: addressSchema },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [emailPattern, "Contact email is invalid"]
    },
    contactPhone: {
      type: String,
      trim: true,
      match: [phonePattern, "Contact phone must be in international format"]
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: (value: string) => /^https:\/\//i.test(value),
        message: "Website must use HTTPS"
      }
    },
    isActive: { type: Boolean, default: true, required: true }
  },
  { timestamps: true, collection: "colleges" }
);

collegeSchema.index({ isActive: 1, name: 1 });

export type CollegeDocument = HydratedDocument<College>;
export const CollegeModel: Model<College> =
  (models.College as Model<College> | undefined) ??
  model<College>("College", collegeSchema);
