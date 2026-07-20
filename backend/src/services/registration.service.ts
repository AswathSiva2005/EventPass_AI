import { createHmac } from "node:crypto";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { env } from "../config/env.js";
import { CollegeModel } from "../models/college.model.js";
import { DepartmentModel } from "../models/department.model.js";
import { EventModel } from "../models/event.model.js";
import { RegistrationCounterModel } from "../models/registration-counter.model.js";
import { StudentModel } from "../models/student.model.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";
import { deleteAsset, uploadBuffer } from "./cloudinary.service.js";
import { sendRegistrationConfirmationEmail } from "./mail.service.js";

export interface RegistrationFiles {
  selfie: Express.Multer.File;
  idFront: Express.Multer.File;
  idBack: Express.Multer.File;
}

export interface RegistrationInput {
  event: string;
  name: string;
  rollNumber: string;
  college: string;
  department: string;
  year: number;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

const nextRegistrationId = async (
  collegeCode: string,
  eventCode: string,
  year: number
): Promise<string> => {
  const safeCollege = collegeCode.replace(/[^A-Z0-9]/g, "").toUpperCase();
  const safeEvent = eventCode.replace(/[^A-Z0-9]/g, "").toUpperCase();
  const key = `${safeCollege}:${year}:${safeEvent}`;
  const counter = await RegistrationCounterModel.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 }, $setOnInsert: { key } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  if (!counter) {
    throw new AppError("Unable to allocate registration ID", 500, "ID_GENERATION_FAILED");
  }
  if (counter.sequence > 999_999) {
    throw new AppError("Registration sequence capacity exceeded", 409, "SEQUENCE_EXHAUSTED");
  }
  return `${safeCollege}${year}${safeEvent}${counter.sequence.toString().padStart(6, "0")}`;
};

const qrPayload = (registrationId: string): string => {
  const signature = createHmac("sha256", env.qrSigningSecret)
    .update(registrationId)
    .digest("base64url");
  return `EP1:${registrationId}:${signature}`;
};

const duplicateError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const registerStudent = async (
  input: RegistrationInput,
  files: RegistrationFiles
) => {
  const now = new Date();
  const [event, college, department, duplicate] = await Promise.all([
    EventModel.findOne({
      _id: input.event,
      status: "published",
      registrationOpensAt: { $lte: now },
      registrationClosesAt: { $gte: now },
      startsAt: { $gt: now }
    }).lean(),
    CollegeModel.findOne({ _id: input.college, isActive: true }).lean(),
    DepartmentModel.findOne({
      _id: input.department,
      college: input.college,
      isActive: true
    }).lean(),
    StudentModel.findOne({
      event: input.event,
      $or: [
        { email: input.email.toLowerCase() },
        { phone: input.phone },
        { rollNumber: input.rollNumber.toUpperCase() }
      ]
    })
      .select("_id")
      .lean()
  ]);

  if (!event) {
    throw new AppError("Event registration is not open", 409, "REGISTRATION_CLOSED");
  }
  if (!college) throw new AppError("College is invalid or inactive", 422, "INVALID_COLLEGE");
  if (!department) {
    throw new AppError("Department does not belong to the selected college", 422, "INVALID_DEPARTMENT");
  }
  if (duplicate) {
    throw new AppError(
      "A registration already exists for this event using the same email, phone, or roll number",
      409,
      "DUPLICATE_REGISTRATION"
    );
  }

  const reserved = await EventModel.updateOne(
    {
      _id: event._id,
      status: "published",
      registrationClosesAt: { $gte: new Date() },
      $expr: { $lt: [{ $ifNull: ["$registrationCount", 0] }, "$capacity"] }
    },
    { $inc: { registrationCount: 1 } }
  );
  if (reserved.modifiedCount !== 1) {
    throw new AppError("Event registration capacity is full", 409, "EVENT_FULL");
  }

  const uploadedPublicIds: string[] = [];
  let persisted = false;
  try {
    const year = new Date(event.startsAt).getUTCFullYear();
    const registrationId = await nextRegistrationId(college.code, event.code, year);
    const folder = `eventpass-ai/registrations/${registrationId}`;

    const uploadImage = async (file: Express.Multer.File, name: string) => {
      const uploaded = await uploadBuffer(file.buffer, {
        folder,
        public_id: name,
        overwrite: false,
        resource_type: "image"
      });
      uploadedPublicIds.push(uploaded.public_id);
      return { url: uploaded.secure_url, publicId: uploaded.public_id };
    };

    const selfie = await uploadImage(files.selfie, "selfie");
    const idFront = await uploadImage(files.idFront, "id-front");
    const idBack = await uploadImage(files.idBack, "id-back");

    const signedQrValue = qrPayload(registrationId);
    const qrBuffer = await QRCode.toBuffer(signedQrValue, {
      type: "png",
      errorCorrectionLevel: "H",
      width: 640,
      margin: 2
    });
    const qrUpload = await uploadBuffer(qrBuffer, {
      folder,
      public_id: "qr-code",
      overwrite: false,
      format: "png"
    });
    uploadedPublicIds.push(qrUpload.public_id);

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: registrationId,
      scale: 3,
      height: 14,
      includetext: true,
      textxalign: "center"
    });
    const barcodeUpload = await uploadBuffer(barcodeBuffer, {
      folder,
      public_id: "barcode",
      overwrite: false,
      format: "png"
    });
    uploadedPublicIds.push(barcodeUpload.public_id);

    const student = await StudentModel.create({
      registrationId,
      event: event._id,
      name: input.name,
      rollNumber: input.rollNumber,
      college: college._id,
      department: department._id,
      year: input.year,
      phone: input.phone,
      email: input.email,
      emergencyContact: input.emergencyContact,
      selfie,
      idFront,
      idBack,
      qrCode: {
        value: signedQrValue,
        imageUrl: qrUpload.secure_url,
        publicId: qrUpload.public_id
      },
      barcode: {
        value: registrationId,
        imageUrl: barcodeUpload.secure_url,
        publicId: barcodeUpload.public_id
      },
      attendanceStatus: "registered",
      verificationStatus: "pending",
      venue: event.venue.name
    });
    persisted = true;

    let confirmationEmailSent = true;
    try {
      await sendRegistrationConfirmationEmail({
        to: student.email,
        studentName: student.name,
        eventName: event.name,
        registrationId: student.registrationId,
        qrCodeUrl: student.qrCode.imageUrl
      });
    } catch (error) {
      confirmationEmailSent = false;
      logger.warn("Registration saved but confirmation email delivery failed", {
        registrationId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      registrationId: student.registrationId,
      eventName: event.name,
      studentName: student.name,
      verificationStatus: student.verificationStatus,
      qrCode: { imageUrl: student.qrCode.imageUrl },
      confirmationEmailSent
    };
  } catch (error) {
    if (!persisted) {
      await EventModel.updateOne(
        { _id: event._id, registrationCount: { $gt: 0 } },
        { $inc: { registrationCount: -1 } }
      );
      await Promise.allSettled(
        uploadedPublicIds.map(async (publicId) => deleteAsset(publicId))
      );
    }
    if (duplicateError(error)) {
      throw new AppError(
        "A registration already exists for this event using the same registration details",
        409,
        "DUPLICATE_REGISTRATION"
      );
    }
    throw error;
  }
};

export const trackStudentRegistration = async (registrationId: string) => {
  const student = await StudentModel.findOne({
    registrationId: registrationId.toUpperCase()
  })
    .populate<{ event: { name: string; startsAt: Date } }>("event", "name startsAt")
    .select(
      "registrationId name verificationStatus attendanceStatus venue updatedAt event"
    )
    .lean();
  if (!student) throw new AppError("Registration was not found", 404, "REGISTRATION_NOT_FOUND");

  return {
    registrationId: student.registrationId,
    studentName: student.name,
    eventName: student.event.name,
    eventStartsAt: student.event.startsAt,
    verificationStatus: student.verificationStatus,
    attendanceStatus: student.attendanceStatus,
    venue: student.venue,
    updatedAt: student.updatedAt
  };
};
