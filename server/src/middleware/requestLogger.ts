// server/src/middleware/requestLogger.ts
// Request logging middleware with response duration tracking
import { logger } from '../services/logger.ts';

export function requestLogger(req: any, res: any, next: () => void) {
  const start = Date.now();
  const { method, originalUrl, url } = req;
  const path = originalUrl || url;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logMsg = `${method} ${path} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(logMsg);
    } else if (statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
}

