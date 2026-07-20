import dotenv from "dotenv";

dotenv.config();

type NodeEnvironment = "development" | "test" | "production";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const numberValue = (name: string, fallback: number): number => {
  const rawValue = process.env[name];
  if (rawValue === undefined) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
};

const optional = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value || undefined;
};

const booleanValue = (name: string, fallback: boolean): boolean => {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
};

const nodeEnv = (process.env.NODE_ENV ?? "development") as NodeEnvironment;
if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production");
}

const corsOrigins = required("CORS_ORIGINS")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: numberValue("PORT", 5000),
  apiPrefix: process.env.API_PREFIX?.trim() || "/api/v1",
  mongoUri: required("MONGODB_URI"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "15m",
    refreshSecret: required("JWT_REFRESH_SECRET"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "7d",
    rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN?.trim() || "30d",
    actionSecret: required("JWT_ACTION_SECRET"),
    actionExpiresIn: process.env.JWT_ACTION_EXPIRES_IN?.trim() || "10m",
    issuer: process.env.JWT_ISSUER?.trim() || "eventpass-ai",
    audience: process.env.JWT_AUDIENCE?.trim() || "eventpass-ai-clients"
  },
  otp: {
    pepper: required("OTP_PEPPER"),
    expiresMinutes: numberValue("OTP_EXPIRES_MINUTES", 10),
    maxAttempts: numberValue("OTP_MAX_ATTEMPTS", 5)
  },
  passwordBcryptRounds: numberValue("PASSWORD_BCRYPT_ROUNDS", 12),
  qrSigningSecret: required("QR_SIGNING_SECRET"),
  smtp: {
    host: optional("SMTP_HOST"),
    port: numberValue("SMTP_PORT", 587),
    secure: booleanValue("SMTP_SECURE", false),
    user: optional("SMTP_USER"),
    password: optional("SMTP_PASSWORD"),
    from: optional("SMTP_FROM")
  },
  corsOrigins,
  cloudinary: {
    cloudName: required("CLOUDINARY_CLOUD_NAME"),
    apiKey: required("CLOUDINARY_API_KEY"),
    apiSecret: required("CLOUDINARY_API_SECRET")
  },
  maxUploadSizeBytes: numberValue("MAX_UPLOAD_SIZE_MB", 5) * 1024 * 1024,
  rateLimit: {
    windowMs: numberValue("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
    maxRequests: numberValue("RATE_LIMIT_MAX_REQUESTS", 200)
  }
});
