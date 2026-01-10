/**
 * Property-Based Tests for Error Handling
 * Feature: security-and-quality-improvements
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import * as fc from 'fast-check'
import {
     AppError,
     ValidationError,
     AuthenticationError,
     ExternalAPIError,
     DatabaseError,
     handleAPIError
} from '../errors'

// Mock logger
jest.mock('../logger', () => ({
     logger: {
          error: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
     }
}))

import { logger } from '../logger'

describe('Error Handling - Property Tests', () => {
     const originalEnv = process.env.NODE_ENV

     beforeEach(() => {
          jest.clearAllMocks()
     })

     afterAll(() => {
          process.env.NODE_ENV = originalEnv
     })

     /**
      * Property 5: Comprehensive error logging
      * Feature: security-and-quality-improvements, Property 5: Comprehensive error logging
      * 
      * For any error that occurs, the error handler should log the full error details
      * including error type, message, stack trace, and request context
      * 
      * Validates: Requirements 4.1, 4.4, 4.5, 4.6
      */
     test('Property 5: Comprehensive error logging', () => {
          const errorTypes = [
               { name: 'ValidationError', create: (msg: string) => new ValidationError(msg, { field: 'test' }) },
               { name: 'AuthenticationError', create: (msg: string) => new AuthenticationError(msg) },
               { name: 'ExternalAPIError', create: (msg: string) => new ExternalAPIError(msg, { api: 'GitHub' }) },
               { name: 'DatabaseError', create: (msg: string) => new DatabaseError(msg) },
               { name: 'Error', create: (msg: string) => new Error(msg) },
          ]

          fc.assert(
               fc.property(
                    fc.constantFrom(...errorTypes),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.record({
                         userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                         path: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                         method: fc.option(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { nil: undefined }),
                    }),
                    (errorType, message, requestContext) => {
                         const error = errorType.create(message)

                         // Call error handler
                         handleAPIError(error, requestContext)

                         // Verify logger.error was called
                         expect(logger.error).toHaveBeenCalled()

                         // Get the call arguments
                         const calls = (logger.error as jest.Mock).mock.calls
                         expect(calls.length).toBeGreaterThan(0)

                         const [logMessage, logError, logContext] = calls[calls.length - 1]

                         // Verify log message is present
                         expect(typeof logMessage).toBe('string')
                         expect(logMessage.length).toBeGreaterThan(0)

                         // Verify error object is logged
                         expect(logError).toBeDefined()
                         expect(logError instanceof Error).toBe(true)

                         // Verify context includes request context
                         expect(logContext).toBeDefined()
                         if (requestContext.userId) {
                              expect(logContext.userId).toBe(requestContext.userId)
                         }
                         if (requestContext.path) {
                              expect(logContext.path).toBe(requestContext.path)
                         }
                         if (requestContext.method) {
                              expect(logContext.method).toBe(requestContext.method)
                         }

                         // Verify context includes error code and status code
                         expect(logContext.errorCode).toBeDefined()
                         expect(logContext.statusCode).toBeDefined()
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 6: Environment-specific error responses
      * Feature: security-and-quality-improvements, Property 6: Environment-specific error responses
      * 
      * For any error in production mode, the API should return a generic error message,
      * while in development mode it should return detailed error information
      * 
      * Validates: Requirements 4.2, 4.3
      */
     test('Property 6: Environment-specific error responses', async () => {
          const errorTypes = [
               { name: 'ValidationError', create: (msg: string) => new ValidationError(msg, { field: 'test' }) },
               { name: 'AuthenticationError', create: (msg: string) => new AuthenticationError(msg) },
               { name: 'ExternalAPIError', create: (msg: string) => new ExternalAPIError(msg, { api: 'GitHub' }) },
               { name: 'DatabaseError', create: (msg: string) => new DatabaseError(msg) },
               { name: 'Error', create: (msg: string) => new Error(msg) },
          ]

          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom('development', 'production'),
                    fc.constantFrom(...errorTypes),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    async (nodeEnv, errorType, message) => {
                         // Set NODE_ENV
                         process.env.NODE_ENV = nodeEnv

                         const error = errorType.create(message)

                         // Call error handler
                         const response = handleAPIError(error)

                         // Parse response body
                         const responseText = await response.text()
                         const responseBody = JSON.parse(responseText)

                         // Verify response structure
                         expect(responseBody).toHaveProperty('error')
                         expect(responseBody).toHaveProperty('code')
                         expect(responseBody).toHaveProperty('timestamp')

                         if (nodeEnv === 'development') {
                              // Development: should include stack trace
                              expect(responseBody).toHaveProperty('stack')

                              // Details should be included if the error has details
                              if (error instanceof AppError && error.details) {
                                   expect(responseBody).toHaveProperty('details')
                              }
                         } else {
                              // Production: should NOT include details and stack for AppErrors
                              // (or should have generic message for unknown errors)
                              if (error instanceof AppError) {
                                   expect(responseBody.details).toBeUndefined()
                                   expect(responseBody.stack).toBeUndefined()
                              } else {
                                   // Unknown errors get generic message in production
                                   expect(responseBody.error).toBe('An error occurred while processing your request')
                                   expect(responseBody.details).toBeUndefined()
                                   expect(responseBody.stack).toBeUndefined()
                              }
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Additional property: Error type categorization
      * 
      * For any error type, the handler should correctly categorize it and
      * return the appropriate status code
      */
     test('Property: Error type categorization', async () => {
          const errorTypesWithStatus = [
               { create: (msg: string) => new ValidationError(msg), expectedStatus: 400, expectedCode: 'VALIDATION_ERROR' },
               { create: (msg: string) => new AuthenticationError(msg), expectedStatus: 401, expectedCode: 'AUTHENTICATION_ERROR' },
               { create: (msg: string) => new ExternalAPIError(msg), expectedStatus: 502, expectedCode: 'EXTERNAL_API_ERROR' },
               { create: (msg: string) => new DatabaseError(msg), expectedStatus: 500, expectedCode: 'DATABASE_ERROR' },
               { create: (msg: string) => new Error(msg), expectedStatus: 500, expectedCode: 'INTERNAL_ERROR' },
          ]

          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom(...errorTypesWithStatus),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    async (errorTypeInfo, message) => {
                         const error = errorTypeInfo.create(message)

                         // Call error handler
                         const response = handleAPIError(error)

                         // Verify status code
                         expect(response.status).toBe(errorTypeInfo.expectedStatus)

                         // Parse response body
                         const responseText = await response.text()
                         const responseBody = JSON.parse(responseText)

                         // Verify error code
                         expect(responseBody.code).toBe(errorTypeInfo.expectedCode)
                    }
               ),
               { numRuns: 100 }
          )
     })
})
