import { z } from "zod";
export declare const UserRole: z.ZodEnum<["admin", "user"]>;
export type UserRole = z.infer<typeof UserRole>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    newPassword: string;
}, {
    email: string;
    newPassword: string;
}>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export declare const AdminResetPasswordSchema: z.ZodObject<{
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
}, {
    newPassword: string;
}>;
export type AdminResetPasswordInput = z.infer<typeof AdminResetPasswordSchema>;
export declare const AdminUpdateUserSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "user"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    role?: "admin" | "user" | undefined;
}, {
    name?: string | undefined;
    role?: "admin" | "user" | undefined;
}>, {
    name?: string | undefined;
    role?: "admin" | "user" | undefined;
}, {
    name?: string | undefined;
    role?: "admin" | "user" | undefined;
}>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;
export declare const AdminPaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["admin", "user"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: "admin" | "user";
    id: string;
    createdAt: string;
    updatedAt: string;
}, {
    email: string;
    name: string;
    role: "admin" | "user";
    id: string;
    createdAt: string;
    updatedAt: string;
}>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export declare const TodoStatus: z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>;
export type TodoStatus = z.infer<typeof TodoStatus>;
export declare const TodoPriority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
export type TodoPriority = z.infer<typeof TodoPriority>;
export declare const CreateTodoSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "in_progress" | "completed" | "cancelled";
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    description?: string | undefined;
    dueDate?: string | undefined;
}, {
    title: string;
    status?: "pending" | "in_progress" | "completed" | "cancelled" | undefined;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    dueDate?: string | undefined;
}>;
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export declare const UpdateTodoSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "in_progress" | "completed" | "cancelled" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    dueDate?: string | null | undefined;
}, {
    status?: "pending" | "in_progress" | "completed" | "cancelled" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    dueDate?: string | null | undefined;
}>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export declare const TodoResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
    dueDate: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "in_progress" | "completed" | "cancelled";
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: string | null;
    userId: string;
}, {
    status: "pending" | "in_progress" | "completed" | "cancelled";
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: string | null;
    userId: string;
}>;
export type TodoResponse = z.infer<typeof TodoResponseSchema>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export declare const TodoQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "updatedAt", "dueDate", "priority"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "updatedAt" | "priority" | "dueDate";
    sortOrder: "asc" | "desc";
    status?: "pending" | "in_progress" | "completed" | "cancelled" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    search?: string | undefined;
}, {
    status?: "pending" | "in_progress" | "completed" | "cancelled" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    search?: string | undefined;
    sortBy?: "createdAt" | "updatedAt" | "priority" | "dueDate" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type TodoQueryInput = z.infer<typeof TodoQuerySchema>;
export declare const PaginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}, {
    data: T["_input"][];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const ApiErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodOptional<z.ZodString>;
            message: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            message: string;
            field?: string | undefined;
        }, {
            message: string;
            field?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: {
            message: string;
            field?: string | undefined;
        }[] | undefined;
    }, {
        code: string;
        message: string;
        details?: {
            message: string;
            field?: string | undefined;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        code: string;
        message: string;
        details?: {
            message: string;
            field?: string | undefined;
        }[] | undefined;
    };
}, {
    error: {
        code: string;
        message: string;
        details?: {
            message: string;
            field?: string | undefined;
        }[] | undefined;
    };
}>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export declare const ApiSuccessSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
}>[k_1]; } : never>;
export declare const AuditAction: z.ZodEnum<["user.register", "user.login", "user.logout", "todo.create", "todo.update", "todo.delete"]>;
export type AuditAction = z.infer<typeof AuditAction>;
//# sourceMappingURL=index.d.ts.map