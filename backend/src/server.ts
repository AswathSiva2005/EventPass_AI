import type { Server } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import "./models/index.js";
import { logger } from "./utils/logger.js";

let server: Server | undefined;
let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received; starting graceful shutdown`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await disconnectDatabase();
  clearTimeout(forceExitTimer);
  process.exit(0);
};

const start = async (): Promise<void> => {
  await connectDatabase();
  const app = createApp();
  server = app.listen(env.port, () => {
    logger.info(`EventPass AI API listening on port ${env.port}`, {
      environment: env.nodeEnv,
      apiPrefix: env.apiPrefix
    });
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
  void shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  void shutdown("uncaughtException");
});

void start().catch((error: unknown) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
