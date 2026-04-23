import { z } from "zod";

// ─── User Schemas ──────────────────────────────────────────────

export const UserRole = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof UserRole>;

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(1, "Name is required").max(255),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(4).max(128),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: z.string().min(4).max(128),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const AdminResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(128, "Password must be at most 128 characters"),
});
export type AdminResetPasswordInput = z.infer<typeof AdminResetPasswordSchema>;

export const AdminUpdateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(["admin", "user"]).optional(),
}).refine((d) => d.name !== undefined || d.role !== undefined, {
  message: "At least one field (name or role) must be provided",
});
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;

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
export type UserResponse = z.infer<typeof UserResponseSchema>;

// ─── Todo Schemas ──────────────────────────────────────────────

export const TodoStatus = z.enum(["pending", "in_progress", "completed", "cancelled"]);
export type TodoStatus = z.infer<typeof TodoStatus>;

export const TodoPriority = z.enum(["low", "medium", "high", "urgent"]);
export type TodoPriority = z.infer<typeof TodoPriority>;

export const CreateTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  status: TodoStatus.default("pending"),
  priority: TodoPriority.default("medium"),
  dueDate: z.string().datetime().optional(),
});
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: TodoStatus.optional(),
  priority: TodoPriority.optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

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
export type TodoResponse = z.infer<typeof TodoResponseSchema>;

// ─── Query Schemas ─────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export const TodoQuerySchema = PaginationSchema.extend({
  status: TodoStatus.optional(),
  priority: TodoPriority.optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type TodoQueryInput = z.infer<typeof TodoQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
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
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
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
export type AuditAction = z.infer<typeof AuditAction>;
