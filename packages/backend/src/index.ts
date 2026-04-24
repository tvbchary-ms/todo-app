import "./env-setup.js";
import { createApp } from "./app.js";
import { getConfig } from "./config/index.js";
import { getDb, closeDb } from "./db/index.js";
import { seedAdminUser } from "./db/seed.js";
import { logger } from "./lib/logger.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "url";
import { dirname, join } from "path";


const appConfig = getConfig();
const app = createApp();

// ─── Run Migrations ─────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, "db", "migrations");

try {
  logger.info("Running database migrations…");
  await migrate(getDb(), { migrationsFolder });
  logger.info("✅ Migrations complete");
} catch (err) {
  logger.fatal({ err }, "❌ Database migration failed — shutting down");
  process.exit(1);
}

seedAdminUser().catch((err) => {
  logger.error({ err }, "Failed to seed admin user");
});

const server = app.listen(appConfig.PORT, () => {
  logger.info(
    {
      port: appConfig.PORT,
      env: appConfig.NODE_ENV,
    },
    `🚀 Server running on port ${appConfig.PORT}`
  );
});

// ─── Graceful Shutdown ───────────────────────────────────────

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, gracefully shutting down…");

  server.close(async () => {
    logger.info("HTTP server closed");
    await closeDb();
    logger.info("Database connections closed");
    process.exit(0);
  });

  // Force shutdown after 30s
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});
