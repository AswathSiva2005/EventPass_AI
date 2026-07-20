import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, env.passwordBcryptRounds);

export const verifyPassword = async (
  password: string,
  passwordHash: string
): Promise<boolean> => bcrypt.compare(password, passwordHash);
