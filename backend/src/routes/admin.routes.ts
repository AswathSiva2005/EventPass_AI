import { Router } from "express";
import {
  createEventController,
  dashboardController,
  eventsController,
  excelExportController,
  pdfExportController,
  registrationsController,
  reviewController
} from "../controllers/admin.controller.js";
import {
  authenticate,
  authorizeUserModels
} from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  createEventValidator,
  registrationListValidator,
  reviewRegistrationValidator
} from "../validators/admin.validator.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorizeUserModels("Admin"));
adminRouter.get("/dashboard", dashboardController);
adminRouter.get(
  "/registrations",
  registrationListValidator,
  validateRequest,
  registrationsController
);
adminRouter.patch(
  "/registrations/:studentId/verification",
  reviewRegistrationValidator,
  validateRequest,
  reviewController
);
adminRouter.get("/events", eventsController);
adminRouter.post("/events", createEventValidator, validateRequest, createEventController);
adminRouter.get(
  "/exports/registrations.xlsx",
  registrationListValidator,
  validateRequest,
  excelExportController
);
adminRouter.get(
  "/exports/registrations.pdf",
  registrationListValidator,
  validateRequest,
  pdfExportController
);
