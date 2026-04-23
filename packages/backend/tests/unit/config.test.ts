import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConfig, resetConfig } from "../../src/config/env.js";

describe("Config", () => {
  beforeEach(() => {
    resetConfig();
  });

  it("should load valid config from environment", () => {
    const config = getConfig();
    expect(config.PORT).toBe(3099);
    expect(config.NODE_ENV).toBe("test");
    expect(config.JWT_SECRET).toBeDefined();
    expect(config.DATABASE_URL).toContain("postgresql://");
  });

  it("should fail on missing DATABASE_URL", () => {
    const origUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    expect(() => getConfig()).toThrow("process.exit called");

    process.env.DATABASE_URL = origUrl;
    mockExit.mockRestore();
    resetConfig();
  });

  it("should use default values for optional fields", () => {
    const config = getConfig();
    expect(config.JWT_EXPIRES_IN).toBeDefined();
    expect(config.CORS_ORIGIN).toBeDefined();
    expect(config.RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
    expect(config.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
  });
});
