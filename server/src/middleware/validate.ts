// server/src/middleware/validate.ts
// Request validation middleware supporting Zod schemas for body, query, and params
import { ApiError } from '../utils/apiError.ts';

export interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

export function validate(schema: ValidationSchema) {
  return (req: any, _res: any, next: (err?: any) => void) => {
    try {
      const errors: Record<string, string[]> = {};

      if (schema.body && req.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          errors.body = formatZodErrors(result.error);
        } else {
          req.body = result.data;
        }
      }

      if (schema.query && req.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          errors.query = formatZodErrors(result.error);
        } else {
          req.query = result.data;
        }
      }

      if (schema.params && req.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          errors.params = formatZodErrors(result.error);
        } else {
          req.params = result.data;
        }
      }

      if (Object.keys(errors).length > 0) {
        return next(ApiError.badRequest('Request validation failed', errors));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateBody(bodySchema: any) {
  return validate({ body: bodySchema });
}

export function validateQuery(querySchema: any) {
  return validate({ query: querySchema });
}

function formatZodErrors(error: any): string[] {
  if (error && error.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
  }
  return [error.message || 'Validation error'];
}

