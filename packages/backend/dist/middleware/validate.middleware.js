/**
 * Middleware factory that validates request body, query, and params against Zod schemas.
 * Parsed values replace the original req properties so downstream handlers get typed data.
 */
export function validate(schemas) {
    return (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map