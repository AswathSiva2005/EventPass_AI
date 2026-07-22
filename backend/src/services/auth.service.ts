import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { AdminModel } from "../models/admin.model.js";
import { CollegeModel } from "../models/college.model.js";
import {
  AuthSessionModel,
  type AuthUserModel
} from "../models/auth-session.model.js";
import { VolunteerModel } from "../models/volunteer.model.js";
import { AppError } from "../utils/app-error.js";
import { sendOtpEmail } from "./mail.service.js";
import { consumeOtp, createOtp } from "./otp.service.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import {
  signAccessToken,
  signActionToken,
  signRefreshToken,
  verifyActionToken,
  verifyRefreshToken
} from "./token.service.js";

interface AuthAccount {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  emailVerifiedAt?: Date;
  role?: string;
}

interface ClientContext {
  ipAddress?: string;
  userAgent?: string;
}

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const findAccountByEmail = async (
  email: string,
  userModel: AuthUserModel,
  includePassword = false,
  requireActive = true
): Promise<AuthAccount | null> => {
  const normalizedEmail = email.toLowerCase();
  if (userModel === "Admin") {
    const query = AdminModel.findOne({
      email: normalizedEmail,
      ...(requireActive ? { isActive: true } : {})
    });
    if (includePassword) query.select("+passwordHash");
    return await query.lean();
  }

  const query = VolunteerModel.findOne({
    email: normalizedEmail,
    ...(requireActive ? { status: "active" } : { status: { $ne: "inactive" } })
  });
  if (includePassword) query.select("+passwordHash");
  return await query.lean();
};

const findAccountForLogin = async (
  identifier: string,
  userModel: AuthUserModel,
  includePassword = false
): Promise<AuthAccount | null> => {
  if (userModel === "Admin") {
    return findAccountByEmail(identifier, userModel, includePassword);
  }

  const query = VolunteerModel.findOne({
    phone: identifier,
    status: "active"
  });
  if (includePassword) query.select("+passwordHash");
  return await query.lean();
};

const findActiveAccountById = async (
  userId: string,
  userModel: AuthUserModel
): Promise<AuthAccount | null> => {
  if (userModel === "Admin") {
    return await AdminModel.findOne({
      _id: userId,
      isActive: true
    }).lean();
  }
  return await VolunteerModel.findOne({
    _id: userId,
    status: "active"
  }).lean();
};

const accountRole = (account: AuthAccount, userModel: AuthUserModel): string =>
  userModel === "Admin" ? (account.role ?? "admin") : "volunteer";

const publicAccount = (account: AuthAccount, userModel: AuthUserModel) => ({
  id: account._id.toString(),
  name: account.name,
  email: account.email,
  ...(account.phone ? { phone: account.phone } : {}),
  role: accountRole(account, userModel),
  userModel,
  emailVerified: Boolean(account.emailVerifiedAt)
});

const issueSession = async (input: {
  account: AuthAccount;
  userModel: AuthUserModel;
  rememberLogin: boolean;
  context: ClientContext;
}) => {
  const sessionId = new Types.ObjectId();
  const role = accountRole(input.account, input.userModel);
  const refresh = signRefreshToken({
    userId: input.account._id.toString(),
    role,
    userModel: input.userModel,
    sessionId: sessionId.toString(),
    rememberLogin: input.rememberLogin
  });

  await AuthSessionModel.create({
    _id: sessionId,
    user: input.account._id,
    userModel: input.userModel,
    jti: refresh.jti,
    tokenHash: hashToken(refresh.token),
    rememberLogin: input.rememberLogin,
    expiresAt: refresh.expiresAt,
    lastUsedAt: new Date(),
    ...input.context
  });

  return {
    accessToken: signAccessToken({
      userId: input.account._id.toString(),
      role,
      userModel: input.userModel,
      sessionId: sessionId.toString()
    }),
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
    user: publicAccount(input.account, input.userModel)
  };
};

export const login = async (input: {
  identifier: string;
  password: string;
  userModel: AuthUserModel;
  rememberLogin: boolean;
  context: ClientContext;
}) => {
  const account = await findAccountForLogin(input.identifier, input.userModel, true);
  if (
    !account?.passwordHash ||
    !(await verifyPassword(input.password, account.passwordHash))
  ) {
    throw new AppError("Phone number or password is incorrect", 401, "INVALID_CREDENTIALS");
  }
  if (!account.emailVerifiedAt) {
    throw new AppError("Email verification is required", 403, "EMAIL_NOT_VERIFIED");
  }

  const update = { $set: { lastLoginAt: new Date() } };
  if (input.userModel === "Admin") await AdminModel.updateOne({ _id: account._id }, update);
  else await VolunteerModel.updateOne({ _id: account._id }, update);

  return issueSession({
    account,
    userModel: input.userModel,
    rememberLogin: input.rememberLogin,
    context: input.context
  });
};

export const registerVolunteer = async (input: {
  name: string;
  phone: string;
  password: string;
  rememberLogin: boolean;
  context: ClientContext;
}) => {
  const existing = await VolunteerModel.exists({ phone: input.phone });
  if (existing) {
    throw new AppError("A volunteer with this phone number already exists", 409, "PHONE_ALREADY_REGISTERED");
  }

  const college = await CollegeModel.findOne({ isActive: true }).sort({ createdAt: 1 }).lean();
  if (!college) {
    throw new AppError(
      "Volunteer registration is unavailable until an active college is configured",
      503,
      "COLLEGE_NOT_CONFIGURED"
    );
  }

  const volunteerId = `VOL-${input.phone.replace(/\D/g, "").slice(-8)}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const internalEmail = `${volunteerId.toLowerCase()}@volunteer.eventpass.local`;

  let account;
  try {
    account = await VolunteerModel.create({
      volunteerId,
      name: input.name,
      email: internalEmail,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      college: college._id,
      assignedEvents: [],
      status: "active",
      emailVerifiedAt: new Date()
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError("A volunteer with this phone number already exists", 409, "PHONE_ALREADY_REGISTERED");
    }
    throw error;
  }

  return issueSession({
    account: account.toObject(),
    userModel: "Volunteer",
    rememberLogin: input.rememberLogin,
    context: input.context
  });
};

export const refreshSession = async (refreshToken: string, context: ClientContext) => {
  const payload = verifyRefreshToken(refreshToken);
  const session = await AuthSessionModel.findOne({ jti: payload.jti }).select("+tokenHash");

  if (
    !session ||
    session.user.toString() !== payload.sub ||
    session.userModel !== payload.userModel ||
    session.expiresAt <= new Date()
  ) {
    throw new AppError("Refresh session is invalid or expired", 401, "INVALID_SESSION");
  }

  if (
    session.revokedAt ||
    !safeEqual(session.tokenHash, hashToken(refreshToken))
  ) {
    await AuthSessionModel.updateMany(
      { user: payload.sub, userModel: payload.userModel, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    throw new AppError("Refresh token reuse detected", 401, "TOKEN_REUSE_DETECTED");
  }

  const account = await findActiveAccountById(payload.sub, payload.userModel);
  if (!account) {
    throw new AppError("Account is no longer active", 401, "ACCOUNT_INACTIVE");
  }

  const replacementJti = randomUUID();
  const revoked = await AuthSessionModel.updateOne(
    { _id: session._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), replacedByJti: replacementJti, lastUsedAt: new Date() } }
  );
  if (revoked.modifiedCount !== 1) {
    throw new AppError("Refresh session has already been used", 401, "TOKEN_REUSE_DETECTED");
  }

  const sessionId = new Types.ObjectId();
  const role = accountRole(account, payload.userModel);
  const refresh = signRefreshToken({
    userId: account._id.toString(),
    role,
    userModel: payload.userModel,
    sessionId: sessionId.toString(),
    rememberLogin: session.rememberLogin,
    jti: replacementJti
  });
  await AuthSessionModel.create({
    _id: sessionId,
    user: account._id,
    userModel: payload.userModel,
    jti: refresh.jti,
    tokenHash: hashToken(refresh.token),
    rememberLogin: session.rememberLogin,
    expiresAt: refresh.expiresAt,
    lastUsedAt: new Date(),
    ...context
  });

  return {
    accessToken: signAccessToken({
      userId: account._id.toString(),
      role,
      userModel: payload.userModel,
      sessionId: sessionId.toString()
    }),
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt
  };
};

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await AuthSessionModel.updateOne(
      { jti: payload.jti, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  } catch {
    // Logout remains idempotent and does not disclose token state.
  }
};

export const logoutAll = async (
  userId: string,
  userModel: AuthUserModel
): Promise<void> => {
  await AuthSessionModel.updateMany(
    { user: userId, userModel, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
};

export const getSessions = async (userId: string, userModel: AuthUserModel) =>
  AuthSessionModel.find({
    user: userId,
    userModel,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  })
    .select("_id rememberLogin expiresAt lastUsedAt ipAddress userAgent createdAt")
    .sort({ lastUsedAt: -1 })
    .lean();

export const revokeSession = async (
  sessionId: string,
  userId: string,
  userModel: AuthUserModel
): Promise<void> => {
  await AuthSessionModel.updateOne(
    { _id: sessionId, user: userId, userModel, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
};

export const getCurrentAccount = async (userId: string, userModel: AuthUserModel) => {
  const account = await findActiveAccountById(userId, userModel);
  if (!account) throw new AppError("Account is no longer active", 401, "ACCOUNT_INACTIVE");
  return publicAccount(account, userModel);
};

export const requestOtp = async (input: {
  email: string;
  userModel: AuthUserModel;
  purpose: "forgot_password" | "email_verification";
}): Promise<void> => {
  const account = await findAccountByEmail(input.email, input.userModel, false, false);
  if (!account) return;
  if (input.purpose === "email_verification" && account.emailVerifiedAt) return;

  const { code } = await createOtp(input);
  await sendOtpEmail({
    to: account.email,
    name: account.name,
    code,
    purpose: input.purpose,
    expiresMinutes: env.otp.expiresMinutes
  });
};

export const verifyOtp = async (input: {
  email: string;
  code: string;
  userModel: AuthUserModel;
  purpose: "forgot_password" | "email_verification";
}): Promise<{ actionToken?: string; verified?: true }> => {
  const account = await findAccountByEmail(input.email, input.userModel, false, false);
  if (!account) throw new AppError("OTP is invalid or expired", 400, "INVALID_OTP");
  await consumeOtp(input);

  if (input.purpose === "email_verification") {
    const update = { $set: { emailVerifiedAt: new Date() } };
    if (input.userModel === "Admin") await AdminModel.updateOne({ _id: account._id }, update);
    else {
      await VolunteerModel.updateOne(
        { _id: account._id },
        { $set: { emailVerifiedAt: new Date(), status: "active" } }
      );
    }
    return { verified: true };
  }

  return {
    actionToken: signActionToken({
      userId: account._id.toString(),
      email: account.email,
      userModel: input.userModel,
      purpose: input.purpose
    })
  };
};

export const resetPassword = async (
  actionToken: string,
  newPassword: string
): Promise<void> => {
  const payload = verifyActionToken(actionToken);
  if (payload.purpose !== "forgot_password") {
    throw new AppError("Password reset token is invalid", 401, "INVALID_ACTION_TOKEN");
  }
  const passwordHash = await hashPassword(newPassword);
  const update = {
    $set: { passwordHash, emailVerifiedAt: new Date() }
  };
  if (payload.userModel === "Admin") {
    await AdminModel.updateOne({ _id: payload.sub, email: payload.email }, update);
  } else {
    await VolunteerModel.updateOne({ _id: payload.sub, email: payload.email }, update);
  }
  await logoutAll(payload.sub, payload.userModel);
};
