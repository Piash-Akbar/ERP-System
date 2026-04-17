import { ApiError } from './errors';

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };

export function apiOk<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function apiError(err: unknown, details?: unknown): ApiResponse<never> {
  if (err instanceof ApiError) {
    return { success: false, error: err.message, details: err.details ?? details };
  }
  if (err instanceof Error) {
    return { success: false, error: err.message, details };
  }
  if (typeof err === 'string') {
    return { success: false, error: err, details };
  }
  return { success: false, error: 'Unknown error', details: details ?? err };
}
