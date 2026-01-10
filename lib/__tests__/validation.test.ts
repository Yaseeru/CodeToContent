/**
 * Unit tests for input validation
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { validateInput, GenerateContentSchema } from '../validation'
import { ValidationError } from '../errors'

describe('Input Validation', () => {
     describe('valid inputs', () => {
          it('should accept valid input with all required fields', () => {
               const validInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               const result = validateInput(GenerateContentSchema, validInput)

               expect(result).toEqual({
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               })
          })

          it('should accept commit SHA with uppercase letters', () => {
               const validInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'A1B2C3D4E5F6789012345678901234567890ABCD'
               }

               const result = validateInput(GenerateContentSchema, validInput)

               expect(result.commitSha).toBe('A1B2C3D4E5F6789012345678901234567890ABCD')
          })

          it('should accept commit SHA with mixed case', () => {
               const validInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'aB1234567890123456789012345678901234cDeF'
               }

               const result = validateInput(GenerateContentSchema, validInput)

               expect(result.commitSha).toBe('aB1234567890123456789012345678901234cDeF')
          })

          it('should trim whitespace from string inputs', () => {
               const validInput = {
                    repoName: '  test-repo  ',
                    owner: '  test-owner  ',
                    commitSha: '  a1b2c3d4e5f6789012345678901234567890abcd  '
               }

               const result = validateInput(GenerateContentSchema, validInput)

               expect(result.repoName).toBe('test-repo')
               expect(result.owner).toBe('test-owner')
               expect(result.commitSha).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
          })

          it('should accept maximum length strings', () => {
               const validInput = {
                    repoName: 'a'.repeat(100),
                    owner: 'b'.repeat(100),
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               const result = validateInput(GenerateContentSchema, validInput)

               expect(result.repoName).toHaveLength(100)
               expect(result.owner).toHaveLength(100)
          })
     })

     describe('invalid formats', () => {
          it('should reject commit SHA with invalid characters', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'invalid-sha-with-special-chars!@#$%^&*()'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject commit SHA that is too short', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'abc123'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject commit SHA that is too long', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd123'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject commit SHA with spaces', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4 e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })
     })

     describe('length constraints', () => {
          it('should reject repoName exceeding 100 characters', () => {
               const invalidInput = {
                    repoName: 'a'.repeat(101),
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject owner exceeding 100 characters', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: 'b'.repeat(101),
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject empty repoName', () => {
               const invalidInput = {
                    repoName: '',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject empty owner', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: '',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject repoName with only whitespace', () => {
               const invalidInput = {
                    repoName: '   ',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })
     })

     describe('required fields', () => {
          it('should reject missing repoName', () => {
               const invalidInput = {
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject missing owner', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject missing commitSha', () => {
               const invalidInput = {
                    repoName: 'test-repo',
                    owner: 'test-owner'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject null values', () => {
               const invalidInput = {
                    repoName: null,
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })

          it('should reject undefined values', () => {
               const invalidInput = {
                    repoName: undefined,
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               expect(() => validateInput(GenerateContentSchema, invalidInput))
                    .toThrow(ValidationError)
          })
     })

     describe('error details', () => {
          it('should include field information in validation error', () => {
               const invalidInput = {
                    repoName: '',
                    owner: 'test-owner',
                    commitSha: 'invalid'
               }

               try {
                    validateInput(GenerateContentSchema, invalidInput)
                    fail('Should have thrown ValidationError')
               } catch (error) {
                    expect(error).toBeInstanceOf(ValidationError)
                    expect((error as ValidationError).details).toBeDefined()
                    expect((error as ValidationError).details).toHaveProperty('fields')
               }
          })

          it('should include descriptive error messages', () => {
               const invalidInput = {
                    repoName: '',
                    owner: 'test-owner',
                    commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd'
               }

               try {
                    validateInput(GenerateContentSchema, invalidInput)
                    fail('Should have thrown ValidationError')
               } catch (error) {
                    expect(error).toBeInstanceOf(ValidationError)
                    expect((error as ValidationError).message).toContain('Validation failed')
               }
          })
     })
})
