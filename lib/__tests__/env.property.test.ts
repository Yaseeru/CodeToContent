/**
 * Property-Based Tests for Environment Validator
 * Feature: security-and-quality-improvements
 * Requirements: 1.1, 1.2
 */

import * as fc from 'fast-check'
import { validateEnv } from '../env'

describe('Environment Validator - Property Tests', () => {
     const originalEnv = process.env

     beforeEach(() => {
          jest.resetModules()
          process.env = { ...originalEnv }
     })

     afterAll(() => {
          process.env = originalEnv
     })

     /**
      * Property 1: Environment validation completeness
      * Feature: security-and-quality-improvements, Property 1: Environment validation completeness
      * 
      * For any set of environment variables, the validator should correctly identify
      * whether all required variables (GITHUB_ID, GITHUB_SECRET, AUTH_SECRET, 
      * DATABASE_URL, GEMINI_API_KEY) are present and non-empty
      * 
      * Validates: Requirements 1.1
      */
     test('Property 1: Environment validation completeness', () => {
          const requiredVars = ['GITHUB_ID', 'GITHUB_SECRET', 'AUTH_SECRET', 'DATABASE_URL', 'GEMINI_API_KEY']
          const nodeEnvValues = ['development', 'production', 'test'] as const

          // Generator for non-empty strings (excluding whitespace-only)
          const nonEmptyString = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)

          fc.assert(
               fc.property(
                    // Generate a random set of environment variables
                    fc.record({
                         GITHUB_ID: fc.option(nonEmptyString, { nil: undefined }),
                         GITHUB_SECRET: fc.option(nonEmptyString, { nil: undefined }),
                         AUTH_SECRET: fc.option(nonEmptyString, { nil: undefined }),
                         DATABASE_URL: fc.option(nonEmptyString, { nil: undefined }),
                         GEMINI_API_KEY: fc.option(nonEmptyString, { nil: undefined }),
                         NODE_ENV: fc.option(fc.constantFrom(...nodeEnvValues), { nil: undefined }),
                    }),
                    (envVars) => {
                         // Set up process.env with generated values
                         process.env = { ...originalEnv }
                         Object.entries(envVars).forEach(([key, value]) => {
                              if (value !== undefined) {
                                   process.env[key] = value
                              } else {
                                   delete process.env[key]
                              }
                         })

                         // Check if all required variables are present and non-empty (after trim)
                         const allPresent = requiredVars.every(
                              (varName) => {
                                   const value = envVars[varName as keyof typeof envVars]
                                   return value !== undefined && value.trim().length > 0
                              }
                         ) && envVars.NODE_ENV !== undefined

                         if (allPresent) {
                              // Should succeed
                              expect(() => validateEnv()).not.toThrow()
                              const config = validateEnv()
                              expect(config.GITHUB_ID).toBe(envVars.GITHUB_ID)
                              expect(config.GITHUB_SECRET).toBe(envVars.GITHUB_SECRET)
                              expect(config.AUTH_SECRET).toBe(envVars.AUTH_SECRET)
                              expect(config.DATABASE_URL).toBe(envVars.DATABASE_URL)
                              expect(config.GEMINI_API_KEY).toBe(envVars.GEMINI_API_KEY)
                              expect(config.NODE_ENV).toBe(envVars.NODE_ENV)
                         } else {
                              // Should fail
                              expect(() => validateEnv()).toThrow()
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 2: Environment validation error messages
      * Feature: security-and-quality-improvements, Property 2: Environment validation error messages
      * 
      * For any missing environment variable, the validation error should include
      * the specific variable name in the error message
      * 
      * Validates: Requirements 1.2
      */
     test('Property 2: Environment validation error messages', () => {
          const requiredVars = ['GITHUB_ID', 'GITHUB_SECRET', 'AUTH_SECRET', 'DATABASE_URL', 'GEMINI_API_KEY', 'NODE_ENV']

          fc.assert(
               fc.property(
                    // Generate a random subset of missing variables (at least one missing)
                    fc.subarray(requiredVars, { minLength: 1, maxLength: requiredVars.length }),
                    (missingVars) => {
                         // Set up process.env with all variables except the missing ones
                         process.env = { ...originalEnv }

                         const allVars = {
                              GITHUB_ID: 'test-github-id',
                              GITHUB_SECRET: 'test-github-secret',
                              AUTH_SECRET: 'test-auth-secret',
                              DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                              GEMINI_API_KEY: 'test-gemini-key',
                              NODE_ENV: 'development',
                         }

                         // Set all variables except the missing ones
                         Object.entries(allVars).forEach(([key, value]) => {
                              if (!missingVars.includes(key)) {
                                   process.env[key] = value
                              } else {
                                   delete process.env[key]
                              }
                         })

                         // Should throw an error
                         let errorMessage = ''
                         try {
                              validateEnv()
                         } catch (error) {
                              errorMessage = (error as Error).message
                         }

                         // Error message should include all missing variable names
                         missingVars.forEach((varName) => {
                              expect(errorMessage).toContain(varName)
                         })
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Additional property: Empty string handling
      * 
      * For any environment variable set to an empty string or whitespace,
      * the validator should treat it as invalid and include it in the error message
      */
     test('Property: Empty string and whitespace handling', () => {
          const requiredVars = ['GITHUB_ID', 'GITHUB_SECRET', 'AUTH_SECRET', 'DATABASE_URL', 'GEMINI_API_KEY']

          fc.assert(
               fc.property(
                    // Pick a random variable to make empty/whitespace
                    fc.constantFrom(...requiredVars),
                    fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '),
                    (varToEmpty, emptyValue) => {
                         // Set up process.env with all variables, but one is empty/whitespace
                         process.env = { ...originalEnv }
                         process.env.GITHUB_ID = varToEmpty === 'GITHUB_ID' ? emptyValue : 'test-github-id'
                         process.env.GITHUB_SECRET = varToEmpty === 'GITHUB_SECRET' ? emptyValue : 'test-github-secret'
                         process.env.AUTH_SECRET = varToEmpty === 'AUTH_SECRET' ? emptyValue : 'test-auth-secret'
                         process.env.DATABASE_URL = varToEmpty === 'DATABASE_URL' ? emptyValue : 'postgresql://test:test@localhost:5432/test'
                         process.env.GEMINI_API_KEY = varToEmpty === 'GEMINI_API_KEY' ? emptyValue : 'test-gemini-key'
                         process.env.NODE_ENV = 'development'

                         // Should throw an error
                         let errorMessage = ''
                         try {
                              validateEnv()
                         } catch (error) {
                              errorMessage = (error as Error).message
                         }

                         // Error message should include the variable name
                         expect(errorMessage).toContain(varToEmpty)
                    }
               ),
               { numRuns: 100 }
          )
     })
})
