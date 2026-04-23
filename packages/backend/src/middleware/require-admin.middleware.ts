import type { Request, Response, NextFunction } from "express";
import { AppError } from "../services/index.js";

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "admin") {
    next(new AppError("Admin access required", "FORBIDDEN", 403));
    return;
  }
  next();
}
