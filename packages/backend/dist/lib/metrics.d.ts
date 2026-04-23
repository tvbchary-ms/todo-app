import client from "prom-client";
import type { Request, Response, NextFunction } from "express";
declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestDuration: client.Histogram<"route" | "method" | "status_code">;
export declare const httpRequestTotal: client.Counter<"route" | "method" | "status_code">;
export declare const httpRequestErrors: client.Counter<"route" | "method" | "status_code">;
export declare const activeConnections: client.Gauge<string>;
export declare const dbQueryDuration: client.Histogram<"table" | "operation">;
export declare function metricsMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function metricsRoute(_req: Request, res: Response): Promise<void>;
export { register };
//# sourceMappingURL=metrics.d.ts.map