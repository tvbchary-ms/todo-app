import { z } from "zod";
declare const envSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    PORT: z.ZodDefault<z.ZodNumber>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace"]>>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodNumber>;
    RATE_LIMIT_MAX_REQUESTS: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
}, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN?: string | undefined;
    PORT?: number | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | undefined;
    CORS_ORIGIN?: string | undefined;
    RATE_LIMIT_WINDOW_MS?: number | undefined;
    RATE_LIMIT_MAX_REQUESTS?: number | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function getConfig(): Env;
/** Reset config — used in tests */
export declare function resetConfig(): void;
export {};
//# sourceMappingURL=env.d.ts.map