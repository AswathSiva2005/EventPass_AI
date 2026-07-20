import { model, models, Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { codePattern, normalizedString } from "./shared.js";

export interface Department {
  college: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<Department>(
  {
    college: { type: Schema.Types.ObjectId, ref: "College", required: true },
    name: normalizedString(150),
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
      match: [codePattern, "Department code is invalid"]
    },
    description: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, required: true }
  },
  { timestamps: true, collection: "departments" }
);

departmentSchema.index({ college: 1, code: 1 }, { unique: true });
departmentSchema.index({ college: 1, name: 1 }, { unique: true });
departmentSchema.index({ college: 1, isActive: 1 });

export type DepartmentDocument = HydratedDocument<Department>;
export const DepartmentModel: Model<Department> =
  (models.Department as Model<Department> | undefined) ??
  model<Department>("Department", departmentSchema);
