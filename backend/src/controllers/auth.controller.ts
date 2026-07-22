import type { RequestHandler } from "express";
import type { AuthUserModel } from "../models/auth-session.model.js";
import {
  getCurrentAccount,
  getSessions,
  login,
  logout,
  logoutAll,
  registerVolunteer,
  refreshSession,
  requestOtp,
  resetPassword,
  revokeSession,
  verifyOtp
} from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

interface LoginBody {
  email?: string;
  phone?: string;
  password: string;
  userModel: AuthUserModel;
  rememberLogin?: boolean;
}

interface RegisterVolunteerBody {
  name: string;
  phone: string;
  password: string;
  rememberLogin?: boolean;
}

interface OtpBody {
  email: string;
  code?: string;
  userModel: AuthUserModel;
  purpose: "forgot_password" | "email_verification";
}

const clientContext = (request: Parameters<RequestHandler>[0]) => {
  const userAgent = request.get("user-agent");
  return {
    ...(request.ip ? { ipAddress: request.ip } : {}),
    ...(userAgent ? { userAgent } : {})
  };
};

const requireAuth = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) {
    throw new AppError("Authentication is required", 401, "AUTHENTICATION_REQUIRED");
  }
  return request.auth;
};

export const loginController = asyncHandler(async (request, response) => {
  const body = request.body as LoginBody;
  const result = await login({
    identifier: body.userModel === "Volunteer" ? (body.phone ?? "") : (body.email ?? ""),
    password: body.password,
    userModel: body.userModel,
    rememberLogin: body.rememberLogin ?? false,
    context: clientContext(request)
  });
  sendSuccess(response, { message: "Login successful", data: result });
});

export const registerVolunteerController = asyncHandler(async (request, response) => {
  const body = request.body as RegisterVolunteerBody;
  const result = await registerVolunteer({
    name: body.name,
    phone: body.phone,
    password: body.password,
    rememberLogin: body.rememberLogin ?? true,
    context: clientContext(request)
  });
  sendSuccess(response, {
    statusCode: 201,
    message: "Volunteer registration successful",
    data: result
  });
});

export const refreshController = asyncHandler(async (request, response) => {
  const body = request.body as { refreshToken: string };
  const result = await refreshSession(body.refreshToken, clientContext(request));
  sendSuccess(response, { message: "Session refreshed", data: result });
});

export const logoutController = asyncHandler(async (request, response) => {
  const body = request.body as { refreshToken: string };
  await logout(body.refreshToken);
  sendSuccess(response, { message: "Logout successful" });
});

export const logoutAllController = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  await logoutAll(auth.userId, auth.userModel);
  sendSuccess(response, { message: "All sessions have been revoked" });
});

export const requestOtpController = asyncHandler(async (request, response) => {
  const body = request.body as OtpBody;
  await requestOtp({
    email: body.email,
    userModel: body.userModel,
    purpose: body.purpose
  });
  sendSuccess(response, {
    message: "If the account exists and is eligible, an OTP has been sent"
  });
});

export const verifyOtpController = asyncHandler(async (request, response) => {
  const body = request.body as OtpBody;
  const result = await verifyOtp({
    email: body.email,
    code: body.code ?? "",
    userModel: body.userModel,
    purpose: body.purpose
  });
  sendSuccess(response, { message: "OTP verified", data: result });
});

export const resetPasswordController = asyncHandler(async (request, response) => {
  const body = request.body as { actionToken: string; newPassword: string };
  await resetPassword(body.actionToken, body.newPassword);
  sendSuccess(response, {
    message: "Password reset successful; sign in again on all devices"
  });
});

export const meController = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const account = await getCurrentAccount(auth.userId, auth.userModel);
  sendSuccess(response, { message: "Current account retrieved", data: account });
});

export const sessionsController = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const sessions = await getSessions(auth.userId, auth.userModel);
  sendSuccess(response, { message: "Active sessions retrieved", data: sessions });
});

export const revokeSessionController = asyncHandler(async (request, response) => {
  const auth = requireAuth(request);
  const sessionId = request.params.sessionId;
  await revokeSession(
    typeof sessionId === "string" ? sessionId : "",
    auth.userId,
    auth.userModel
  );
  sendSuccess(response, { message: "Session revoked" });
});
