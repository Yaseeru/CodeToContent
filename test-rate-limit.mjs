/**
 * Manual test script for rate limiting
 * 
 * This script tests the rate limiting behavior by making multiple requests
 * to the API endpoints and verifying the rate limit headers and 429 responses.
 * 
 * Usage: node test-rate-limit.mjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testRateLimit(endpoint, method = 'GET', body = null) {
     console.log(`\n=== Testing Rate Limit for ${method} ${endpoint} ===\n`)

     const results = []
     const maxRequests = 12 // Test beyond the limit

     for (let i = 1; i <= maxRequests; i++) {
          try {
               const options = {
                    method,
                    headers: {
                         'Content-Type': 'application/json',
                    },
               }

               if (body) {
                    options.body = JSON.stringify(body)
               }

               const response = await fetch(`${BASE_URL}${endpoint}`, options)

               const rateLimitHeaders = {
                    limit: response.headers.get('X-RateLimit-Limit'),
                    remaining: response.headers.get('X-RateLimit-Remaining'),
                    reset: response.headers.get('X-RateLimit-Reset'),
                    retryAfter: response.headers.get('Retry-After'),
               }

               const result = {
                    request: i,
                    status: response.status,
                    statusText: response.statusText,
                    headers: rateLimitHeaders,
               }

               results.push(result)

               console.log(`Request ${i}:`)
               console.log(`  Status: ${result.status} ${result.statusText}`)
               console.log(`  Rate Limit: ${rateLimitHeaders.remaining}/${rateLimitHeaders.limit}`)

               if (response.status === 429) {
                    console.log(`  ⚠️  Rate limit exceeded! Retry after ${rateLimitHeaders.retryAfter}s`)
                    const data = await response.json()
                    console.log(`  Error: ${data.error}`)
               }

               // Small delay between requests
               await new Promise(resolve => setTimeout(resolve, 100))

          } catch (error) {
               console.error(`Request ${i} failed:`, error.message)
          }
     }

     // Summary
     console.log('\n--- Summary ---')
     const successCount = results.filter(r => r.status === 200 || r.status === 401).length
     const rateLimitedCount = results.filter(r => r.status === 429).length

     console.log(`Total requests: ${results.length}`)
     console.log(`Successful/Auth required: ${successCount}`)
     console.log(`Rate limited (429): ${rateLimitedCount}`)

     // Verify rate limiting is working
     if (rateLimitedCount > 0) {
          console.log('\n✅ Rate limiting is working correctly!')
     } else {
          console.log('\n⚠️  No rate limiting detected. Expected some 429 responses.')
     }

     return results
}

async function main() {
     console.log('Rate Limiting Test Script')
     console.log('=========================')
     console.log(`Testing against: ${BASE_URL}`)
     console.log('\nNote: These tests will likely receive 401 Unauthorized responses')
     console.log('because we are not authenticated. The important part is verifying')
     console.log('that rate limit headers are present and 429 responses occur after')
     console.log('exceeding the limit (5 requests/minute for unauthenticated users).\n')

     // Test the repos endpoint
     await testRateLimit('/api/github/repos', 'GET')

     // Wait a bit before testing the next endpoint
     console.log('\n\nWaiting 2 seconds before testing next endpoint...\n')
     await new Promise(resolve => setTimeout(resolve, 2000))

     // Test the generate endpoint
     await testRateLimit('/api/generate', 'POST', {
          repoName: 'test-repo',
          owner: 'test-owner',
          commitSha: 'a'.repeat(40)
     })

     console.log('\n\n=== Test Complete ===')
     console.log('\nTo verify rate limiting is working:')
     console.log('1. Check that X-RateLimit-* headers are present in all responses')
     console.log('2. Verify that after 5 requests, you receive 429 responses')
     console.log('3. Confirm that Retry-After header is present in 429 responses')
}

main().catch(console.error)
