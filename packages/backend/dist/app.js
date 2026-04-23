import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getConfig } from "./config/index.js";
import { requestLogger, errorHandler } from "./middleware/index.js";
import { authRoutes, todoRoutes, healthRoutes } from "./routes/index.js";
import { metricsMiddleware, metricsRoute } from "./lib/metrics.js";
export function createApp() {
    const config = getConfig();
    const app = express();
    // ─── Security ───────────────────────────────────────────────
    app.use(helmet({
        contentSecurityPolicy: config.NODE_ENV === "production" ? undefined : false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use(cors({
        origin: config.CORS_ORIGIN.split(",").map((s) => s.trim()),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    // Rate limiting
    const limiter = rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: {
                code: "RATE_LIMITED",
                message: "Too many requests, please try again later",
            },
        },
    });
    app.use("/api/", limiter);
    // ─── Body parsing ──────────────────────────────────────────
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: false }));
    // ─── Observability ─────────────────────────────────────────
    app.use(metricsMiddleware);
    app.use(requestLogger);
    // ─── Routes ────────────────────────────────────────────────
    app.use("/", healthRoutes);
    app.get("/metrics", metricsRoute);
    app.use("/api/auth", authRoutes);
    app.use("/api/todos", todoRoutes);
    // ─── 404 ───────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            error: {
                code: "NOT_FOUND",
                message: "Route not found",
            },
        });
    });
    // ─── Error handling ────────────────────────────────────────
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map