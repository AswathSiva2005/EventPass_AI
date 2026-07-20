import type { RequestHandler } from "express";
import { verifyAccessToken } from "../services/token.service.js";
import { AppError } from "../utils/app-error.js";

export const authenticate: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED"));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    next(new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED"));
    return;
  }

  const payload = verifyAccessToken(token);
  if (
    typeof payload.role !== "string" ||
    !["Admin", "Volunteer"].includes(payload.userModel) ||
    typeof payload.sid !== "string"
  ) {
    next(new AppError("Access token is invalid", 401, "INVALID_ACCESS_TOKEN"));
    return;
  }
  request.auth = {
    userId: payload.sub,
    role: payload.role,
    userModel: payload.userModel,
    sessionId: payload.sid
  };
  next();
};

export const authorize = (...roles: string[]): RequestHandler =>
  (request, _response, next) => {
    if (!request.auth) {
      next(new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED"));
      return;
    }
    if (!request.auth.role || !roles.includes(request.auth.role)) {
      next(new AppError("You do not have permission for this resource", 403, "FORBIDDEN"));
      return;
    }
    next();
  };

export const authorizeUserModels = (
  ...userModels: Array<"Admin" | "Volunteer">
): RequestHandler =>
  (request, _response, next) => {
    if (!request.auth) {
      next(new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED"));
      return;
    }
    if (!userModels.includes(request.auth.userModel)) {
      next(new AppError("You do not have permission for this resource", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
