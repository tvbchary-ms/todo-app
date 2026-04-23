import type { RegisterInput, LoginInput } from "@todo/shared";
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export declare class AuthService {
    register(input: RegisterInput): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: "admin" | "user";
            createdAt: string;
            updatedAt: string;
        };
        token: string;
    }>;
    login(input: LoginInput): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: "admin" | "user";
            createdAt: string;
            updatedAt: string;
        };
        token: string;
    }>;
    logout(token: string, userId: string): Promise<void>;
    validateToken(token: string): Promise<TokenPayload>;
    getCurrentUser(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: "admin" | "user";
        createdAt: string;
        updatedAt: string;
    }>;
    private generateToken;
    private sanitizeUser;
    private auditLog;
}
export declare class AppError extends Error {
    code: string;
    statusCode: number;
    details?: Array<{
        field?: string;
        message: string;
    }> | undefined;
    constructor(message: string, code: string, statusCode: number, details?: Array<{
        field?: string;
        message: string;
    }> | undefined);
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map