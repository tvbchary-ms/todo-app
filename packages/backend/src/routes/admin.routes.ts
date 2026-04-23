import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  AdminResetPasswordSchema,
  AdminUpdateUserSchema,
  AdminPaginationSchema,
} from "@todo/shared";
import { authMiddleware, requireAdmin, validate } from "../middleware/index.js";
import { adminService } from "../services/index.js";

const router: IRouter = Router();

router.use(authMiddleware, requireAdmin);

const IdParamSchema = z.object({ id: z.string().uuid("Invalid ID") });

// ── Stats ───────────────────────────────────────────────────

router.get("/stats", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await adminService.getStats() });
  } catch (err) { next(err); }
});

// ── Users ───────────────────────────────────────────────────

router.get(
  "/users",
  async (_req, res, next) => {
    try {
      res.json({ success: true, data: await adminService.listUsers() });
    } catch (err) { next(err); }
  }
);

router.patch(
  "/users/:id",
  validate({ params: IdParamSchema, body: AdminUpdateUserSchema }),
  async (req, res, next) => {
    try {
      const updated = await adminService.updateUser(
        req.user!.userId,
        req.params.id as string,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  }
);

router.post(
  "/users/:id/reset-password",
  validate({ params: IdParamSchema, body: AdminResetPasswordSchema }),
  async (req, res, next) => {
    try {
      await adminService.resetPassword(
        req.user!.userId,
        req.params.id as string,
        req.body.newPassword
      );
      res.json({ success: true, data: { message: "Password reset" } });
    } catch (err) { next(err); }
  }
);

router.delete(
  "/users/:id",
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      await adminService.deleteUser(req.user!.userId, req.params.id as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }
);

// ── Sessions ────────────────────────────────────────────────

router.get(
  "/sessions",
  validate({ query: AdminPaginationSchema }),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await adminService.listSessions(page, limit);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }
);

router.delete(
  "/sessions/:id",
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      await adminService.revokeSession(req.user!.userId, req.params.id as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }
);

// ── Audit Logs ──────────────────────────────────────────────

router.get(
  "/audit-logs",
  validate({ query: AdminPaginationSchema }),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await adminService.listAuditLogs(page, limit);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }
);

export default router;
