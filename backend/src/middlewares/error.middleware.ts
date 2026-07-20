import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { MulterError } from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  void _next;
  let appError: AppError;
  if (error instanceof AppError) appError = error;
  else if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
    appError = new AppError(
      "Registration data could not be saved",
      422,
      "DATABASE_VALIDATION_ERROR",
      details
    );
  }
  else if (error instanceof MulterError) {
    appError = new AppError(error.message, 400, `UPLOAD_${error.code}`);
  } else if (error instanceof SyntaxError && "body" in error) {
    appError = new AppError("Malformed JSON request body", 400, "INVALID_JSON");
  } else {
    appError = new AppError("An unexpected error occurred", 500, "INTERNAL_SERVER_ERROR");
  }

  logger.error(appError.message, {
    code: appError.code,
    method: request.method,
    path: request.originalUrl,
    originalError: error instanceof Error ? error.message : String(error),
    ...(env.isProduction ? {} : { stack: error instanceof Error ? error.stack : undefined })
  });

  response.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details === undefined ? {} : { details: appError.details }),
      ...(!env.isProduction && error instanceof Error ? { stack: error.stack } : {})
    }
  });
};
