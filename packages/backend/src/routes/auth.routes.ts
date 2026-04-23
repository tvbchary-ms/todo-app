import { Router, type IRouter } from "express";
import { RegisterSchema, LoginSchema, ChangePasswordSchema, ForgotPasswordSchema } from "@todo/shared";
import { authMiddleware, validate } from "../middleware/index.js";
import { authService } from "../services/index.js";

const router: IRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  "/register",
  validate({ body: RegisterSchema }),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post(
  "/login",
  validate({ body: LoginSchema }),
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/logout
 * Invalidate the current session
 */
router.post("/logout", authMiddleware, async (req, res, next) => {
  try {
    await authService.logout(req.token!, req.user!.userId);
    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/change-password",
  authMiddleware,
  validate({ body: ChangePasswordSchema }),
  async (req, res, next) => {
    try {
      await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
      res.json({ success: true, data: { message: "Password changed" } });
    } catch (err) { next(err); }
  }
);

router.post(
  "/forgot-password",
  validate({ body: ForgotPasswordSchema }),
  async (req, res, next) => {
    try {
      await authService.forgotPassword(req.body.email, req.body.newPassword);
      res.json({ success: true, data: { message: "Password reset" } });
    } catch (err) { next(err); }
  }
);

export default router;
