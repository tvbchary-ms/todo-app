import bcrypt from "bcryptjs";
import { asc, desc, eq, gt, gte, sql, and, isNull } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { AppError } from "./auth.service.js";

const SALT_ROUNDS = 12;

export class AdminService {
  // ── Stats ──────────────────────────────────────────────────

  async getStats() {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [[{ totalUsers }], [{ activeSessions }], [{ auditToday }]] =
      await Promise.all([
        db.select({ totalUsers: sql<number>`count(*)::int` }).from(schema.users),
        db
          .select({ activeSessions: sql<number>`count(*)::int` })
          .from(schema.sessions)
          .where(gt(schema.sessions.expiresAt, now)),
        db
          .select({ auditToday: sql<number>`count(*)::int` })
          .from(schema.auditLogs)
          .where(gte(schema.auditLogs.createdAt, todayStart)),
      ]);

    return { totalUsers, activeSessions, auditToday };
  }

  // ── Users ──────────────────────────────────────────────────

  async listUsers() {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .orderBy(asc(schema.users.createdAt));

    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));
  }

  async updateUser(
    actingAdminId: string,
    targetUserId: string,
    updates: { name?: string; role?: "admin" | "user" }
  ) {
    const db = getDb();

    if (updates.role === "user" && actingAdminId === targetUserId) {
      throw new AppError("Cannot demote your own admin account", "FORBIDDEN", 403);
    }

    const [target] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, targetUserId))
      .limit(1);

    if (!target) throw new AppError("User not found", "NOT_FOUND", 404);

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, targetUserId))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    await db.insert(schema.auditLogs).values({
      userId: actingAdminId,
      action: "user.updated",
      entity: "user",
      entityId: targetUserId,
      metadata: { fields: Object.keys(updates) },
    });

    logger.info({ adminId: actingAdminId, targetUserId, updates }, "Admin updated user");

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async resetPassword(
    actingAdminId: string,
    targetUserId: string,
    newPassword: string
  ) {
    const db = getDb();

    const [target] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, targetUserId))
      .limit(1);

    if (!target) throw new AppError("User not found", "NOT_FOUND", 404);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, targetUserId));

    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, targetUserId));

    await db.insert(schema.auditLogs).values({
      userId: actingAdminId,
      action: "user.password_reset",
      entity: "user",
      entityId: targetUserId,
      metadata: { by: "admin" },
    });

    logger.info({ adminId: actingAdminId, targetUserId }, "Admin reset user password");
  }

  async deleteUser(actingAdminId: string, targetUserId: string) {
    const db = getDb();

    if (actingAdminId === targetUserId) {
      throw new AppError("Cannot delete your own admin account", "FORBIDDEN", 403);
    }

    const [target] = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, targetUserId))
      .limit(1);

    if (!target) throw new AppError("User not found", "NOT_FOUND", 404);

    // Audit log before deletion (userId FK will be set null on cascade)
    await db.insert(schema.auditLogs).values({
      userId: actingAdminId,
      action: "user.deleted",
      entity: "user",
      entityId: targetUserId,
      metadata: { email: target.email },
    });

    await db.delete(schema.users).where(eq(schema.users.id, targetUserId));

    logger.info({ adminId: actingAdminId, targetUserId }, "Admin deleted user");
  }

  // ── Sessions ───────────────────────────────────────────────

  async listSessions(page: number, limit: number) {
    const db = getDb();
    const offset = (page - 1) * limit;
    const now = new Date();

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: schema.sessions.id,
          userId: schema.sessions.userId,
          userEmail: schema.users.email,
          expiresAt: schema.sessions.expiresAt,
          createdAt: schema.sessions.createdAt,
        })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .where(gt(schema.sessions.expiresAt, now))
        .orderBy(desc(schema.sessions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.sessions)
        .where(gt(schema.sessions.expiresAt, now)),
    ]);

    return {
      data: rows.map((s) => ({
        id: s.id,
        userId: s.userId,
        userEmail: s.userEmail,
        expiresAt: s.expiresAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      total,
    };
  }

  async revokeSession(actingAdminId: string, sessionId: string) {
    const db = getDb();

    const [session] = await db
      .select({ id: schema.sessions.id, userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .limit(1);

    if (!session) throw new AppError("Session not found", "NOT_FOUND", 404);

    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));

    await db.insert(schema.auditLogs).values({
      userId: actingAdminId,
      action: "session.revoked",
      entity: "session",
      entityId: sessionId,
      metadata: { targetUserId: session.userId },
    });

    logger.info({ adminId: actingAdminId, sessionId }, "Admin revoked session");
  }

  // ── Audit Logs ─────────────────────────────────────────────

  async listAuditLogs(page: number, limit: number) {
    const db = getDb();
    const offset = (page - 1) * limit;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: schema.auditLogs.id,
          userId: schema.auditLogs.userId,
          userEmail: schema.users.email,
          action: schema.auditLogs.action,
          entity: schema.auditLogs.entity,
          entityId: schema.auditLogs.entityId,
          metadata: schema.auditLogs.metadata,
          createdAt: schema.auditLogs.createdAt,
        })
        .from(schema.auditLogs)
        .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.auditLogs),
    ]);

    return {
      data: rows.map((log) => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.userEmail ?? "(deleted user)",
        action: log.action,
        entity: log.entity,
        // Strip metadata for todo actions to keep user content private
        metadata: log.action.startsWith("todo.") ? null : log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
    };
  }
}

export const adminService = new AdminService();
