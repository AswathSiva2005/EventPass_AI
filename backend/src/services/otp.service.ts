import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { AuthOtpModel, type OtpPurpose } from "../models/auth-otp.model.js";
import type { AuthUserModel } from "../models/auth-session.model.js";
import { AppError } from "../utils/app-error.js";

const hashCode = (
  email: string,
  userModel: AuthUserModel,
  purpose: OtpPurpose,
  code: string
): string =>
  createHmac("sha256", env.otp.pepper)
    .update(`${email}:${userModel}:${purpose}:${code}`)
    .digest("hex");

export const createOtp = async (input: {
  email: string;
  userModel: AuthUserModel;
  purpose: OtpPurpose;
}): Promise<{ code: string; expiresAt: Date }> => {
  const email = input.email.toLowerCase();
  const code = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + env.otp.expiresMinutes * 60_000);

  await AuthOtpModel.updateMany(
    {
      email,
      userModel: input.userModel,
      purpose: input.purpose,
      consumedAt: { $exists: false }
    },
    { $set: { consumedAt: new Date() } }
  );
  await AuthOtpModel.create({
    email,
    userModel: input.userModel,
    purpose: input.purpose,
    codeHash: hashCode(email, input.userModel, input.purpose, code),
    maxAttempts: env.otp.maxAttempts,
    expiresAt
  });
  return { code, expiresAt };
};

export const consumeOtp = async (input: {
  email: string;
  userModel: AuthUserModel;
  purpose: OtpPurpose;
  code: string;
}): Promise<void> => {
  const email = input.email.toLowerCase();
  const challenge = await AuthOtpModel.findOne({
    email,
    userModel: input.userModel,
    purpose: input.purpose,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .select("+codeHash");

  if (!challenge || challenge.attempts >= challenge.maxAttempts) {
    throw new AppError("OTP is invalid or expired", 400, "INVALID_OTP");
  }

  const actual = Buffer.from(challenge.codeHash, "hex");
  const expected = Buffer.from(
    hashCode(email, input.userModel, input.purpose, input.code),
    "hex"
  );
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    challenge.attempts += 1;
    if (challenge.attempts >= challenge.maxAttempts) challenge.consumedAt = new Date();
    await challenge.save();
    throw new AppError("OTP is invalid or expired", 400, "INVALID_OTP");
  }

  challenge.consumedAt = new Date();
  await challenge.save();
};
