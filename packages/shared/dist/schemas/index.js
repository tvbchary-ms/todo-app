import { z } from "zod";
// ─── User Schemas ──────────────────────────────────────────────
export const UserRole = z.enum(["admin", "user"]);
export const RegisterSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    name: z.string().min(1, "Name is required").max(255),
});
export const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(4).max(128),
});
export const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
    newPassword: z.string().min(4).max(128),
});
export const AdminResetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(4, "Password must be at least 4 characters")
        .max(128, "Password must be at most 128 characters"),
});
export const AdminUpdateUserSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    role: z.enum(["admin", "user"]).optional(),
}).refine((d) => d.name !== undefined || d.role !== undefined, {
    message: "At least one field (name or role) must be provided",
});
export const AdminPaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
export const UserResponseSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: UserRole,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
// ─── Todo Schemas ──────────────────────────────────────────────
export const TodoStatus = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export const TodoPriority = z.enum(["low", "medium", "high", "urgent"]);
export const CreateTodoSchema = z.object({
    title: z.string().min(1, "Title is required").max(500),
    description: z.string().max(5000).optional(),
    status: TodoStatus.default("pending"),
    priority: TodoPriority.default("medium"),
    dueDate: z.string().datetime().optional(),
});
export const UpdateTodoSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    status: TodoStatus.optional(),
    priority: TodoPriority.optional(),
    dueDate: z.string().datetime().nullable().optional(),
});
export const TodoResponseSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    status: TodoStatus,
    priority: TodoPriority,
    dueDate: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
// ─── Query Schemas ─────────────────────────────────────────────
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const TodoQuerySchema = PaginationSchema.extend({
    status: TodoStatus.optional(),
    priority: TodoPriority.optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "priority"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export const PaginatedResponseSchema = (itemSchema) => z.object({
    data: z.array(itemSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});
// ─── API Response Schemas ──────────────────────────────────────
export const ApiErrorSchema = z.object({
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.array(z.object({
            field: z.string().optional(),
            message: z.string(),
        })).optional(),
    }),
});
export const ApiSuccessSchema = (dataSchema) => z.object({
    success: z.literal(true),
    data: dataSchema,
});
// ─── Audit Log Schemas ────────────────────────────────────────
export const AuditAction = z.enum([
    "user.register",
    "user.login",
    "user.logout",
    "todo.create",
    "todo.update",
    "todo.delete",
]);
//# sourceMappingURL=index.js.map