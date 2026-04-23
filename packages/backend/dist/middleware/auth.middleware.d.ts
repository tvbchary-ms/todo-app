import type { Request, Response, NextFunction } from "express";
import type { TokenPayload } from "../services/index.js";
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            token?: string;
        }
    }
}
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map