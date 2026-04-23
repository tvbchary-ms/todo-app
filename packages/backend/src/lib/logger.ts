import pino from "pino";
import { getConfig } from "../config/index.js";

function createLogger() {
  const config = getConfig();
  const isDev = config.NODE_ENV === "development";

  return pino({
    level: config.LOG_LEVEL,
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        }
      : {
          // Production: structured JSON logging for Loki ingestion
          formatters: {
            level: (label: string) => ({ level: label }),
            bindings: (bindings: pino.Bindings) => ({
              pid: bindings.pid,
              host: bindings.hostname,
              service: "todo-backend",
            }),
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        }),
  });
}

export const logger = createLogger();
