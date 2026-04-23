import { describe, it, expect } from "vitest";
import {
  RegisterSchema,
  LoginSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoQuerySchema,
  TodoStatus,
  TodoPriority,
  UserRole,
} from "@todo/shared";

describe("Shared Schemas", () => {
  // ─── RegisterSchema ─────────────────────────────────────────
  describe("RegisterSchema", () => {
    it("should validate a correct registration input", () => {
      const input = {
        email: "test@example.com",
        password: "Password1",
        name: "Test User",
      };
      const result = RegisterSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const input = { email: "not-an-email", password: "Password1", name: "Test" };
      const result = RegisterSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject weak password (no uppercase)", () => {
      const input = { email: "test@example.com", password: "password1", name: "Test" };
      const result = RegisterSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject weak password (no number)", () => {
      const input = { email: "test@example.com", password: "Password", name: "Test" };
      const result = RegisterSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const input = { email: "test@example.com", password: "Pass1", name: "Test" };
      const result = RegisterSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = { email: "test@example.com", password: "Password1", name: "" };
      const result = RegisterSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  // ─── LoginSchema ────────────────────────────────────────────
  describe("LoginSchema", () => {
    it("should validate a correct login input", () => {
      const input = { email: "test@example.com", password: "Password1" };
      const result = LoginSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const input = { email: "test@example.com", password: "" };
      const result = LoginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  // ─── CreateTodoSchema ───────────────────────────────────────
  describe("CreateTodoSchema", () => {
    it("should validate with only required fields", () => {
      const input = { title: "Buy groceries" };
      const result = CreateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("pending");
        expect(result.data.priority).toBe("medium");
      }
    });

    it("should validate with all fields", () => {
      const input = {
        title: "Buy groceries",
        description: "Milk, eggs, bread",
        status: "in_progress",
        priority: "high",
        dueDate: "2024-12-31T23:59:59.000Z",
      };
      const result = CreateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const input = { title: "" };
      const result = CreateTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding max length", () => {
      const input = { title: "a".repeat(501) };
      const result = CreateTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = { title: "Test", status: "invalid" };
      const result = CreateTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  // ─── UpdateTodoSchema ──────────────────────────────────────
  describe("UpdateTodoSchema", () => {
    it("should validate partial update", () => {
      const input = { title: "Updated title" };
      const result = UpdateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should allow null dueDate (clearing the field)", () => {
      const input = { dueDate: null };
      const result = UpdateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate empty object (no-op update)", () => {
      const result = UpdateTodoSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  // ─── TodoQuerySchema ───────────────────────────────────────
  describe("TodoQuerySchema", () => {
    it("should apply defaults", () => {
      const result = TodoQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe("createdAt");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("should coerce string numbers", () => {
      const result = TodoQuerySchema.safeParse({ page: "3", limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should reject limit over 100", () => {
      const result = TodoQuerySchema.safeParse({ limit: "200" });
      expect(result.success).toBe(false);
    });

    it("should filter by status", () => {
      const result = TodoQuerySchema.safeParse({ status: "completed" });
      expect(result.success).toBe(true);
    });
  });

  // ─── Enums ──────────────────────────────────────────────────
  describe("Enums", () => {
    it("should validate TodoStatus values", () => {
      expect(TodoStatus.safeParse("pending").success).toBe(true);
      expect(TodoStatus.safeParse("in_progress").success).toBe(true);
      expect(TodoStatus.safeParse("completed").success).toBe(true);
      expect(TodoStatus.safeParse("cancelled").success).toBe(true);
      expect(TodoStatus.safeParse("invalid").success).toBe(false);
    });

    it("should validate TodoPriority values", () => {
      expect(TodoPriority.safeParse("low").success).toBe(true);
      expect(TodoPriority.safeParse("urgent").success).toBe(true);
      expect(TodoPriority.safeParse("invalid").success).toBe(false);
    });

    it("should validate UserRole values", () => {
      expect(UserRole.safeParse("admin").success).toBe(true);
      expect(UserRole.safeParse("user").success).toBe(true);
      expect(UserRole.safeParse("superadmin").success).toBe(false);
    });
  });
});
