/**
 * Unit tests for logger
 * Requirements: 7.1, 7.2, 7.5
 */

import { logger } from '../logger'

describe('Logger', () => {
     const originalEnv = process.env.NODE_ENV
     const originalConsoleLog = console.log

     let consoleOutput: any[] = []

     beforeEach(() => {
          consoleOutput = []
          console.log = jest.fn((...args: any[]) => {
               consoleOutput.push(args[0])
          })
     })

     afterEach(() => {
          console.log = originalConsoleLog
     })

     afterAll(() => {
          process.env.NODE_ENV = originalEnv
     })

     describe('JSON format in production', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'production'
          })

          it('should output JSON format for info logs', () => {
               logger.info('Test message', { userId: '123' })

               expect(consoleOutput).toHaveLength(1)
               const parsed = JSON.parse(consoleOutput[0])

               expect(parsed.level).toBe('info')
               expect(parsed.message).toBe('Test message')
               expect(parsed.timestamp).toBeDefined()
               expect(parsed.context).toEqual({ userId: '123' })
          })

          it('should output JSON format for error logs', () => {
               const error = new Error('Test error')
               logger.error('Error occurred', error, { path: '/api/test' })

               expect(consoleOutput).toHaveLength(1)
               const parsed = JSON.parse(consoleOutput[0])

               expect(parsed.level).toBe('error')
               expect(parsed.message).toBe('Error occurred')
               expect(parsed.timestamp).toBeDefined()
               expect(parsed.context).toEqual({ path: '/api/test' })
               expect(parsed.error).toBeDefined()
               expect(parsed.error.name).toBe('Error')
               expect(parsed.error.message).toBe('Test error')
               expect(parsed.error.stack).toBeDefined()
          })

          it('should output valid JSON that can be parsed', () => {
               logger.info('Test message')

               expect(() => JSON.parse(consoleOutput[0])).not.toThrow()
          })

          it('should include all required fields in JSON', () => {
               logger.warn('Warning message', { requestId: 'req-123' })

               const parsed = JSON.parse(consoleOutput[0])

               expect(parsed).toHaveProperty('timestamp')
               expect(parsed).toHaveProperty('level')
               expect(parsed).toHaveProperty('message')
               expect(parsed).toHaveProperty('context')
          })
     })

     describe('formatted output in development', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'development'
          })

          it('should output formatted text for info logs', () => {
               logger.info('Test message', { userId: '123' })

               expect(consoleOutput).toHaveLength(1)
               expect(consoleOutput[0]).toContain('INFO')
               expect(consoleOutput[0]).toContain('Test message')
               expect(consoleOutput[0]).toContain('userId')
          })

          it('should output formatted text for error logs', () => {
               const error = new Error('Test error')
               logger.error('Error occurred', error, { path: '/api/test' })

               expect(consoleOutput).toHaveLength(1)
               expect(consoleOutput[0]).toContain('ERROR')
               expect(consoleOutput[0]).toContain('Error occurred')
               expect(consoleOutput[0]).toContain('Test error')
               expect(consoleOutput[0]).toContain('path')
          })

          it('should include timestamp in formatted output', () => {
               logger.info('Test message')

               expect(consoleOutput[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
          })

          it('should use color codes for different log levels', () => {
               logger.debug('Debug message')
               logger.info('Info message')
               logger.warn('Warning message')
               const error = new Error('Test error')
               logger.error('Error message', error)

               expect(consoleOutput).toHaveLength(4)
               // Color codes are ANSI escape sequences
               expect(consoleOutput[0]).toContain('\x1b[') // Debug (cyan)
               expect(consoleOutput[1]).toContain('\x1b[') // Info (green)
               expect(consoleOutput[2]).toContain('\x1b[') // Warn (yellow)
               expect(consoleOutput[3]).toContain('\x1b[') // Error (red)
          })
     })

     describe('all log levels work', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'production'
          })

          it('should log debug messages', () => {
               logger.debug('Debug message', { detail: 'test' })

               expect(consoleOutput).toHaveLength(1)
               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.level).toBe('debug')
               expect(parsed.message).toBe('Debug message')
          })

          it('should log info messages', () => {
               logger.info('Info message', { detail: 'test' })

               expect(consoleOutput).toHaveLength(1)
               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.level).toBe('info')
               expect(parsed.message).toBe('Info message')
          })

          it('should log warn messages', () => {
               logger.warn('Warning message', { detail: 'test' })

               expect(consoleOutput).toHaveLength(1)
               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.level).toBe('warn')
               expect(parsed.message).toBe('Warning message')
          })

          it('should log error messages', () => {
               const error = new Error('Test error')
               logger.error('Error message', error, { detail: 'test' })

               expect(consoleOutput).toHaveLength(1)
               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.level).toBe('error')
               expect(parsed.message).toBe('Error message')
          })
     })

     describe('context is included', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'production'
          })

          it('should include context in log entry', () => {
               const context = {
                    userId: '123',
                    requestId: 'req-456',
                    path: '/api/test',
                    method: 'POST'
               }

               logger.info('Test message', context)

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.context).toEqual(context)
          })

          it('should handle empty context', () => {
               logger.info('Test message', {})

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.context).toEqual({})
          })

          it('should handle undefined context', () => {
               logger.info('Test message')

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.context).toBeUndefined()
          })

          it('should handle complex context objects', () => {
               const context = {
                    user: {
                         id: '123',
                         name: 'Test User'
                    },
                    metadata: {
                         tags: ['tag1', 'tag2'],
                         count: 42
                    }
               }

               logger.info('Test message', context)

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.context).toEqual(context)
          })

          it('should include custom fields in context', () => {
               logger.info('Test message', {
                    customField1: 'value1',
                    customField2: 123,
                    customField3: true
               })

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.context.customField1).toBe('value1')
               expect(parsed.context.customField2).toBe(123)
               expect(parsed.context.customField3).toBe(true)
          })
     })

     describe('error details', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'production'
          })

          it('should include error name in log entry', () => {
               const error = new Error('Test error')
               logger.error('Error occurred', error)

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.error.name).toBe('Error')
          })

          it('should include error message in log entry', () => {
               const error = new Error('Test error message')
               logger.error('Error occurred', error)

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.error.message).toBe('Test error message')
          })

          it('should include error stack trace in log entry', () => {
               const error = new Error('Test error')
               logger.error('Error occurred', error)

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.error.stack).toBeDefined()
               expect(parsed.error.stack).toContain('Error: Test error')
          })

          it('should handle custom error types', () => {
               class CustomError extends Error {
                    constructor(message: string) {
                         super(message)
                         this.name = 'CustomError'
                    }
               }

               const error = new CustomError('Custom error message')
               logger.error('Error occurred', error)

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.error.name).toBe('CustomError')
               expect(parsed.error.message).toBe('Custom error message')
          })
     })

     describe('timestamp format', () => {
          beforeEach(() => {
               process.env.NODE_ENV = 'production'
          })

          it('should include timestamp in ISO format', () => {
               logger.info('Test message')

               const parsed = JSON.parse(consoleOutput[0])
               expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
          })

          it('should have recent timestamp', () => {
               const before = new Date().toISOString()
               logger.info('Test message')
               const after = new Date().toISOString()

               const parsed = JSON.parse(consoleOutput[0])
               // Compare as strings since timestamps are ISO strings
               expect(parsed.timestamp >= before).toBe(true)
               expect(parsed.timestamp <= after).toBe(true)
          })
     })
})
