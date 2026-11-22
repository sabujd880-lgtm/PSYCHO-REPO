// server/src/utils/apiResponse.ts
// Standardized API JSON Response Formatter

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  pagination?: PaginationMeta;
  message?: string;
  timestamp: string;
}

export function successResponse<T>(data: T, message?: string, pagination?: PaginationMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
    ...(message ? { message } : {}),
    timestamp: new Date().toISOString()
  };
}

export function errorResponse(message: string, errors?: any): ApiResponse {
  return {
    success: false,
    message,
    ...(errors ? { errors } : {}),
    timestamp: new Date().toISOString()
  };
}

