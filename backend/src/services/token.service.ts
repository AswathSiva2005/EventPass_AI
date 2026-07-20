import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUserModel } from "../models/auth-session.model.js";
import type { OtpPurpose } from "../models/auth-otp.model.js";
import { AppError } from "../utils/app-error.js";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  tokenType: "access";
  role: string;
  userModel: AuthUserModel;
  sid: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  tokenType: "refresh";
  role: string;
  userModel: AuthUserModel;
  sid: string;
  jti: string;
  rememberLogin: boolean;
}

export interface ActionTokenPayload extends JwtPayload {
  sub: string;
  tokenType: "action";
  purpose: OtpPurpose;
  email: string;
  userModel: AuthUserModel;
}

interface IdentityTokenInput {
  userId: string;
  role: string;
  userModel: AuthUserModel;
  sessionId: string;
}

const signOptions = (
  secret: string,
  expiresIn: NonNullable<SignOptions["expiresIn"]>,
  subject: string,
  jwtId?: string
): [string, SignOptions] => [
  secret,
  {
    expiresIn,
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
    subject,
    ...(jwtId ? { jwtid: jwtId } : {})
  }
];

const verify = <T extends JwtPayload>(
  token: string,
  secret: string,
  tokenType: T["tokenType"]
): T => {
  try {
    const payload = jwt.verify(token, secret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience
    });
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.tokenType !== tokenType
    ) {
      throw new AppError("Invalid token", 401, "INVALID_TOKEN");
    }
    return payload as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Token is invalid or expired", 401, "INVALID_TOKEN");
  }
};

export const signAccessToken = (input: IdentityTokenInput): string => {
  const [secret, options] = signOptions(
    env.jwt.accessSecret,
    env.jwt.accessExpiresIn as NonNullable<SignOptions["expiresIn"]>,
    input.userId
  );
  return jwt.sign(
    {
      tokenType: "access",
      role: input.role,
      userModel: input.userModel,
      sid: input.sessionId
    },
    secret,
    options
  );
};

export const signRefreshToken = (
  input: IdentityTokenInput & { rememberLogin: boolean; jti?: string }
): { token: string; jti: string; expiresAt: Date } => {
  const jti = input.jti ?? randomUUID();
  const lifetime = input.rememberLogin
    ? env.jwt.rememberExpiresIn
    : env.jwt.refreshExpiresIn;
  const [secret, options] = signOptions(
    env.jwt.refreshSecret,
    lifetime as NonNullable<SignOptions["expiresIn"]>,
    input.userId,
    jti
  );
  const token = jwt.sign(
    {
      tokenType: "refresh",
      role: input.role,
      userModel: input.userModel,
      sid: input.sessionId,
      rememberLogin: input.rememberLogin
    },
    secret,
    options
  );
  const decoded = jwt.decode(token);
  if (typeof decoded === "string" || typeof decoded?.exp !== "number") {
    throw new AppError("Unable to create refresh token", 500, "TOKEN_CREATION_FAILED");
  }
  return { token, jti, expiresAt: new Date(decoded.exp * 1000) };
};

export const signActionToken = (input: {
  userId: string;
  email: string;
  userModel: AuthUserModel;
  purpose: OtpPurpose;
}): string => {
  const [secret, options] = signOptions(
    env.jwt.actionSecret,
    env.jwt.actionExpiresIn as NonNullable<SignOptions["expiresIn"]>,
    input.userId
  );
  return jwt.sign(
    {
      tokenType: "action",
      email: input.email,
      userModel: input.userModel,
      purpose: input.purpose
    },
    secret,
    options
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  verify<AccessTokenPayload>(token, env.jwt.accessSecret, "access");

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  verify<RefreshTokenPayload>(token, env.jwt.refreshSecret, "refresh");

export const verifyActionToken = (token: string): ActionTokenPayload =>
  verify<ActionTokenPayload>(token, env.jwt.actionSecret, "action");
