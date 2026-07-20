import type { RequestHandler } from "express";
import {
  registerStudent,
  trackStudentRegistration,
  type RegistrationFiles,
  type RegistrationInput
} from "../services/registration.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

interface RegistrationBody {
  event: string;
  name: string;
  rollNumber: string;
  college: string;
  department: string;
  year: number;
  phone: string;
  email: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  "emergencyContact[name]"?: string;
  "emergencyContact[relationship]"?: string;
  "emergencyContact[phone]"?: string;
}

const registrationFiles = (request: Parameters<RequestHandler>[0]): RegistrationFiles => {
  const files = request.files;
  if (!files || Array.isArray(files)) {
    throw new AppError("Registration images are required", 422, "FILES_REQUIRED");
  }
  const selfie = files.selfie?.[0];
  const idFront = files.idFront?.[0];
  const idBack = files.idBack?.[0];
  if (!selfie || !idFront || !idBack) {
    throw new AppError("Registration images are required", 422, "FILES_REQUIRED");
  }
  return { selfie, idFront, idBack };
};

export const registerStudentController = asyncHandler(async (request, response) => {
  const body = request.body as RegistrationBody;
  const input: RegistrationInput = {
    event: body.event,
    name: body.name,
    rollNumber: body.rollNumber,
    college: body.college,
    department: body.department,
    year: body.year,
    phone: body.phone,
    email: body.email,
    emergencyContact: {
      name: body.emergencyContact?.name ?? body["emergencyContact[name]"] ?? "",
      relationship:
        body.emergencyContact?.relationship ??
        body["emergencyContact[relationship]"] ??
        "",
      phone: body.emergencyContact?.phone ?? body["emergencyContact[phone]"] ?? ""
    }
  };
  const registration = await registerStudent(input, registrationFiles(request));
  sendSuccess(response, {
    statusCode: 201,
    message: "Registration completed successfully",
    data: registration
  });
});

export const trackStudentController = asyncHandler(async (request, response) => {
  const value = request.params.registrationId;
  const registration = await trackStudentRegistration(
    typeof value === "string" ? value : ""
  );
  sendSuccess(response, {
    message: "Registration status retrieved",
    data: registration
  });
});
