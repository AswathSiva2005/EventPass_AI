import { Router } from "express";
import {
  createEventController,
  deleteEventController,
  eventDeletionRequestsController,
  createSubAdminController,
  bulkCollegesController,
  dashboardController,
  eventsController,
  excelExportController,
  pdfExportController,
  registrationsController,
  subAdminsController,
  reviewController,
  updateEventController,
  reviewEventDeletionController,
  uploadEventImageController
} from "../controllers/admin.controller.js";
import {
  authenticate,
  authorize,
  authorizeUserModels
} from "../middlewares/auth.middleware.js";
import { imageUpload } from "../middlewares/upload.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  createEventValidator,
  deleteEventValidator,
  deleteEventBodyValidator,
  reviewEventDeletionValidator,
  updateEventValidator,
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
adminRouter.post("/uploads/image", imageUpload.single("image"), uploadEventImageController);
adminRouter.post("/events", createEventValidator, validateRequest, createEventController);
adminRouter.patch("/events/:eventId", updateEventValidator, validateRequest, updateEventController);
adminRouter.delete("/events/:eventId", deleteEventValidator, deleteEventBodyValidator, validateRequest, deleteEventController);
adminRouter.get("/event-deletion-requests", authorize("super_admin"), eventDeletionRequestsController);
adminRouter.patch("/event-deletion-requests/:requestId", authorize("super_admin"), reviewEventDeletionValidator, validateRequest, reviewEventDeletionController);
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
