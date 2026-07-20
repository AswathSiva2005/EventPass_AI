import type { Response } from "express";

interface SuccessResponseOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const sendSuccess = <T>(
  response: Response,
  options: SuccessResponseOptions<T>
): Response =>
  response.status(options.statusCode ?? 200).json({
    success: true,
    message: options.message,
    ...(options.data === undefined ? {} : { data: options.data }),
    ...(options.meta === undefined ? {} : { meta: options.meta })
  });
