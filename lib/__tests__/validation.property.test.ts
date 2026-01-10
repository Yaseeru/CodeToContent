/**
 * Property-Based Tests for Input Validation
 * Feature: security-and-quality-improvements
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6
 */

import * as fc from 'fast-check'
import { validateInput, GenerateContentSchema } from '../validation'
import { ValidationError } from '../errors'

describe('Input Validation - Property Tests', () => {
     /**
      * Property 3: Input validation enforcement
      * Feature: security-and-quality-improvements, Property 3: Input validation enforcement
      * 
      * For any API request body, the validation layer should validate all required fields
      * are present, non-empty, within length constraints, and properly sanitized before processing
      * 
      * Validates: Requirements 3.1, 3.4, 3.5, 3.6
      */
     test('Property 3: Input validation enforcement', () => {
          // Generator for valid commit SHA (40 hex characters)
          const validCommitSha = fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join(''))

          // Generator for valid strings (1-100 chars, non-empty after trim)
          const validString = fc.string({ minLength: 1, maxLength: 100 })
               .filter(s => s.trim().length > 0)

          // Generator for invalid commit SHAs
          const invalidCommitSha = fc.oneof(
               fc.string({ minLength: 1, maxLength: 39 }), // Too short
               fc.string({ minLength: 41, maxLength: 50 }), // Too long
               fc.string({ minLength: 40, maxLength: 40 }).filter(s => !/^[a-f0-9]{40}$/i.test(s)), // Invalid chars
          )

          // Generator for invalid strings (empty, too long, or whitespace-only)
          const invalidString = fc.oneof(
               fc.constant(''), // Empty
               fc.string({ minLength: 101, maxLength: 200 }), // Too long
               fc.string({ minLength: 1, maxLength: 10 }).map(s => ' '.repeat(s.length)), // Whitespace only
          )

          fc.assert(
               fc.property(
                    fc.record({
                         repoName: fc.oneof(validString, invalidString),
                         owner: fc.oneof(validString, invalidString),
                         commitSha: fc.oneof(validCommitSha, invalidCommitSha),
                    }),
                    (input) => {
                         // Determine if input should be valid
                         const repoNameValid = input.repoName.trim().length >= 1 && input.repoName.trim().length <= 100
                         const ownerValid = input.owner.trim().length >= 1 && input.owner.trim().length <= 100
                         const commitShaValid = /^[a-f0-9]{40}$/i.test(input.commitSha.trim())

                         const shouldBeValid = repoNameValid && ownerValid && commitShaValid

                         if (shouldBeValid) {
                              // Should succeed
                              const result = validateInput(GenerateContentSchema, input)
                              expect(result.repoName).toBe(input.repoName.trim())
                              expect(result.owner).toBe(input.owner.trim())
                              expect(result.commitSha).toBe(input.commitSha.trim())
                         } else {
                              // Should fail
                              expect(() => validateInput(GenerateContentSchema, input)).toThrow(ValidationError)
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 4: Validation failure responses
      * Feature: security-and-quality-improvements, Property 4: Validation failure responses
      * 
      * For any invalid input, the API should return a 400 status code with a descriptive
      * error message indicating which field failed validation and why
      * 
      * Validates: Requirements 3.2
      */
     test('Property 4: Validation failure responses', () => {
          // Generator for various types of invalid inputs
          const invalidInput = fc.oneof(
               // Missing fields
               fc.record({
                    owner: fc.string({ minLength: 1, maxLength: 100 }),
                    commitSha: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join('')),
               }),
               fc.record({
                    repoName: fc.string({ minLength: 1, maxLength: 100 }),
                    commitSha: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join('')),
               }),
               fc.record({
                    repoName: fc.string({ minLength: 1, maxLength: 100 }),
                    owner: fc.string({ minLength: 1, maxLength: 100 }),
               }),
               // Invalid field values
               fc.record({
                    repoName: fc.constant(''),
                    owner: fc.string({ minLength: 1, maxLength: 100 }),
                    commitSha: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join('')),
               }),
               fc.record({
                    repoName: fc.string({ minLength: 1, maxLength: 100 }),
                    owner: fc.constant(''),
                    commitSha: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join('')),
               }),
               fc.record({
                    repoName: fc.string({ minLength: 1, maxLength: 100 }),
                    owner: fc.string({ minLength: 1, maxLength: 100 }),
                    commitSha: fc.string({ minLength: 1, maxLength: 39 }),
               }),
               // Length violations
               fc.record({
                    repoName: fc.string({ minLength: 101, maxLength: 200 }),
                    owner: fc.string({ minLength: 1, maxLength: 100 }),
                    commitSha: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join('')),
               }),
          )

          fc.assert(
               fc.property(
                    invalidInput,
                    (input) => {
                         try {
                              validateInput(GenerateContentSchema, input)
                              // If we get here, the validation didn't throw (unexpected)
                              throw new Error('Expected validation to fail')
                         } catch (error) {
                              // Should be a ValidationError
                              expect(error).toBeInstanceOf(ValidationError)

                              const validationError = error as ValidationError

                              // Should have a descriptive message
                              expect(validationError.message).toBeTruthy()
                              expect(validationError.message).toContain('Validation failed')

                              // Should have details about which fields failed
                              expect(validationError.details).toBeDefined()
                              expect(validationError.details).toHaveProperty('fields')
                              expect(Array.isArray((validationError.details as any).fields)).toBe(true)
                              expect((validationError.details as any).fields.length).toBeGreaterThan(0)

                                   // Each field error should have field name and message
                                   ; (validationError.details as any).fields.forEach((fieldError: any) => {
                                        expect(fieldError).toHaveProperty('field')
                                        expect(fieldError).toHaveProperty('message')
                                        expect(typeof fieldError.field).toBe('string')
                                        expect(typeof fieldError.message).toBe('string')
                                   })
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Additional property: Sanitization and trimming
      * 
      * For any input with leading/trailing whitespace, the validator should
      * trim the whitespace and validate the trimmed value
      */
     test('Property: Sanitization and trimming', () => {
          const validCommitSha = fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join(''))
          const validString = fc.string({ minLength: 1, maxLength: 100 })
               .filter(s => s.trim().length > 0)
          const whitespace = fc.oneof(
               fc.constant(''),
               fc.constant(' '),
               fc.constant('  '),
               fc.constant('\t'),
               fc.constant('\n'),
          )

          fc.assert(
               fc.property(
                    validString,
                    validString,
                    validCommitSha,
                    whitespace,
                    whitespace,
                    whitespace,
                    whitespace,
                    whitespace,
                    whitespace,
                    (repoName, owner, commitSha, ws1, ws2, ws3, ws4, ws5, ws6) => {
                         const input = {
                              repoName: ws1 + repoName + ws2,
                              owner: ws3 + owner + ws4,
                              commitSha: ws5 + commitSha + ws6,
                         }

                         const result = validateInput(GenerateContentSchema, input)

                         // Should trim all whitespace
                         expect(result.repoName).toBe(repoName.trim())
                         expect(result.owner).toBe(owner.trim())
                         expect(result.commitSha).toBe(commitSha.trim())
                    }
               ),
               { numRuns: 100 }
          )
     })
})
