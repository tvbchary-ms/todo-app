import { Router } from "express";
import { getDb } from "../db/index.js";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
const router = Router();
/**
 * GET /health
 * Health check endpoint for load balancers and monitoring
 */
router.get("/health", async (_req, res) => {
    const checks = {};
    let healthy = true;
    // Database check
    try {
        const db = getDb();
        await db.execute(sql `SELECT 1`);
        checks.database = "ok";
    }
    catch (err) {
        checks.database = "error";
        healthy = false;
        logger.error({ err }, "Health check: database connection failed");
    }
    // Memory check (fail if >90% of heap used)
    const mem = process.memoryUsage();
    const heapUsedPct = (mem.heapUsed / mem.heapTotal) * 100;
    checks.memory = heapUsedPct < 90 ? "ok" : "warning";
    const status = healthy ? 200 : 503;
    res.status(status).json({
        status: healthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version ?? "1.0.0",
        checks,
        memory: {
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            rss: Math.round(mem.rss / 1024 / 1024),
        },
    });
});
/**
 * GET /ready
 * Readiness probe — returns 200 only when the app can serve traffic
 */
router.get("/ready", async (_req, res) => {
    try {
        const db = getDb();
        await db.execute(sql `SELECT 1`);
        res.json({ status: "ready" });
    }
    catch {
        res.status(503).json({ status: "not ready" });
    }
});
export default router;
//# sourceMappingURL=health.routes.js.map