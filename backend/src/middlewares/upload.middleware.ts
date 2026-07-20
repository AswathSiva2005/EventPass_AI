import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadSizeBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 415, "UNSUPPORTED_MEDIA_TYPE"));
      return;
    }
    callback(null, true);
  }
});

export const registrationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadSizeBytes, files: 3 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          "Only JPEG, PNG, and WebP images are allowed",
          415,
          "UNSUPPORTED_MEDIA_TYPE"
        )
      );
      return;
    }
    callback(null, true);
  }
}).fields([
  { name: "selfie", maxCount: 1 },
  { name: "idFront", maxCount: 1 },
  { name: "idBack", maxCount: 1 }
]);
