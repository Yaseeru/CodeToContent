/**
 * Unit tests for error handler
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import {
     AppError,
     ValidationError,
     AuthenticationError,
     ExternalAPIError,
     DatabaseError,
     handleAPIError
} from '../errors'

// Mock the logger
jest.mock('../logger', () => ({
     logger: {
          error: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn()
     }
}))

import { logger } from '../logger'

describe('Error Handler', () => {
     const originalEnv = process.env.NODE_ENV

     beforeEach(() => {
          jest.clearAllMocks()
     })

     afterAll(() => {
          process.env.NODE_ENV = originalEnv
     })

     describe('error types', () => {
          it('should create ValidationError with correct properties', () => {
               const error = new ValidationError('Invalid input', { field: 'email' })

               expect(error).toBeInstanceOf(AppError)
               expect(error).toBeInstanceOf(ValidationError)
               expect(error.message).toBe('Invalid input')
               expect(error.statusCode).toBe(400)
               expect(error.code).toBe('VALIDATION_ERROR')
               expect(error.details).toEqual({ field: 'email' })
               expect(error.name).toBe('ValidationError')
          })

          it('should create AuthenticationError with correct properties', () => {
               const error = new AuthenticationError('Not authenticated', { userId: '123' })

               expect(error).toBeInstanceOf(AppError)
               expect(error).toBeInstanceOf(AuthenticationError)
               expect(error.message).toBe('Not authenticated')
               expect(error.statusCode).toBe(401)
               expect(error.code).toBe('AUTHENTICATION_ERROR')
               expect(error.details).toEqual({ userId: '123' })
               expect(error.name).toBe('AuthenticationError')
          })

          it('should create ExternalAPIError with correct properties', () => {
               const error = new ExternalAPIError('GitHub API failed', { api: 'GitHub', status: 503 })

               expect(error).toBeInstanceOf(AppError)
               expect(error).toBeInstanceOf(ExternalAPIError)
               expect(error.message).toBe('GitHub API failed')
               expect(error.statusCode).toBe(502)
               expect(error.code).toBe('EXTERNAL_API_ERROR')
               expect(error.details).toEqual({ api: 'GitHub', status: 503 })
               expect(error.name).toBe('ExternalAPIError')
          })

          it('should create DatabaseError with correct properties', () => {
               const error = new DatabaseError('Connection failed', { host: 'localhost' })

               expect(error).toBeInstanceOf(AppError)
               expect(error).toBeInstanceOf(DatabaseError)
               expect(error.message).toBe('Connection failed')
               expect(error.statusCode).toBe(500)
               expect(error.code).toBe('DATABASE_ERROR')
               expect(error.details).toEqual({ host: 'localhost' })
               expect(error.name).toBe('DatabaseError')
          })

          it('should capture stack trace for errors', () => {
               const error = new ValidationError('Test error')

               expect(error.stack).toBeDefined()
               expect(error.stack).toContain('ValidationError')
          })
     })

     describe('handleAPIError in production', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'production'
          })

          it('should return generic error message for ValidationError', async () => {
               const error = new ValidationError('Invalid input', { field: 'email' })
               const response = handleAPIError(error, { path: '/api/test', method: 'POST' })

               expect(response.status).toBe(400)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('Invalid input')
               expect(body.code).toBe('VALIDATION_ERROR')
               expect(body.timestamp).toBeDefined()
               expect(body.details).toBeUndefined()
               expect(body.stack).toBeUndefined()
          })

          it('should return generic error message for AuthenticationError', async () => {
               const error = new AuthenticationError('Not authenticated')
               const response = handleAPIError(error)

               expect(response.status).toBe(401)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('Not authenticated')
               expect(body.code).toBe('AUTHENTICATION_ERROR')
               expect(body.details).toBeUndefined()
               expect(body.stack).toBeUndefined()
          })

          it('should return generic error message for ExternalAPIError', async () => {
               const error = new ExternalAPIError('API failed', { api: 'GitHub' })
               const response = handleAPIError(error)

               expect(response.status).toBe(502)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('API failed')
               expect(body.code).toBe('EXTERNAL_API_ERROR')
               expect(body.details).toBeUndefined()
               expect(body.stack).toBeUndefined()
          })

          it('should return generic error message for DatabaseError', async () => {
               const error = new DatabaseError('Query failed')
               const response = handleAPIError(error)

               expect(response.status).toBe(500)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('Query failed')
               expect(body.code).toBe('DATABASE_ERROR')
               expect(body.details).toBeUndefined()
               expect(body.stack).toBeUndefined()
          })

          it('should return generic error message for unknown errors', async () => {
               const error = new Error('Something went wrong')
               const response = handleAPIError(error)

               expect(response.status).toBe(500)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('An error occurred while processing your request')
               expect(body.code).toBe('INTERNAL_ERROR')
               expect(body.details).toBeUndefined()
               expect(body.stack).toBeUndefined()
          })
     })

     describe('handleAPIError in development', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'development'
          })

          it('should return detailed error information for ValidationError', async () => {
               const error = new ValidationError('Invalid input', { field: 'email' })
               const response = handleAPIError(error, { path: '/api/test', method: 'POST' })

               expect(response.status).toBe(400)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('Invalid input')
               expect(body.code).toBe('VALIDATION_ERROR')
               expect(body.timestamp).toBeDefined()
               expect(body.details).toEqual({ field: 'email' })
               expect(body.stack).toBeDefined()
               expect(body.stack).toContain('ValidationError')
          })

          it('should return detailed error information for AuthenticationError', async () => {
               const error = new AuthenticationError('Not authenticated', { userId: '123' })
               const response = handleAPIError(error)

               expect(response.status).toBe(401)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('Not authenticated')
               expect(body.code).toBe('AUTHENTICATION_ERROR')
               expect(body.details).toEqual({ userId: '123' })
               expect(body.stack).toBeDefined()
          })

          it('should return detailed error information for unknown errors', async () => {
               const error = new Error('Something went wrong')
               const response = handleAPIError(error)

               expect(response.status).toBe(500)

               const body = JSON.parse(await response.text())
               expect(body.error).toBe('Something went wrong')
               expect(body.code).toBe('INTERNAL_ERROR')
               expect(body.details).toBeDefined()
               expect(body.details).toHaveProperty('name')
               expect(body.details).toHaveProperty('message')
               expect(body.stack).toBeDefined()
          })
     })

     describe('error logging', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'development'
          })

          it('should log error with full details', () => {
               const error = new ValidationError('Invalid input', { field: 'email' })
               const requestContext = { path: '/api/test', method: 'POST', userId: 'user123' }

               handleAPIError(error, requestContext)

               expect(logger.error).toHaveBeenCalledWith(
                    'API Error: Invalid input',
                    error,
                    expect.objectContaining({
                         path: '/api/test',
                         method: 'POST',
                         userId: 'user123',
                         errorCode: 'VALIDATION_ERROR',
                         statusCode: 400,
                         details: { field: 'email' }
                    })
               )
          })

          it('should log error with request context', () => {
               const error = new AuthenticationError('Not authenticated')
               const requestContext = { path: '/api/protected', method: 'GET' }

               handleAPIError(error, requestContext)

               expect(logger.error).toHaveBeenCalledWith(
                    'API Error: Not authenticated',
                    error,
                    expect.objectContaining({
                         path: '/api/protected',
                         method: 'GET',
                         errorCode: 'AUTHENTICATION_ERROR',
                         statusCode: 401
                    })
               )
          })

          it('should log unknown errors with context', () => {
               const error = new Error('Unexpected error')
               const requestContext = { path: '/api/test', method: 'POST' }

               handleAPIError(error, requestContext)

               expect(logger.error).toHaveBeenCalledWith(
                    'Unexpected API Error: Unexpected error',
                    error,
                    expect.objectContaining({
                         path: '/api/test',
                         method: 'POST',
                         errorCode: 'INTERNAL_ERROR',
                         statusCode: 500
                    })
               )
          })

          it('should log error even without request context', () => {
               const error = new ValidationError('Invalid input')

               handleAPIError(error)

               expect(logger.error).toHaveBeenCalledWith(
                    'API Error: Invalid input',
                    error,
                    expect.objectContaining({
                         errorCode: 'VALIDATION_ERROR',
                         statusCode: 400
                    })
               )
          })
     })

     describe('response format', () => {
          it('should include timestamp in ISO format', async () => {
               process.env.NODE_ENV = 'production'
               const error = new ValidationError('Invalid input')
               const response = handleAPIError(error)

               const body = JSON.parse(await response.text())
               expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
          })

          it('should set correct Content-Type header', () => {
               const error = new ValidationError('Invalid input')
               const response = handleAPIError(error)

               expect(response.headers.get('Content-Type')).toBe('application/json')
          })

          it('should return valid JSON', async () => {
               const error = new ValidationError('Invalid input')
               const response = handleAPIError(error)

               const text = await response.text()
               expect(() => JSON.parse(text)).not.toThrow()
          })
     })
})
