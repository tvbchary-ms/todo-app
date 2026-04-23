import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { getConfig } from "../config/index.js";
import { logger } from "../lib/logger.js";
const SALT_ROUNDS = 12;
export class AuthService {
    async register(input) {
        const db = getDb();
        const config = getConfig();
        // Check if email already exists
        const existing = await db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, input.email))
            .limit(1);
        if (existing.length > 0) {
            throw new AppError("Email already registered", "CONFLICT", 409);
        }
        const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
        const [user] = await db
            .insert(schema.users)
            .values({
            email: input.email,
            passwordHash,
            name: input.name,
        })
            .returning();
        const token = this.generateToken(user);
        // Store session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.insert(schema.sessions).values({
            userId: user.id,
            token,
            expiresAt,
        });
        // Audit log
        await this.auditLog(user.id, "user.register", "user", user.id);
        logger.info({ userId: user.id }, "User registered");
        return { user: this.sanitizeUser(user), token };
    }
    async login(input) {
        const db = getDb();
        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, input.email))
            .limit(1);
        if (!user) {
            throw new AppError("Invalid email or password", "UNAUTHORIZED", 401);
        }
        const validPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!validPassword) {
            throw new AppError("Invalid email or password", "UNAUTHORIZED", 401);
        }
        const token = this.generateToken(user);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.insert(schema.sessions).values({
            userId: user.id,
            token,
            expiresAt,
        });
        await this.auditLog(user.id, "user.login", "user", user.id);
        logger.info({ userId: user.id }, "User logged in");
        return { user: this.sanitizeUser(user), token };
    }
    async logout(token, userId) {
        const db = getDb();
        await db
            .delete(schema.sessions)
            .where(eq(schema.sessions.token, token));
        await this.auditLog(userId, "user.logout", "user", userId);
        logger.info({ userId }, "User logged out");
    }
    async validateToken(token) {
        const config = getConfig();
        const db = getDb();
        try {
            const payload = jwt.verify(token, config.JWT_SECRET);
            // Verify session exists and is not expired
            const [session] = await db
                .select()
                .from(schema.sessions)
                .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, new Date())))
                .limit(1);
            if (!session) {
                throw new AppError("Session expired or invalidated", "UNAUTHORIZED", 401);
            }
            return payload;
        }
        catch (err) {
            if (err instanceof AppError)
                throw err;
            throw new AppError("Invalid token", "UNAUTHORIZED", 401);
        }
    }
    async getCurrentUser(userId) {
        const db = getDb();
        const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, userId))
            .limit(1);
        if (!user) {
            throw new AppError("User not found", "NOT_FOUND", 404);
        }
        return this.sanitizeUser(user);
    }
    generateToken(user) {
        const config = getConfig();
        return jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
    async auditLog(userId, action, entity, entityId) {
        const db = getDb();
        await db.insert(schema.auditLogs).values({
            userId,
            action,
            entity,
            entityId,
        });
    }
}
// ─── Application Error ───────────────────────────────────────
export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "AppError";
    }
}
export const authService = new AuthService();
//# sourceMappingURL=auth.service.js.map