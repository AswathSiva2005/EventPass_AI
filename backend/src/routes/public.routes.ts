import { Router } from "express";
import {
  listCollegesController,
  listDepartmentsController,
  listEventsController
} from "../controllers/public.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { departmentQueryValidator } from "../validators/registration.validator.js";

export const publicRouter = Router();

publicRouter.get("/events", listEventsController);
publicRouter.get("/colleges", listCollegesController);
publicRouter.get(
  "/departments",
  departmentQueryValidator,
  validateRequest,
  listDepartmentsController
);
