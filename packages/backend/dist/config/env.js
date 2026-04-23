import { z } from "zod";
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});
let config;
export function getConfig() {
    if (!config) {
        const result = envSchema.safeParse(process.env);
        if (!result.success) {
            const formatted = result.error.format();
            console.error("❌ Invalid environment variables:", JSON.stringify(formatted, null, 2));
            process.exit(1);
        }
        config = result.data;
    }
    return config;
}
/** Reset config — used in tests */
export function resetConfig() {
    config = undefined;
}
//# sourceMappingURL=env.js.map