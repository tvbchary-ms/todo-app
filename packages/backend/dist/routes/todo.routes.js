import { Router } from "express";
import { z } from "zod";
import { CreateTodoSchema, UpdateTodoSchema, TodoQuerySchema } from "@todo/shared";
import { authMiddleware, validate } from "../middleware/index.js";
import { todoService } from "../services/index.js";
const router = Router();
// All todo routes require authentication
router.use(authMiddleware);
const IdParamSchema = z.object({
    id: z.string().uuid("Invalid todo ID"),
});
/**
 * GET /api/todos
 * List todos for the authenticated user with filtering, search, and pagination
 */
router.get("/", validate({ query: TodoQuerySchema }), async (req, res, next) => {
    try {
        const result = await todoService.list(req.user.userId, req.query);
        res.json({ success: true, ...result });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/todos
 * Create a new todo
 */
router.post("/", validate({ body: CreateTodoSchema }), async (req, res, next) => {
    try {
        const todo = await todoService.create(req.user.userId, req.body);
        res.status(201).json({ success: true, data: todo });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/todos/:id
 * Get a specific todo by ID
 */
router.get("/:id", validate({ params: IdParamSchema }), async (req, res, next) => {
    try {
        const id = req.params.id;
        const todo = await todoService.getById(req.user.userId, id);
        res.json({ success: true, data: todo });
    }
    catch (err) {
        next(err);
    }
});
/**
 * PUT /api/todos/:id
 * Update a todo
 */
router.put("/:id", validate({ params: IdParamSchema, body: UpdateTodoSchema }), async (req, res, next) => {
    try {
        const id = req.params.id;
        const todo = await todoService.update(req.user.userId, id, req.body);
        res.json({ success: true, data: todo });
    }
    catch (err) {
        next(err);
    }
});
/**
 * DELETE /api/todos/:id
 * Delete a todo
 */
router.delete("/:id", validate({ params: IdParamSchema }), async (req, res, next) => {
    try {
        const id = req.params.id;
        await todoService.delete(req.user.userId, id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
export default router;
//# sourceMappingURL=todo.routes.js.map