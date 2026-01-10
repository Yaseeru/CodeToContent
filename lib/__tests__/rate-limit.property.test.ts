/**
 * Property-Based Tests for Rate Limiting
 * Feature: security-and-quality-improvements
 * Requirements: 5.1, 5.2, 5.5, 5.6
 */

import * as fc from 'fast-check'
import { rateLimit, RateLimitConfig, cleanupExpiredEntries } from '../rate-limit'

describe('Rate Limiting - Property Tests', () => {
     beforeEach(() => {
          // Clear rate limit store before each test
          // We need to wait for any pending intervals to clear
          jest.clearAllTimers()
     })

     /**
      * Property 7: Rate limit tracking
      * Feature: security-and-quality-improvements, Property 7: Rate limit tracking
      * 
      * For any sequence of API requests from the same IP address, the rate limiter
      * should accurately track the request count within the time window
      * 
      * Validates: Requirements 5.1
      */
     test('Property 7: Rate limit tracking', async () => {
          fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 1, max: 20 }), // limit
                    fc.integer({ min: 1, max: 10 }), // number of requests to make
                    fc.string({ minLength: 1, maxLength: 20 }), // identifier base (IP)
                    fc.integer({ min: 0, max: 1000000 }), // unique suffix to avoid collisions
                    async (limit, numRequests, identifierBase, uniqueSuffix) => {
                         // Create a unique identifier for this test iteration
                         const identifier = `${identifierBase}-${uniqueSuffix}-${Date.now()}`

                         const config: RateLimitConfig = {
                              interval: 60000, // 1 minute
                              uniqueTokenPerInterval: 100,
                              limit,
                         }

                         const limiter = rateLimit(config)
                         let successCount = 0
                         let failCount = 0

                         // Make the requests
                         for (let i = 0; i < numRequests; i++) {
                              const result = await limiter(identifier)
                              if (result.success) {
                                   successCount++
                              } else {
                                   failCount++
                              }
                         }

                         // Verify tracking
                         if (numRequests <= limit) {
                              // All requests should succeed
                              expect(successCount).toBe(numRequests)
                              expect(failCount).toBe(0)
                         } else {
                              // First 'limit' requests should succeed, rest should fail
                              expect(successCount).toBe(limit)
                              expect(failCount).toBe(numRequests - limit)
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 8: Rate limit enforcement
      * Feature: security-and-quality-improvements, Property 8: Rate limit enforcement
      * 
      * For any client that exceeds the configured rate limit, the API should return
      * a 429 status code with a Retry-After header
      * 
      * Validates: Requirements 5.2, 5.5
      */
     test('Property 8: Rate limit enforcement', async () => {
          fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 1, max: 10 }), // limit
                    fc.string({ minLength: 1, maxLength: 20 }), // identifier base (IP)
                    fc.integer({ min: 0, max: 1000000 }), // unique suffix to avoid collisions
                    async (limit, identifierBase, uniqueSuffix) => {
                         // Create a unique identifier for this test iteration
                         const identifier = `${identifierBase}-${uniqueSuffix}-${Date.now()}`

                         const config: RateLimitConfig = {
                              interval: 60000, // 1 minute
                              uniqueTokenPerInterval: 100,
                              limit,
                         }

                         const limiter = rateLimit(config)

                         // Make requests up to the limit
                         for (let i = 0; i < limit; i++) {
                              const result = await limiter(identifier)
                              expect(result.success).toBe(true)
                              expect(result.remaining).toBe(limit - i - 1)
                         }

                         // Next request should fail
                         const failedResult = await limiter(identifier)
                         expect(failedResult.success).toBe(false)
                         expect(failedResult.remaining).toBe(0)
                         expect(failedResult.reset).toBeGreaterThan(Date.now())
                    }
               ),
               { numRuns: 100 }
          )
     })

     /**
      * Property 9: Rate limit window reset
      * Feature: security-and-quality-improvements, Property 9: Rate limit window reset
      * 
      * For any rate-limited client, after the time window expires, the request counter
      * should reset and new requests should be allowed
      * 
      * Validates: Requirements 5.6
      */
     test('Property 9: Rate limit window reset', async () => {
          // Use fake timers for this test
          jest.useFakeTimers()

          try {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 1, max: 10 }), // limit
                         fc.integer({ min: 100, max: 5000 }), // interval in ms
                         fc.string({ minLength: 1, maxLength: 20 }), // identifier base (IP)
                         fc.integer({ min: 0, max: 1000000 }), // unique suffix to avoid collisions
                         async (limit, interval, identifierBase, uniqueSuffix) => {
                              // Create a unique identifier for this test iteration
                              const identifier = `${identifierBase}-${uniqueSuffix}-${Date.now()}`

                              const config: RateLimitConfig = {
                                   interval,
                                   uniqueTokenPerInterval: 100,
                                   limit,
                              }

                              const limiter = rateLimit(config)

                              // Exhaust the limit
                              for (let i = 0; i < limit; i++) {
                                   await limiter(identifier)
                              }

                              // Next request should fail
                              const failedResult = await limiter(identifier)
                              expect(failedResult.success).toBe(false)

                              // Advance time past the interval
                              jest.advanceTimersByTime(interval + 1)

                              // Next request should succeed (new window)
                              const successResult = await limiter(identifier)
                              expect(successResult.success).toBe(true)
                              expect(successResult.remaining).toBe(limit - 1)
                         }
                    ),
                    { numRuns: 100 }
               )
          } finally {
               jest.useRealTimers()
          }
     })

     /**
      * Additional property: Multiple identifiers are tracked independently
      * 
      * For any set of different identifiers, the rate limiter should track
      * each one independently
      */
     test('Property: Multiple identifiers tracked independently', async () => {
          fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 1, max: 10 }), // limit
                    fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 5 }).map(arr => [...new Set(arr)]), // unique identifiers
                    fc.integer({ min: 0, max: 1000000 }), // unique suffix to avoid collisions
                    async (limit, identifierBases, uniqueSuffix) => {
                         if (identifierBases.length < 2) return // Skip if we don't have at least 2 unique identifiers

                         // Create unique identifiers for this test iteration
                         const identifiers = identifierBases.map(base => `${base}-${uniqueSuffix}-${Date.now()}`)

                         const config: RateLimitConfig = {
                              interval: 60000,
                              uniqueTokenPerInterval: 100,
                              limit,
                         }

                         const limiter = rateLimit(config)

                         // Each identifier should be able to make 'limit' requests
                         for (const identifier of identifiers) {
                              for (let i = 0; i < limit; i++) {
                                   const result = await limiter(identifier)
                                   expect(result.success).toBe(true)
                              }

                              // Next request for this identifier should fail
                              const failedResult = await limiter(identifier)
                              expect(failedResult.success).toBe(false)
                         }
                    }
               ),
               { numRuns: 100 }
          )
     })
})
