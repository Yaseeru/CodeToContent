// Custom error classes for the application
import { logger, LogContext } from './logger'

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
export function handleAPIError(error: unknown, requestContext?: LogContext): Response {
     const isDevelopment = process.env.NODE_ENV === 'development'

     // Handle known AppError instances
     if (error instanceof AppError) {
          // Log full error details with stack trace and request context
          logger.error(
               `API Error: ${error.message}`,
               error,
               {
                    ...requestContext,
                    errorCode: error.code,
                    statusCode: error.statusCode,
                    details: error.details,
               }
          )

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
     const errorInstance = error instanceof Error ? error : new Error(String(error))

     // Log full error details with stack trace and request context
     logger.error(
          `Unexpected API Error: ${errorInstance.message}`,
          errorInstance,
          {
               ...requestContext,
               errorCode: 'INTERNAL_ERROR',
               statusCode,
          }
     )

     const responseBody: {
          error: string
          code: string
          timestamp: string
          details?: unknown
          stack?: string
     } = {
          error: isDevelopment
               ? errorInstance.message
               : 'An error occurred while processing your request',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
     }

     // Include details and stack trace in development
     if (isDevelopment) {
          responseBody.details = {
               name: errorInstance.name,
               message: errorInstance.message
          }
          responseBody.stack = errorInstance.stack
     }

     return new Response(JSON.stringify(responseBody), {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
     })
}
