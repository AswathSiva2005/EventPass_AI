import { param } from "express-validator";

export const mongoIdParam = (parameterName: string) =>
  param(parameterName)
    .isMongoId()
    .withMessage(`${parameterName} must be a valid MongoDB ObjectId`);
