import { Router } from "express";
import {
  recordStudentAttendanceController,
  volunteerAttendanceExportController,
  volunteerExportEventsController,
  getStudentVerificationController,
  searchStudentsController,
  registerStudentController,
  trackStudentController,
  studentPassController
} from "../controllers/student.controller.js";
import { validateRegistrationFiles } from "../middlewares/registration-files.middleware.js";
import { registrationUpload } from "../middlewares/upload.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { authenticate, authorizeUserModels } from "../middlewares/auth.middleware.js";
import {
  attendanceActionValidator,
  attendanceExportValidator,
  registrationIdValidator,
  studentSearchValidator,
  studentRegistrationValidator
} from "../validators/registration.validator.js";

export const studentRouter = Router();

studentRouter.post(
  "/register",
  registrationUpload,
  validateRegistrationFiles,
  studentRegistrationValidator,
  validateRequest,
  registerStudentController
);
studentRouter.get(
  "/track/:registrationId",
  registrationIdValidator,
  validateRequest,
  trackStudentController
);
studentRouter.get(
  "/pass/:registrationId.pdf",
  registrationIdValidator,
  validateRequest,
  studentPassController
);
studentRouter.get(
  "/attendance/export-events",
  authenticate,
  authorizeUserModels("Volunteer"),
  volunteerExportEventsController
);
studentRouter.get(
  "/attendance/export/:eventId",
  authenticate,
  authorizeUserModels("Volunteer"),
  attendanceExportValidator,
  validateRequest,
  volunteerAttendanceExportController
);
studentRouter.get(
  "/search",
  authenticate,
  authorizeUserModels("Volunteer"),
  studentSearchValidator,
  validateRequest,
  searchStudentsController
);
studentRouter.get(
  "/:registrationId/verification",
  authenticate,
  authorizeUserModels("Volunteer"),
  registrationIdValidator,
  validateRequest,
  getStudentVerificationController
);
studentRouter.post(
  "/:registrationId/attendance",
  authenticate,
  authorizeUserModels("Volunteer"),
  attendanceActionValidator,
  validateRequest,
  recordStudentAttendanceController
);
