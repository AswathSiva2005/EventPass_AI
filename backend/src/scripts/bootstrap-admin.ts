import { input, password } from "@inquirer/prompts";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { AdminModel } from "../models/admin.model.js";
import { hashPassword } from "../services/password.service.js";
import { logger } from "../utils/logger.js";

const passwordError = (value: string): string | true => {
  if (value.length < 12 || value.length > 128) return "Use 12 to 128 characters";
  if (!/[a-z]/.test(value)) return "Include a lowercase letter";
  if (!/[A-Z]/.test(value)) return "Include an uppercase letter";
  if (!/\d/.test(value)) return "Include a number";
  if (!/[^A-Za-z0-9]/.test(value)) return "Include a special character";
  return true;
};

const run = async (): Promise<void> => {
  await connectDatabase();

  const existing = await AdminModel.exists({ role: "super_admin" });
  if (existing) {
    throw new Error(
      "A super admin already exists. Create additional admins through the authorized admin-management workflow."
    );
  }

  const name = await input({
    message: "Super admin name:",
    validate: (value) => {
      const length = value.trim().length;
      return length >= 2 && length <= 120 ? true : "Name must be 2 to 120 characters";
    }
  });
  const email = await input({
    message: "Super admin email:",
    validate: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
        ? true
        : "Enter a valid email address"
  });
  const secret = await password({
    message: "Password:",
    mask: "*",
    validate: passwordError
  });
  const confirmation = await password({
    message: "Confirm password:",
    mask: "*",
    validate: (value) => (value === secret ? true : "Passwords do not match")
  });

  if (confirmation !== secret) throw new Error("Passwords do not match");

  const normalizedEmail = email.trim().toLowerCase();
  const duplicate = await AdminModel.exists({ email: normalizedEmail });
  if (duplicate) throw new Error("An admin with this email already exists");

  await AdminModel.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(secret),
    role: "super_admin",
    isActive: true,
    emailVerifiedAt: new Date()
  });

  logger.info("Super admin created successfully", { email: normalizedEmail });
};

const main = async (): Promise<void> => {
  try {
    await run();
  } catch (error) {
    logger.error(
      "Super admin bootstrap failed",
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
  } finally {
    await disconnectDatabase().catch(() => undefined);
  }
};

void main();
