"use client"

import { useEffect } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { AlertTriangle } from "@/components/ui/icons"
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
          logger.error('Dashboard error boundary caught error', error, {
               digest: error.digest,
               path: window.location.pathname,
          })
     }, [error])

     return (
          <DashboardShell>
               <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="max-w-lg w-full p-8 text-center space-y-6 border-2 border-red-500">
                         <div className="flex justify-center" aria-hidden="true">
                              <AlertTriangle size="lg" className="text-red-500" />
                         </div>

                         <div className="space-y-2" role="alert" aria-live="assertive">
                              <h2 className="text-2xl font-bold text-foreground">
                                   Unable to load dashboard
                              </h2>
                              <p className="text-foreground-secondary">
                                   We encountered an error while loading your dashboard. This might be due to a connection issue or a problem with your GitHub account.
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
                                   Back to Home
                              </Button>
                         </div>

                         <p className="text-xs text-foreground-secondary/70">
                              If this problem persists, please check your GitHub connection and try signing in again.
                         </p>
                    </Card>
               </div>
          </DashboardShell>
     )
}
