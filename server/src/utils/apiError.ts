// server/src/utils/apiError.ts
// Standardized API Error Class

export class ApiError extends Error {
  statusCode: number;
  errors?: any;
  isOperational: boolean;

  constructor(statusCode: number, message: string, errors?: any, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: any) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static internal(message = 'Internal server error', errors?: any) {
    return new ApiError(500, message, errors, false);
  }
}

