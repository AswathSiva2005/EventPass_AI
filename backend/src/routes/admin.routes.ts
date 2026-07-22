import { Router } from "express";
import {
  createEventController,
  createSubAdminController,
  bulkCollegesController,
  dashboardController,
  eventsController,
  excelExportController,
  pdfExportController,
  registrationsController,
  subAdminsController,
  reviewController
} from "../controllers/admin.controller.js";
import {
  authenticate,
  authorize,
  authorizeUserModels
} from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  createEventValidator,
  createSubAdminValidator,
  bulkCollegeValidator,
  registrationListValidator,
  reviewRegistrationValidator
} from "../validators/admin.validator.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorizeUserModels("Admin"));
adminRouter.get("/dashboard", dashboardController);
adminRouter.get("/accounts", authorize("super_admin"), subAdminsController);
adminRouter.post("/accounts", authorize("super_admin"), createSubAdminValidator, validateRequest, createSubAdminController);
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
adminRouter.post("/colleges/bulk", bulkCollegeValidator, validateRequest, bulkCollegesController);
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
