import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
/**
 * Middleware factory that validates request body, query, and params against Zod schemas.
 * Parsed values replace the original req properties so downstream handlers get typed data.
 */
export declare function validate(schemas: ValidationSchemas): (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.middleware.d.ts.map