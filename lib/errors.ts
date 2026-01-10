// Custom error classes for the application

export class AppError extends Error {
     constructor(
          message: string,
          public statusCode: number,
          public code: string,
          public details?: unknown
     ) {
          super(message)
          this.name = this.constructor.name
          Error.captureStackTrace(this, this.constructor)
     }
}

export class ValidationError extends AppError {
     constructor(message: string, details?: unknown) {
          super(message, 400, 'VALIDATION_ERROR', details)
     }
}

export class AuthenticationError extends AppError {
     constructor(message: string, details?: unknown) {
          super(message, 401, 'AUTHENTICATION_ERROR', details)
     }
}

export class ExternalAPIError extends AppError {
     constructor(message: string, details?: unknown) {
          super(message, 502, 'EXTERNAL_API_ERROR', details)
     }
}

export class DatabaseError extends AppError {
     constructor(message: string, details?: unknown) {
          super(message, 500, 'DATABASE_ERROR', details)
     }
}
