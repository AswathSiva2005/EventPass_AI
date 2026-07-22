import { body, param } from "express-validator";

const userModel = () =>
  body("userModel")
    .isIn(["Admin", "Volunteer"])
    .withMessage("userModel must be Admin or Volunteer");

const email = () =>
  body("email")
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail();

const phone = () =>
  body("phone")
    .customSanitizer((value: unknown) =>
      typeof value === "string" ? value.replace(/[\s()-]/g, "") : value
    )
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage("Phone must be in international format, for example +919876543210");

const password = (field = "password", minimumLength = 12) =>
  body(field)
    .isString()
    .isLength({ min: minimumLength, max: 128 })
    .withMessage(`${field} must be ${minimumLength} to 128 characters`)
    .matches(/[a-z]/)
    .withMessage(`${field} must contain a lowercase letter`)
    .matches(/[A-Z]/)
    .withMessage(`${field} must contain an uppercase letter`)
    .matches(/\d/)
    .withMessage(`${field} must contain a number`)
    .matches(/[^A-Za-z0-9]/)
    .withMessage(`${field} must contain a special character`);

export const loginValidator = [
  userModel(),
  body("email")
    .if(body("userModel").equals("Admin"))
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  body("phone")
    .if(body("userModel").equals("Volunteer"))
    .customSanitizer((value: unknown) =>
      typeof value === "string" ? value.replace(/[\s()-]/g, "") : value
    )
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage("A valid phone number is required"),
  body("password").isString().notEmpty().withMessage("Password is required"),
  body("rememberLogin").optional().isBoolean().withMessage("rememberLogin must be boolean")
];

export const registerVolunteerValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be 2 to 120 characters"),
  phone(),
  password("password", 8),
  body("rememberLogin").optional().isBoolean().withMessage("rememberLogin must be boolean")
];

export const refreshValidator = [
  body("refreshToken").isString().notEmpty().withMessage("Refresh token is required")
];

export const requestOtpValidator = [
  userModel(),
  email(),
  body("purpose")
    .isIn(["forgot_password", "email_verification"])
    .withMessage("OTP purpose is invalid")
];

export const verifyOtpValidator = [
  ...requestOtpValidator,
  body("code").isString().matches(/^\d{6}$/).withMessage("OTP must be a six-digit code")
];

export const resetPasswordValidator = [
  body("actionToken").isString().notEmpty().withMessage("Action token is required"),
  password("newPassword")
];

export const sessionIdValidator = [
  param("sessionId").isMongoId().withMessage("Session ID is invalid")
];
