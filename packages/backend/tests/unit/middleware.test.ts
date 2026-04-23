import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { ZodError, z } from "zod";
import { errorHandler } from "../../src/middleware/error.middleware.js";
import { validate } from "../../src/middleware/validate.middleware.js";
import { AppError } from "../../src/services/auth.service.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe("Error Middleware", () => {
  it("should handle ZodError with 400 status", async () => {
    const app = createTestApp();
    app.get("/test", (_req, _res) => {
      throw new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string, received number",
        },
      ]);
    });
    app.use(errorHandler);

    const res = await request(app).get("/test");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toHaveLength(1);
    expect(res.body.error.details[0].field).toBe("email");
  });

  it("should handle AppError with custom status", async () => {
    const app = createTestApp();
    app.get("/test", (_req, _res) => {
      throw new AppError("Not found", "NOT_FOUND", 404);
    });
    app.use(errorHandler);

    const res = await request(app).get("/test");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toBe("Not found");
  });

  it("should handle unknown errors with 500 status", async () => {
    const app = createTestApp();
    app.get("/test", (_req, _res) => {
      throw new Error("Something broke");
    });
    app.use(errorHandler);

    const res = await request(app).get("/test");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    // Should not leak error details
    expect(res.body.error.message).not.toContain("Something broke");
  });
});

describe("Validate Middleware", () => {
  it("should parse and replace body with validated data", async () => {
    const app = createTestApp();
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    app.post("/test", validate({ body: TestSchema }), (req, res) => {
      res.json({ data: req.body });
    });
    app.use(errorHandler);

    const res = await request(app)
      .post("/test")
      .send({ name: "John", age: 30 });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("John");
    expect(res.body.data.age).toBe(30);
  });

  it("should reject invalid body", async () => {
    const app = createTestApp();
    const TestSchema = z.object({
      name: z.string().min(1),
    });

    app.post("/test", validate({ body: TestSchema }), (req, res) => {
      res.json({ data: req.body });
    });
    app.use(errorHandler);

    const res = await request(app).post("/test").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should validate query parameters", async () => {
    const app = createTestApp();
    const QuerySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
    });

    app.get("/test", validate({ query: QuerySchema }), (req, res) => {
      res.json({ page: (req.query as any).page });
    });
    app.use(errorHandler);

    const res = await request(app).get("/test?page=5");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(5);
  });
});
