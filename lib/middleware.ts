/**
 * Middleware utilities for API routes
 * 
 * Provides composable middleware functions for common concerns like
 * logging, authentication, and rate limiting.
 */

import { logger, LogContext } from './logger'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

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
               const session = await getServerSession(authOptions)
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
          const session = await getServerSession(authOptions)
          if (session?.user?.email) {
               context.userId = session.user.email
          }
     } catch {
          // Session retrieval failed, continue without userId
     }

     return context
}
