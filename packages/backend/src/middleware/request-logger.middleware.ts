import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

/**
 * Request logging middleware — logs method, URL, status, and duration.
 * Uses Pino for structured JSON output.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      userAgent: req.get("user-agent"),
      ip: req.ip,
      userId: req.user?.userId,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, "Request completed with server error");
    } else if (res.statusCode >= 400) {
      logger.warn(logData, "Request completed with client error");
    } else {
      logger.info(logData, "Request completed");
    }
  });

  next();
}
