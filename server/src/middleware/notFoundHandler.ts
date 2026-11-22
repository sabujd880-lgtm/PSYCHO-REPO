// server/src/middleware/notFoundHandler.ts
// 404 Route Not Found Middleware
import { ApiError } from '../utils/apiError.ts';

export function notFoundHandler(req: any, _res: any, next: (err: any) => void) {
  const method = req.method;
  const path = req.originalUrl || req.url;
  next(ApiError.notFound(`Route '${method} ${path}' not found on this server`));
}

