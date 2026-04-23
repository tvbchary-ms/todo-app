import type { Request, Response, NextFunction } from "express";
import { authService, AppError } from "../services/index.js";
import type { TokenPayload } from "../services/index.js";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      token?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Missing or invalid authorization header", "UNAUTHORIZED", 401);
  }

  const token = authHeader.slice(7);

  authService
    .validateToken(token)
    .then((payload) => {
      req.user = payload;
      req.token = token;
      next();
    })
    .catch(next);
}
