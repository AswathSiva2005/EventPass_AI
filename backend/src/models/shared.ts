import { Schema, type SchemaDefinitionProperty } from "mongoose";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^\+?[1-9]\d{7,14}$/;
export const codePattern = /^[A-Z0-9][A-Z0-9_-]{2,49}$/;

export interface MediaAsset {
  url: string;
  publicId: string;
}

export const mediaAssetSchema = new Schema<MediaAsset>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: (value: string) => /^https:\/\//i.test(value),
        message: "Media URL must use HTTPS"
      }
    },
    publicId: { type: String, required: true, trim: true, maxlength: 255 }
  },
  { _id: false }
);

export interface GeneratedCode {
  value: string;
  imageUrl: string;
  publicId: string;
}

export const generatedCodeSchema = new Schema<GeneratedCode>(
  {
    value: { type: String, required: true, trim: true, minlength: 8, maxlength: 512 },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: (value: string) => /^https:\/\//i.test(value),
        message: "Code image URL must use HTTPS"
      }
    },
    publicId: { type: String, required: true, trim: true, maxlength: 255 }
  },
  { _id: false }
);

export const normalizedString = (
  maximumLength: number,
  extra: Record<string, unknown> = {}
): SchemaDefinitionProperty<string> => ({
  type: String,
  required: true,
  trim: true,
  maxlength: maximumLength,
  ...extra
});
