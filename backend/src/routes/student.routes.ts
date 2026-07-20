import { Router } from "express";
import {
  registerStudentController,
  trackStudentController
} from "../controllers/student.controller.js";
import { validateRegistrationFiles } from "../middlewares/registration-files.middleware.js";
import { registrationUpload } from "../middlewares/upload.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  registrationIdValidator,
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
