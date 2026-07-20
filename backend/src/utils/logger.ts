const write = (level: "info" | "warn" | "error", message: string, meta?: unknown): void => {
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta === undefined ? {} : { meta })
  });

  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
};

export const logger = {
  info: (message: string, meta?: unknown): void => write("info", message, meta),
  warn: (message: string, meta?: unknown): void => write("warn", message, meta),
  error: (message: string, meta?: unknown): void => write("error", message, meta)
};
