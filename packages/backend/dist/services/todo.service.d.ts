import type { CreateTodoInput, UpdateTodoInput, TodoQueryInput } from "@todo/shared";
export declare class TodoService {
    list(userId: string, query: TodoQueryInput): Promise<{
        data: {
            id: string;
            userId: string;
            title: string;
            description: string | null;
            status: "pending" | "in_progress" | "completed" | "cancelled";
            priority: "low" | "medium" | "high" | "urgent";
            dueDate: string | null;
            createdAt: string;
            updatedAt: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getById(userId: string, todoId: string): Promise<{
        id: string;
        userId: string;
        title: string;
        description: string | null;
        status: "pending" | "in_progress" | "completed" | "cancelled";
        priority: "low" | "medium" | "high" | "urgent";
        dueDate: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    create(userId: string, input: CreateTodoInput): Promise<{
        id: string;
        userId: string;
        title: string;
        description: string | null;
        status: "pending" | "in_progress" | "completed" | "cancelled";
        priority: "low" | "medium" | "high" | "urgent";
        dueDate: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    update(userId: string, todoId: string, input: UpdateTodoInput): Promise<{
        id: string;
        userId: string;
        title: string;
        description: string | null;
        status: "pending" | "in_progress" | "completed" | "cancelled";
        priority: "low" | "medium" | "high" | "urgent";
        dueDate: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    delete(userId: string, todoId: string): Promise<void>;
    private serializeTodo;
}
export declare const todoService: TodoService;
//# sourceMappingURL=todo.service.d.ts.map