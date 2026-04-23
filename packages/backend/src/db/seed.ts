import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./index.js";
import { logger } from "../lib/logger.js";

const ADMIN_EMAIL = "admin@admin.local";
const ADMIN_PASSWORD = "admin";
const ADMIN_NAME = "admin";
const SALT_ROUNDS = 12;

/**
 * Ensure a default admin user exists. Uses direct bcrypt hashing so it
 * bypasses the public registration password complexity rules.
 */
export async function seedAdminUser(): Promise<void> {
  const db = getDb();

  const [existing] = await db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL))
    .limit(1);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  if (!existing) {
    await db.insert(schema.users).values({
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      role: "admin",
    });
    logger.info({ email: ADMIN_EMAIL }, "Seeded admin user");
    return;
  }

  // If an admin user exists but was downgraded, force it back to admin
  // and re-seed the known password so the documented credentials always work.
  if (existing.role !== "admin") {
    await db
      .update(schema.users)
      .set({ role: "admin", passwordHash })
      .where(eq(schema.users.id, existing.id));
    logger.info({ email: ADMIN_EMAIL }, "Restored admin user role and password");
  }
}
