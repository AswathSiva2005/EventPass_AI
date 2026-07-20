import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/app-error.js";

export const validateRequest: RequestHandler = (request, _response, next) => {
  const result = validationResult(request);
  if (result.isEmpty()) {
    next();
    return;
  }

  const details = result.array().map((error) => ({
    type: error.type,
    message: String(error.msg),
    ...(error.type === "field" ? { field: error.path, location: error.location } : {})
  }));
  next(new AppError("Request validation failed", 422, "VALIDATION_ERROR", details));
};
