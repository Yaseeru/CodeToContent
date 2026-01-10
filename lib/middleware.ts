/**
 * Middleware utilities for API routes
 * 
 * Provides composable middleware functions for common concerns like
 * logging, authentication, and rate limiting.
 */

import { logger, LogContext } from './logger'
import { auth } from './auth'
import { rateLimit, RateLimitResult } from './rate-limit'
import { NextResponse } from 'next/server'

export type Middleware = (req: Request) => Promise<Response | null>

/**
 * Composes multiple middleware functions into a single middleware.
 * Executes middleware in order, short-circuits if any returns a Response.
 */
export function compose(...middlewares: Middleware[]): Middleware {
     return async (req: Request): Promise<Response | null> => {
          for (const middleware of middlewares) {
               const response = await middleware(req)
               if (response) {
                    return response
               }
          }
          return null
     }
}

/**
 * Logging middleware that logs incoming requests and completed responses.
 * Tracks request duration and includes user context when available.
 */
export function withLogging(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
     return async (req: Request): Promise<Response> => {
          const startTime = Date.now()
          const url = new URL(req.url)
          const path = url.pathname
          const method = req.method

          // Get user session for context
          let userId: string | undefined
          try {
               const session = await auth()
               userId = session?.user?.email || undefined
          } catch {
               // Session retrieval failed, continue without userId
          }

          // Log incoming request
          logger.info('Incoming API request', {
               method,
               path,
               userId,
          })

          try {
               // Execute the handler
               const response = await handler(req)
               const duration = Date.now() - startTime

               // Log completed response
               logger.info('API request completed', {
                    method,
                    path,
                    userId,
                    status: response.status,
                    duration,
               })

               return response
          } catch (error) {
               const duration = Date.now() - startTime

               // Log failed request
               logger.error(
                    'API request failed',
                    error instanceof Error ? error : new Error(String(error)),
                    {
                         method,
                         path,
                         userId,
                         duration,
                    }
               )

               throw error
          }
     }
}

/**
 * Creates a LogContext object from a Request for use in error logging.
 */
export async function getRequestContext(req: Request): Promise<LogContext> {
     const url = new URL(req.url)
     const context: LogContext = {
          method: req.method,
          path: url.pathname,
     }

     // Try to get user session
     try {
          const session = await auth()
          if (session?.user?.email) {
               context.userId = session.user.email
          }
     } catch {
          // Session retrieval failed, continue without userId
     }

     return context
}

/**
 * Extracts the client IP address from the request.
 * Checks various headers in order of preference.
 */
function getClientIP(req: Request): string {
     const headers = req.headers

     // Check common proxy headers
     const forwardedFor = headers.get('x-forwarded-for')
     if (forwardedFor) {
          // x-forwarded-for can contain multiple IPs, take the first one
          return forwardedFor.split(',')[0].trim()
     }

     const realIP = headers.get('x-real-ip')
     if (realIP) {
          return realIP
     }

     // Fallback to a default identifier
     return 'unknown'
}

/**
 * Rate limiting middleware that restricts API request frequency.
 * 
 * Applies different limits based on authentication status:
 * - Authenticated users: 10 requests per minute
 * - Unauthenticated users: 5 requests per minute
 * 
 * Returns 429 with Retry-After header when limit is exceeded.
 * Adds rate limit headers to all responses.
 */
export function withRateLimit(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
     // Create rate limiters for authenticated and unauthenticated users
     const authenticatedLimiter = rateLimit({
          interval: 60 * 1000, // 1 minute
          uniqueTokenPerInterval: 500, // Not used in simple implementation
          limit: 10,
     })

     const unauthenticatedLimiter = rateLimit({
          interval: 60 * 1000, // 1 minute
          uniqueTokenPerInterval: 500, // Not used in simple implementation
          limit: 5,
     })

     return async (req: Request): Promise<Response> => {
          // Get client identifier (IP address)
          const clientIP = getClientIP(req)

          // Check if user is authenticated
          let isAuthenticated = false
          try {
               const session = await auth()
               isAuthenticated = !!session?.user
          } catch {
               // Session retrieval failed, treat as unauthenticated
          }

          // Apply appropriate rate limiter
          const limiter = isAuthenticated ? authenticatedLimiter : unauthenticatedLimiter
          const identifier = `${clientIP}:${isAuthenticated ? 'auth' : 'unauth'}`
          const result = await limiter(identifier)

          // If rate limit exceeded, return 429 response
          if (!result.success) {
               const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

               return new NextResponse(
                    JSON.stringify({
                         error: 'Too many requests',
                         code: 'RATE_LIMIT_EXCEEDED',
                         retryAfter,
                    }),
                    {
                         status: 429,
                         headers: {
                              'Content-Type': 'application/json',
                              'X-RateLimit-Limit': String(result.limit),
                              'X-RateLimit-Remaining': String(result.remaining),
                              'X-RateLimit-Reset': String(result.reset),
                              'Retry-After': String(retryAfter),
                         },
                    }
               )
          }

          // Execute the handler
          const response = await handler(req)

          // Add rate limit headers to the response
          const newHeaders = new Headers(response.headers)
          newHeaders.set('X-RateLimit-Limit', String(result.limit))
          newHeaders.set('X-RateLimit-Remaining', String(result.remaining))
          newHeaders.set('X-RateLimit-Reset', String(result.reset))

          // Create a new response with the updated headers
          return new Response(response.body, {
               status: response.status,
               statusText: response.statusText,
               headers: newHeaders,
          })
     }
}
