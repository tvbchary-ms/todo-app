import { vi, beforeAll, afterAll } from "vitest";

// Mock environment variables for all tests
process.env.DATABASE_URL = "postgresql://todo_user:todo_password@localhost:5432/todo_db_test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long-for-testing";
process.env.JWT_EXPIRES_IN = "1h";
process.env.PORT = "3099";
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX_REQUESTS = "1000";

beforeAll(() => {
  // Suppress pino logs during tests
  vi.mock("../src/lib/logger.js", () => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      child: vi.fn().mockReturnThis(),
    },
  }));
});

afterAll(() => {
  vi.restoreAllMocks();
});
