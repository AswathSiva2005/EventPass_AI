import { body, param, query } from "express-validator";

export const registrationListValidator = [
  query("search").optional().trim().isLength({ max: 120 }),
  query("event").optional().isMongoId().withMessage("Event filter is invalid"),
  query("college").optional().isMongoId().withMessage("College filter is invalid"),
  query("department").optional().isMongoId().withMessage("Department filter is invalid"),
  query("verificationStatus")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Verification filter is invalid"),
  query("attendanceStatus")
    .optional()
    .isIn(["registered", "checked_in", "checked_out", "absent"])
    .withMessage("Attendance filter is invalid"),
  query("dateFrom").optional().isISO8601().toDate(),
  query("dateTo").optional().isISO8601().toDate(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt()
];

export const reviewRegistrationValidator = [
  param("studentId").isMongoId().withMessage("Student registration ID is invalid"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be approved or rejected"),
  body("notes").optional().trim().isLength({ max: 1000 }).withMessage("Notes are too long")
];

export const createEventValidator = [
  body("name").trim().isLength({ min: 3, max: 200 }),
  body("code")
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9][A-Z0-9_-]{2,49}$/)
    .withMessage("Event code is invalid"),
  body("description").trim().isLength({ min: 10, max: 5000 }),
  body("college").isMongoId().withMessage("College is invalid"),
  body("departments")
    .isArray({ min: 1 })
    .withMessage("Choose at least one department"),
  body("departments.*").isMongoId().withMessage("Department is invalid"),
  body("venue.name").trim().isLength({ min: 2, max: 200 }),
  body("venue.address").trim().isLength({ min: 5, max: 500 }),
  body("venue.latitude").optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body("venue.longitude").optional().isFloat({ min: -180, max: 180 }).toFloat(),
  body("startsAt").isISO8601().toDate(),
  body("endsAt").isISO8601().toDate(),
  body("registrationOpensAt").isISO8601().toDate(),
  body("registrationClosesAt").isISO8601().toDate(),
  body("capacity").isInt({ min: 1, max: 1_000_000 }).toInt(),
  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("New events must be draft or published")
];

export const bulkCollegeValidator = [
  body("colleges").isArray({ min: 1, max: 100 }).withMessage("Add 1 to 100 colleges"),
  body("colleges.*.name").trim().isLength({ min: 3, max: 200 }).withMessage("College name is invalid"),
  body("colleges.*.code").trim().toUpperCase().matches(/^[A-Z0-9][A-Z0-9_-]{2,49}$/).withMessage("College code is invalid"),
  body("colleges.*.city").trim().isLength({ min: 2, max: 100 }).withMessage("City is invalid"),
  body("colleges.*.departments").isArray({ min: 1, max: 50 }).withMessage("Add at least one department"),
  body("colleges.*.departments.*.name").trim().isLength({ min: 2, max: 150 }),
  body("colleges.*.departments.*.code").trim().toUpperCase().matches(/^[A-Z0-9][A-Z0-9_-]{2,49}$/)
];

export const createSubAdminValidator = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2 to 120 characters"),
  body("email").isEmail().withMessage("A valid email address is required").normalizeEmail(),
  body("role").isIn(["admin", "event_manager"]).withMessage("Role must be admin or event_manager"),
  body("password")
    .isString()
    .isLength({ min: 12, max: 128 })
    .withMessage("Password must be 12 to 128 characters")
    .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/\d/).withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/).withMessage("Password must contain a special character")
];
