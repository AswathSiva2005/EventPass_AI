import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginController,
  logoutAllController,
  logoutController,
  meController,
  refreshController,
  requestOtpController,
  resetPasswordController,
  revokeSessionController,
  sessionsController,
  verifyOtpController
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  loginValidator,
  refreshValidator,
  requestOtpValidator,
  resetPasswordValidator,
  sessionIdValidator,
  verifyOtpValidator
} from "../validators/auth.validator.js";

export const authRouter = Router();

const sensitiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "AUTH_RATE_LIMITED", message: "Too many attempts; try again later" }
  }
});

authRouter.post("/login", sensitiveLimit, loginValidator, validateRequest, loginController);
authRouter.post("/refresh", refreshValidator, validateRequest, refreshController);
authRouter.post("/logout", refreshValidator, validateRequest, logoutController);
authRouter.post("/otp/request", sensitiveLimit, requestOtpValidator, validateRequest, requestOtpController);
authRouter.post("/otp/verify", sensitiveLimit, verifyOtpValidator, validateRequest, verifyOtpController);
authRouter.post("/password/reset", sensitiveLimit, resetPasswordValidator, validateRequest, resetPasswordController);

authRouter.use(authenticate);
authRouter.get("/me", meController);
authRouter.get("/sessions", sessionsController);
authRouter.delete("/sessions/:sessionId", sessionIdValidator, validateRequest, revokeSessionController);
authRouter.post("/logout-all", logoutAllController);
