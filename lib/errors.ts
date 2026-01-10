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

// Error handler function for API routes
export function handleAPIError(error: unknown): Response {
     const isDevelopment = process.env.NODE_ENV === 'development'

     // Handle known AppError instances
     if (error instanceof AppError) {
          const responseBody: {
               error: string
               code: string
               timestamp: string
               details?: unknown
               stack?: string
          } = {
               error: error.message,
               code: error.code,
               timestamp: new Date().toISOString()
          }

          // Include details and stack trace in development
          if (isDevelopment) {
               responseBody.details = error.details
               responseBody.stack = error.stack
          }

          return new Response(JSON.stringify(responseBody), {
               status: error.statusCode,
               headers: { 'Content-Type': 'application/json' }
          })
     }

     // Handle unknown errors
     const statusCode = 500
     const responseBody: {
          error: string
          code: string
          timestamp: string
          details?: unknown
          stack?: string
     } = {
          error: isDevelopment
               ? (error instanceof Error ? error.message : 'An unexpected error occurred')
               : 'An error occurred while processing your request',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
     }

     // Include details and stack trace in development
     if (isDevelopment && error instanceof Error) {
          responseBody.details = {
               name: error.name,
               message: error.message
          }
          responseBody.stack = error.stack
     }

     return new Response(JSON.stringify(responseBody), {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
     })
}
