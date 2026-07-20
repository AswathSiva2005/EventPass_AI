import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../utils/response.js";

const stateNames: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

export const getHealth: RequestHandler = (_request, response) => {
  const databaseState = stateNames[mongoose.connection.readyState] ?? "unknown";
  const healthy = databaseState === "connected";

  sendSuccess(response, {
    statusCode: healthy ? 200 : 503,
    message: healthy ? "Service is healthy" : "Service is unavailable",
    data: {
      status: healthy ? "healthy" : "unhealthy",
      database: databaseState,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
};
