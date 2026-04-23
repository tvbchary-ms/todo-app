import { authService, AppError } from "../services/index.js";
export function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Missing or invalid authorization header", "UNAUTHORIZED", 401);
    }
    const token = authHeader.slice(7);
    authService
        .validateToken(token)
        .then((payload) => {
        req.user = payload;
        req.token = token;
        next();
    })
        .catch(next);
}
//# sourceMappingURL=auth.middleware.js.map