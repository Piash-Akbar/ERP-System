export class ApiError extends Error {
  constructor(message: string, public status = 400, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found', details?: unknown) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, details);
    this.name = 'ValidationError';
  }
}
