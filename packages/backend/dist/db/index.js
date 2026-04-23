import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { getConfig } from "../config/index.js";
import { logger } from "../lib/logger.js";
const { Pool } = pg;
let pool;
let db;
export function getDb() {
    if (!db) {
        const config = getConfig();
        pool = new Pool({
            connectionString: config.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });
        pool.on("error", (err) => {
            logger.error({ err }, "Unexpected PostgreSQL pool error");
        });
        db = drizzle(pool, { schema });
    }
    return db;
}
export async function closeDb() {
    if (pool) {
        await pool.end();
        logger.info("Database pool closed");
    }
}
export { schema };
//# sourceMappingURL=index.js.map