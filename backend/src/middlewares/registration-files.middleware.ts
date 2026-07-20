import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const validateRegistrationFiles: RequestHandler = (request, _response, next) => {
  const files = request.files;
  if (!files || Array.isArray(files)) {
    next(new AppError("Selfie and both college ID images are required", 422, "FILES_REQUIRED"));
    return;
  }

  const missing = ["selfie", "idFront", "idBack"].filter(
    (field) => !files[field]?.[0]
  );
  if (missing.length > 0) {
    next(
      new AppError(
        "Selfie and both college ID images are required",
        422,
        "FILES_REQUIRED",
        { missing }
      )
    );
    return;
  }
  next();
};
