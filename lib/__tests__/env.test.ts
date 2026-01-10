/**
 * Unit tests for environment validator
 * Requirements: 1.1, 1.2
 */

import { validateEnv, EnvConfig } from '../env'

describe('Environment Validator', () => {
     const originalEnv = process.env

     beforeEach(() => {
          // Reset process.env before each test
          jest.resetModules()
          process.env = { ...originalEnv }
     })

     afterAll(() => {
          // Restore original environment
          process.env = originalEnv
     })

     describe('with all variables present', () => {
          it('should validate successfully when all required variables are set', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               const config = validateEnv()

               expect(config).toEqual({
                    GITHUB_ID: 'test-github-id',
                    GITHUB_SECRET: 'test-github-secret',
                    AUTH_SECRET: 'test-auth-secret',
                    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                    GEMINI_API_KEY: 'test-gemini-key',
                    NODE_ENV: 'development',
               })
          })

          it('should accept production NODE_ENV', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'production'

               const config = validateEnv()

               expect(config.NODE_ENV).toBe('production')
          })

          it('should accept test NODE_ENV', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'test'

               const config = validateEnv()

               expect(config.NODE_ENV).toBe('test')
          })
     })

     describe('with missing variables', () => {
          it('should throw error when GITHUB_ID is missing', () => {
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('GITHUB_ID')
          })

          it('should throw error when GITHUB_SECRET is missing', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('GITHUB_SECRET')
          })

          it('should throw error when AUTH_SECRET is missing', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('AUTH_SECRET')
          })

          it('should throw error when DATABASE_URL is missing', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('DATABASE_URL')
          })

          it('should throw error when GEMINI_API_KEY is missing', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('GEMINI_API_KEY')
          })

          it('should throw error when NODE_ENV is missing', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               delete process.env.NODE_ENV

               expect(() => validateEnv()).toThrow('NODE_ENV')
          })

          it('should throw error when NODE_ENV has invalid value', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'invalid'

               expect(() => validateEnv()).toThrow('NODE_ENV')
          })
     })

     describe('with empty string values', () => {
          it('should throw error when GITHUB_ID is empty', () => {
               process.env.GITHUB_ID = ''
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('GITHUB_ID')
          })

          it('should throw error when GITHUB_SECRET is empty', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = ''
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('GITHUB_SECRET')
          })

          it('should throw error when variable contains only whitespace', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = '   '
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow('GITHUB_SECRET')
          })
     })

     describe('error messages', () => {
          it('should include variable name in error message for missing variable', () => {
               process.env.GITHUB_SECRET = 'test-github-secret'
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow(/GITHUB_ID/)
               expect(() => validateEnv()).toThrow(/Missing required environment variables/)
          })

          it('should include variable name in error message for empty variable', () => {
               process.env.GITHUB_ID = 'test-github-id'
               process.env.GITHUB_SECRET = ''
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
               process.env.GEMINI_API_KEY = 'test-gemini-key'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow(/GITHUB_SECRET/)
               expect(() => validateEnv()).toThrow(/Empty environment variables/)
          })

          it('should list all missing variables in error message', () => {
               process.env.AUTH_SECRET = 'test-auth-secret'
               process.env.NODE_ENV = 'development'

               expect(() => validateEnv()).toThrow(/GITHUB_ID/)
               expect(() => validateEnv()).toThrow(/GITHUB_SECRET/)
               expect(() => validateEnv()).toThrow(/DATABASE_URL/)
               expect(() => validateEnv()).toThrow(/GEMINI_API_KEY/)
          })
     })
})
