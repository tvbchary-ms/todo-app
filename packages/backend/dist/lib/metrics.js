import client from "prom-client";
// Create a Registry
const register = new client.Registry();
// Add default metrics (event loop lag, heap size, etc.)
client.collectDefaultMetrics({ register });
// ─── Custom Metrics ──────────────────────────────────────────
export const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
});
export const httpRequestTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [register],
});
export const httpRequestErrors = new client.Counter({
    name: "http_request_errors_total",
    help: "Total number of HTTP request errors (4xx and 5xx)",
    labelNames: ["method", "route", "status_code"],
    registers: [register],
});
export const activeConnections = new client.Gauge({
    name: "http_active_connections",
    help: "Number of active HTTP connections",
    registers: [register],
});
export const dbQueryDuration = new client.Histogram({
    name: "db_query_duration_seconds",
    help: "Duration of database queries in seconds",
    labelNames: ["operation", "table"],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [register],
});
// ─── Middleware ───────────────────────────────────────────────
export function metricsMiddleware(req, res, next) {
    activeConnections.inc();
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
        const route = req.route?.path ?? req.path;
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode.toString(),
        };
        end(labels);
        httpRequestTotal.inc(labels);
        activeConnections.dec();
        if (res.statusCode >= 400) {
            httpRequestErrors.inc(labels);
        }
    });
    next();
}
// ─── Metrics Endpoint ────────────────────────────────────────
export async function metricsRoute(_req, res) {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
}
export { register };
//# sourceMappingURL=metrics.js.map