import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

let transporter: Transporter | undefined;

const getTransporter = (): Transporter => {
  const { host, port, secure, user, password, from } = env.smtp;
  if (!host || !user || !password || !from) {
    throw new AppError(
      "Email delivery is not configured",
      503,
      "EMAIL_SERVICE_UNAVAILABLE"
    );
  }

  transporter ??= nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });
  return transporter;
};

export const sendOtpEmail = async (input: {
  to: string;
  name: string;
  code: string;
  purpose: "forgot_password" | "email_verification";
  expiresMinutes: number;
}): Promise<void> => {
  const title =
    input.purpose === "forgot_password"
      ? "Reset your EventPass AI password"
      : "Verify your EventPass AI email";
  const action =
    input.purpose === "forgot_password" ? "reset your password" : "verify your email";

  await getTransporter().sendMail({
    from: env.smtp.from,
    to: input.to,
    subject: title,
    text: `Hello ${input.name},\n\nUse ${input.code} to ${action}. It expires in ${input.expiresMinutes} minutes. If you did not request this, ignore this email.\n\nEventPass AI`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#122033">
      <h1 style="font-size:24px">${title}</h1>
      <p>Hello ${input.name},</p>
      <p>Use this one-time code to ${action}:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;background:#eefbf5;padding:18px;text-align:center;border-radius:12px">${input.code}</p>
      <p>This code expires in ${input.expiresMinutes} minutes. If you did not request this, you can safely ignore this email.</p>
      <p>EventPass AI</p>
    </div>`
  });
};

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ] ?? character
  );

export const sendRegistrationConfirmationEmail = async (input: {
  to: string;
  studentName: string;
  eventName: string;
  registrationId: string;
  qrCodeUrl: string;
}): Promise<void> => {
  const name = escapeHtml(input.studentName);
  const eventName = escapeHtml(input.eventName);
  const registrationId = escapeHtml(input.registrationId);
  await getTransporter().sendMail({
    from: env.smtp.from,
    to: input.to,
    subject: `Registration received — ${input.eventName}`,
    text: `Hello ${input.studentName},\n\nYour registration for ${input.eventName} was received.\nRegistration ID: ${input.registrationId}\nVerification status: Pending\nQR code: ${input.qrCodeUrl}\n\nKeep this ID safe and track your verification status before arriving.\n\nEventPass AI`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#122033">
      <h1 style="font-size:24px">Registration received</h1>
      <p>Hello ${name},</p>
      <p>Your registration for <strong>${eventName}</strong> was received and is awaiting verification.</p>
      <p style="font-size:14px;color:#64748b">Registration ID</p>
      <p style="font-size:22px;font-weight:700;letter-spacing:2px">${registrationId}</p>
      <img src="${input.qrCodeUrl}" alt="Registration QR code" width="220" height="220" style="display:block;margin:24px auto" />
      <p>Keep this ID safe and check your verification status before arriving at the venue.</p>
      <p>EventPass AI</p>
    </div>`
  });
};
