// server/src/middleware/errorHandler.ts
// Centralized Error Handling Middleware
import { ApiError } from '../utils/apiError.ts';
import { errorResponse } from '../utils/apiResponse.ts';
import { logger } from '../services/logger.ts';

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors;
  } else if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    message = 'Resource with this unique identifier or slug already exists';
  } else if (err.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    message = 'Record not found';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload';
  } else {
    logger.error('Unhandled Server Exception:', err);
    if (process.env.NODE_ENV === 'development') {
      message = err.message || message;
      errors = err.stack;
    }
  }

  res.status(statusCode).json(errorResponse(message, errors));
}

