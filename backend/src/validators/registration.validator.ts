import { body, param, query } from "express-validator";

const normalizePhone = (value: string): string => value.replace(/[\s()-]/g, "");

export const studentRegistrationValidator = [
  body("event").isMongoId().withMessage("Event is invalid"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be 2 to 120 characters"),
  body("rollNumber")
    .trim()
    .toUpperCase()
    .isLength({ min: 2, max: 50 })
    .withMessage("Roll number must be 2 to 50 characters"),
  body("college").isMongoId().withMessage("College is invalid"),
  body("department").isMongoId().withMessage("Department is invalid"),
  body("year")
    .isInt({ min: 1, max: 8 })
    .withMessage("Year must be an integer from 1 to 8")
    .toInt(),
  body("phone")
    .customSanitizer(normalizePhone)
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage("Phone must be a valid international number"),
  body("email")
    .isEmail()
    .withMessage("Email is invalid")
    .normalizeEmail(),
  body("emergencyContact[name]")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Emergency contact name is required"),
  body("emergencyContact[relationship]")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Emergency contact relationship is required"),
  body("emergencyContact[phone]")
    .customSanitizer(normalizePhone)
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage("Emergency contact phone is invalid")
];

export const registrationIdValidator = [
  param("registrationId")
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9_-]{6,64}$/)
    .withMessage("Registration ID is invalid")
];

export const attendanceActionValidator = [
  ...registrationIdValidator,
  body("action")
    .isIn(["entry", "exit"])
    .withMessage("Attendance action must be entry or exit"),
  body("method")
    .isIn(["qr", "barcode", "manual"])
    .withMessage("Attendance method must be qr, barcode, or manual")
];

export const attendanceExportValidator = [
  param("eventId").isMongoId().withMessage("Event ID is invalid")
];

export const departmentQueryValidator = [
  query("college").isMongoId().withMessage("College query parameter is invalid")
];
