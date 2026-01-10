"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { logger } from "@/lib/logger"

export default function Error({
     error,
     reset,
}: {
     error: Error & { digest?: string }
     reset: () => void
}) {
     useEffect(() => {
          // Log the error details using the structured logger
          logger.error('Root error boundary caught error', error, {
               digest: error.digest,
               path: window.location.pathname,
          })
     }, [error])

     return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
               <Card className="max-w-lg w-full p-8 text-center space-y-6">
                    <div className="text-6xl">⚠️</div>

                    <div className="space-y-2">
                         <h1 className="text-3xl font-bold text-foreground">
                              Something went wrong
                         </h1>
                         <p className="text-foreground-secondary">
                              We encountered an unexpected error. Please try again.
                         </p>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                         <div className="bg-background-secondary/50 rounded-lg p-4 text-left">
                              <p className="text-sm font-mono text-foreground-secondary break-words">
                                   {error.message || 'An unexpected error occurred'}
                              </p>
                              {error.digest && (
                                   <p className="text-xs font-mono text-foreground-secondary/70 mt-2">
                                        Error ID: {error.digest}
                                   </p>
                              )}
                         </div>
                    )}

                    <div className="flex flex-col gap-3">
                         <Button
                              onClick={reset}
                              size="lg"
                              className="w-full"
                         >
                              Try again
                         </Button>

                         <Button
                              onClick={() => window.location.href = '/'}
                              variant="secondary"
                              size="lg"
                              className="w-full"
                         >
                              Go to Home
                         </Button>
                    </div>

                    <p className="text-xs text-foreground-secondary/70">
                         If this problem persists, please contact support or try again later.
                    </p>
               </Card>
          </div>
     )
}
