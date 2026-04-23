import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock the database module
vi.mock("../../src/db/index.js", () => ({
  getDb: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
        passwordHash: "$2a$12$mock.hash",
        name: "Test User",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    execute: vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
  }),
  schema: {
    users: { id: "id", email: "email" },
    sessions: { token: "token", userId: "user_id", expiresAt: "expires_at" },
    auditLogs: {},
  },
  closeDb: vi.fn(),
}));

// Must mock before importing the app
vi.mock("../../src/lib/metrics.js", () => ({
  metricsMiddleware: (_req: any, _res: any, next: any) => next(),
  metricsRoute: (_req: any, res: any) => res.send("metrics"),
  register: { metrics: vi.fn(), contentType: "text/plain" },
}));

describe("Health Endpoint", () => {
  it("should return 200 with health status", async () => {
    // Dynamic import after mocks are set up
    const { createApp } = await import("../../src/app.js");
    const app = createApp();

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.database).toBe("ok");
    expect(res.body.memory).toBeDefined();
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return readiness status", async () => {
    const { createApp } = await import("../../src/app.js");
    const app = createApp();

    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const { createApp } = await import("../../src/app.js");
    const app = createApp();

    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("Security Headers", () => {
  it("should set security headers via helmet", async () => {
    const { createApp } = await import("../../src/app.js");
    const app = createApp();

    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});
