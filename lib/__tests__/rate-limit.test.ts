/**
 * Unit tests for rate limiter
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { rateLimit, cleanupExpiredEntries } from '../rate-limit'

describe('Rate Limiter', () => {
     // Helper to create unique identifiers for each test to avoid state sharing
     let testCounter = 0
     const getUniqueId = () => `test-${Date.now()}-${testCounter++}`

     describe('requests within limit', () => {
          it('should allow requests within the limit', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 3
               })

               const id = getUniqueId()
               const result1 = await limiter(id)
               expect(result1.success).toBe(true)
               expect(result1.limit).toBe(3)
               expect(result1.remaining).toBe(2)

               const result2 = await limiter(id)
               expect(result2.success).toBe(true)
               expect(result2.remaining).toBe(1)

               const result3 = await limiter(id)
               expect(result3.success).toBe(true)
               expect(result3.remaining).toBe(0)
          })

          it('should track different IPs independently', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 2
               })

               const id1 = getUniqueId()
               const id2 = getUniqueId()

               const result1 = await limiter(id1)
               expect(result1.success).toBe(true)
               expect(result1.remaining).toBe(1)

               const result2 = await limiter(id2)
               expect(result2.success).toBe(true)
               expect(result2.remaining).toBe(1)

               const result3 = await limiter(id1)
               expect(result3.success).toBe(true)
               expect(result3.remaining).toBe(0)

               const result4 = await limiter(id2)
               expect(result4.success).toBe(true)
               expect(result4.remaining).toBe(0)
          })

          it('should allow single request when limit is 1', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id = getUniqueId()
               const result = await limiter(id)
               expect(result.success).toBe(true)
               expect(result.remaining).toBe(0)
          })
     })

     describe('requests exceeding limit', () => {
          it('should return 429 status when limit is exceeded', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 2
               })

               const id = getUniqueId()
               await limiter(id)
               await limiter(id)

               const result = await limiter(id)
               expect(result.success).toBe(false)
               expect(result.remaining).toBe(0)
          })

          it('should continue blocking requests after limit is exceeded', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id = getUniqueId()
               await limiter(id)

               const result1 = await limiter(id)
               expect(result1.success).toBe(false)

               const result2 = await limiter(id)
               expect(result2.success).toBe(false)

               const result3 = await limiter(id)
               expect(result3.success).toBe(false)
          })

          it('should block only the IP that exceeded the limit', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id1 = getUniqueId()
               const id2 = getUniqueId()

               await limiter(id1)
               await limiter(id1) // This should be blocked

               const result1 = await limiter(id1)
               expect(result1.success).toBe(false)

               const result2 = await limiter(id2)
               expect(result2.success).toBe(true)
          })
     })

     describe('rate limit headers', () => {
          it('should return correct limit value', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 5
               })

               const id = getUniqueId()
               const result = await limiter(id)
               expect(result.limit).toBe(5)
          })

          it('should return correct remaining count', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 3
               })

               const id = getUniqueId()
               const result1 = await limiter(id)
               expect(result1.remaining).toBe(2)

               const result2 = await limiter(id)
               expect(result2.remaining).toBe(1)

               const result3 = await limiter(id)
               expect(result3.remaining).toBe(0)
          })

          it('should return reset timestamp', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 3
               })

               const id = getUniqueId()
               const before = Date.now()
               const result = await limiter(id)
               const after = Date.now()

               expect(result.reset).toBeGreaterThan(before)
               expect(result.reset).toBeLessThanOrEqual(after + 60000 + 100) // Add small buffer
          })

          it('should maintain same reset time for requests in same window', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 3
               })

               const id = getUniqueId()
               const result1 = await limiter(id)
               const result2 = await limiter(id)

               expect(result1.reset).toBe(result2.reset)
          })

          it('should return reset time even when blocked', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id = getUniqueId()
               const result1 = await limiter(id)
               const result2 = await limiter(id)

               expect(result2.success).toBe(false)
               expect(result2.reset).toBe(result1.reset)
          })
     })

     describe('counter reset after time window', () => {
          it('should reset counter after time window expires', async () => {
               const limiter = rateLimit({
                    interval: 100, // 100ms for faster testing
                    uniqueTokenPerInterval: 500,
                    limit: 2
               })

               const id = getUniqueId()
               // Use up the limit
               await limiter(id)
               await limiter(id)

               // Should be blocked
               const blocked = await limiter(id)
               expect(blocked.success).toBe(false)

               // Wait for window to expire
               await new Promise(resolve => setTimeout(resolve, 150))

               // Should be allowed again
               const result = await limiter(id)
               expect(result.success).toBe(true)
               expect(result.remaining).toBe(1)
          })

          it('should create new window with new reset time', async () => {
               const limiter = rateLimit({
                    interval: 100,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id = getUniqueId()
               const result1 = await limiter(id)
               const firstReset = result1.reset

               // Wait for window to expire
               await new Promise(resolve => setTimeout(resolve, 150))

               const result2 = await limiter(id)
               const secondReset = result2.reset

               expect(secondReset).toBeGreaterThan(firstReset)
          })

          it('should allow full limit after reset', async () => {
               const limiter = rateLimit({
                    interval: 100,
                    uniqueTokenPerInterval: 500,
                    limit: 3
               })

               const id = getUniqueId()
               // Use up the limit
               await limiter(id)
               await limiter(id)
               await limiter(id)

               // Wait for window to expire
               await new Promise(resolve => setTimeout(resolve, 150))

               // Should be able to make full limit of requests again
               const result1 = await limiter(id)
               expect(result1.success).toBe(true)
               expect(result1.remaining).toBe(2)

               const result2 = await limiter(id)
               expect(result2.success).toBe(true)
               expect(result2.remaining).toBe(1)

               const result3 = await limiter(id)
               expect(result3.success).toBe(true)
               expect(result3.remaining).toBe(0)
          })
     })

     describe('cleanup expired entries', () => {
          it('should remove expired entries from store', async () => {
               const limiter = rateLimit({
                    interval: 100,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id1 = getUniqueId()
               const id2 = getUniqueId()

               await limiter(id1)
               await limiter(id2)

               // Wait for entries to expire
               await new Promise(resolve => setTimeout(resolve, 150))

               // Cleanup should remove expired entries
               cleanupExpiredEntries()

               // New requests should work as if starting fresh
               const result1 = await limiter(id1)
               expect(result1.success).toBe(true)
               expect(result1.remaining).toBe(0)
          })
     })

     describe('edge cases', () => {
          it('should handle very short intervals', async () => {
               const limiter = rateLimit({
                    interval: 10,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const id = getUniqueId()
               const result1 = await limiter(id)
               expect(result1.success).toBe(true)

               await new Promise(resolve => setTimeout(resolve, 20))

               const result2 = await limiter(id)
               expect(result2.success).toBe(true)
          })

          it('should handle high limits', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 100
               })

               const id = getUniqueId()
               for (let i = 0; i < 100; i++) {
                    const result = await limiter(id)
                    expect(result.success).toBe(true)
               }

               const blocked = await limiter(id)
               expect(blocked.success).toBe(false)
          })

          it('should handle empty identifier', async () => {
               const limiter = rateLimit({
                    interval: 60000,
                    uniqueTokenPerInterval: 500,
                    limit: 1
               })

               const result = await limiter('')
               expect(result.success).toBe(true)
          })
     })
})
