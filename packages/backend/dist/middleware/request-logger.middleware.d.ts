import type { Request, Response, NextFunction } from "express";
/**
 * Request logging middleware — logs method, URL, status, and duration.
 * Uses Pino for structured JSON output.
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=request-logger.middleware.d.ts.map