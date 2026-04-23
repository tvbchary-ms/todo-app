import { eq, and, ilike, sql, asc, desc } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { AppError } from "./auth.service.js";
export class TodoService {
    async list(userId, query) {
        const db = getDb();
        const { page, limit, status, priority, search, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        // Build where conditions
        const conditions = [eq(schema.todos.userId, userId)];
        if (status) {
            conditions.push(eq(schema.todos.status, status));
        }
        if (priority) {
            conditions.push(eq(schema.todos.priority, priority));
        }
        if (search) {
            conditions.push(ilike(schema.todos.title, `%${search}%`));
        }
        const whereClause = and(...conditions);
        // Get sort column
        const sortColumn = {
            createdAt: schema.todos.createdAt,
            updatedAt: schema.todos.updatedAt,
            dueDate: schema.todos.dueDate,
            priority: schema.todos.priority,
        }[sortBy];
        const orderFn = sortOrder === "asc" ? asc : desc;
        // Execute queries in parallel
        const [data, [{ count }]] = await Promise.all([
            db
                .select()
                .from(schema.todos)
                .where(whereClause)
                .orderBy(orderFn(sortColumn))
                .limit(limit)
                .offset(offset),
            db
                .select({ count: sql `count(*)::int` })
                .from(schema.todos)
                .where(whereClause),
        ]);
        return {
            data: data.map(this.serializeTodo),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }
    async getById(userId, todoId) {
        const db = getDb();
        const [todo] = await db
            .select()
            .from(schema.todos)
            .where(and(eq(schema.todos.id, todoId), eq(schema.todos.userId, userId)))
            .limit(1);
        if (!todo) {
            throw new AppError("Todo not found", "NOT_FOUND", 404);
        }
        return this.serializeTodo(todo);
    }
    async create(userId, input) {
        const db = getDb();
        const [todo] = await db
            .insert(schema.todos)
            .values({
            userId,
            title: input.title,
            description: input.description ?? null,
            status: input.status,
            priority: input.priority,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
        })
            .returning();
        // Audit log
        await db.insert(schema.auditLogs).values({
            userId,
            action: "todo.create",
            entity: "todo",
            entityId: todo.id,
            metadata: { title: input.title },
        });
        logger.info({ userId, todoId: todo.id }, "Todo created");
        return this.serializeTodo(todo);
    }
    async update(userId, todoId, input) {
        const db = getDb();
        // Check existence + ownership
        const [existing] = await db
            .select()
            .from(schema.todos)
            .where(and(eq(schema.todos.id, todoId), eq(schema.todos.userId, userId)))
            .limit(1);
        if (!existing) {
            throw new AppError("Todo not found", "NOT_FOUND", 404);
        }
        const updateData = {};
        if (input.title !== undefined)
            updateData.title = input.title;
        if (input.description !== undefined)
            updateData.description = input.description;
        if (input.status !== undefined)
            updateData.status = input.status;
        if (input.priority !== undefined)
            updateData.priority = input.priority;
        if (input.dueDate !== undefined) {
            updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        }
        const [todo] = await db
            .update(schema.todos)
            .set(updateData)
            .where(eq(schema.todos.id, todoId))
            .returning();
        // Audit log
        await db.insert(schema.auditLogs).values({
            userId,
            action: "todo.update",
            entity: "todo",
            entityId: todoId,
            metadata: { changes: Object.keys(updateData) },
        });
        logger.info({ userId, todoId }, "Todo updated");
        return this.serializeTodo(todo);
    }
    async delete(userId, todoId) {
        const db = getDb();
        const [existing] = await db
            .select()
            .from(schema.todos)
            .where(and(eq(schema.todos.id, todoId), eq(schema.todos.userId, userId)))
            .limit(1);
        if (!existing) {
            throw new AppError("Todo not found", "NOT_FOUND", 404);
        }
        await db.delete(schema.todos).where(eq(schema.todos.id, todoId));
        // Audit log
        await db.insert(schema.auditLogs).values({
            userId,
            action: "todo.delete",
            entity: "todo",
            entityId: todoId,
            metadata: { title: existing.title },
        });
        logger.info({ userId, todoId }, "Todo deleted");
    }
    serializeTodo(todo) {
        return {
            id: todo.id,
            userId: todo.userId,
            title: todo.title,
            description: todo.description,
            status: todo.status,
            priority: todo.priority,
            dueDate: todo.dueDate?.toISOString() ?? null,
            createdAt: todo.createdAt.toISOString(),
            updatedAt: todo.updatedAt.toISOString(),
        };
    }
}
export const todoService = new TodoService();
//# sourceMappingURL=todo.service.js.map