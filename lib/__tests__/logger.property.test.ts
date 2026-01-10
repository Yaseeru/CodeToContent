/**
 * Property-Based Tests for Logging
 * Feature: security-and-quality-improvements
 * Requirements: 7.2, 7.3, 7.4, 7.6
 */

import * as fc from 'fast-check'
import { logger, LogContext } from '../logger'

describe('Logging - Property Tests', () => {
     const originalEnv = process.env.NODE_ENV
     const originalConsoleLog = console.log
     let logOutput: string[] = []

     beforeEach(() => {
          logOutput = []
          console.log = jest.fn((message: string) => {
               logOutput.push(message)
          })
     })

     afterEach(() => {
          console.log = originalConsoleLog
     })

     afterAll(() => {
          process.env.NODE_ENV = originalEnv
     })

     /**
      * Property 10: Structured logging completeness
      * Feature: security-and-quality-improvements, Property 10: Structured logging completeness
      * 
      * For any log entry, it should include timestamp, level, message, and context fields
      * in the correct format (JSON in production, formatted in development)
      * 
      * Validates: Requirements 7.2
      */
     test('Property 10: Structured logging completeness', () => {
          const logLevels = ['debug', 'info', 'warn'] as const

          fc.assert(
               fc.property(
                    fc.constantFrom('development', 'production'),
                    fc.constantFrom(...logLevels),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.record({
                         userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                         path: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                         method: fc.option(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { nil: undefined }),
                    }),
                    (nodeEnv, level, message, context) => {
                         process.env.NODE_ENV = nodeEnv
                         logOutput = []

                         // Call the appropriate log method
                         if (level === 'debug') {
                              logger.debug(message, context)
                         } else if (level === 'info') {
                              logger.info(message, context)
                         } else if (level === 'warn') {
                              logger.warn(message, context)
                         }

                         // Verify log was output
                         expect(logOutput.length).toBeGreaterThan(0)

                         if (nodeEnv === 'production') {
                              // Production: should be valid JSON
                              const logEntry = JSON.parse(logOutput[0])
                              expect(logEntry).toHaveProperty('timestamp')
                              expect(logEntry).toHaveProperty('level')
                              expect(logEntry).toHaveProperty('message')
                              expect(logEntry.level).toBe(level)
                              expect(logEntry.message).toBe(message)

                              // Context should be included if provided
                              if (context.userId || context.path || context.method) {
                                   expect(logEntry).toHaveProperty('context')
                              }
                         } else {
                              // Development: should be formatted string
                              const logString = logOutput[0]
                              expect(typeof logString).toBe('string')
                              expect(logString).toContain(level.toUpperCase())
                              expect(logString).toContain(message)
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 11: Request lifecycle logging
      * Feature: security-and-quality-improvements, Property 11: Request lifecycle logging
      * 
      * For any API request, the logger should log both the incoming request
      * (method, path, userId) and the completed response (status, duration)
      * 
      * Validates: Requirements 7.3, 7.4
      */
     test('Property 11: Request lifecycle logging', () => {
          fc.assert(
               fc.property(
                    fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                    fc.integer({ min: 0, max: 5000 }),
                    (method, path, userId, duration) => {
                         process.env.NODE_ENV = 'production'
                         logOutput = []

                         // Log request
                         const requestContext: LogContext = {
                              method,
                              path,
                              userId,
                         }
                         logger.info('Incoming request', requestContext)

                         // Log response
                         const responseContext: LogContext = {
                              method,
                              path,
                              userId,
                              duration,
                         }
                         logger.info('Request completed', responseContext)

                         // Verify both logs were output
                         expect(logOutput.length).toBe(2)

                         // Parse and verify request log
                         const requestLog = JSON.parse(logOutput[0])
                         expect(requestLog.context.method).toBe(method)
                         expect(requestLog.context.path).toBe(path)
                         if (userId) {
                              expect(requestLog.context.userId).toBe(userId)
                         }

                         // Parse and verify response log
                         const responseLog = JSON.parse(logOutput[1])
                         expect(responseLog.context.method).toBe(method)
                         expect(responseLog.context.path).toBe(path)
                         expect(responseLog.context.duration).toBe(duration)
                         if (userId) {
                              expect(responseLog.context.userId).toBe(userId)
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 12: Error logging with stack traces
      * Feature: security-and-quality-improvements, Property 12: Error logging with stack traces
      * 
      * For any error that is logged, the log entry should include the error's
      * stack trace and any additional error context
      * 
      * Validates: Requirements 7.6
      */
     test('Property 12: Error logging with stack traces', () => {
          fc.assert(
               fc.property(
                    fc.constantFrom('development', 'production'),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.record({
                         userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                         path: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                    }),
                    (nodeEnv, message, errorMessage, context) => {
                         process.env.NODE_ENV = nodeEnv
                         logOutput = []

                         // Create an error with a stack trace
                         const error = new Error(errorMessage)

                         // Log the error
                         logger.error(message, error, context)

                         // Verify log was output
                         expect(logOutput.length).toBeGreaterThan(0)

                         if (nodeEnv === 'production') {
                              // Production: should be valid JSON with error details
                              const logEntry = JSON.parse(logOutput[0])
                              expect(logEntry).toHaveProperty('error')
                              expect(logEntry.error).toHaveProperty('name')
                              expect(logEntry.error).toHaveProperty('message')
                              expect(logEntry.error).toHaveProperty('stack')
                              expect(logEntry.error.message).toBe(errorMessage)
                              expect(logEntry.error.stack).toBeTruthy()
                         } else {
                              // Development: should include error details in formatted output
                              const logString = logOutput[0]
                              expect(logString).toContain('ERROR')
                              expect(logString).toContain(message)
                              expect(logString).toContain(errorMessage)
                              expect(logString).toContain('Stack')
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })
})
