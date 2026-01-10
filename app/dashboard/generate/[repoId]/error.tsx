"use client"

import { useEffect } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

export default function Error({
     error,
     reset,
}: {
     error: Error & { digest?: string }
     reset: () => void
}) {
     useEffect(() => {
          // Log the error to an error reporting service
          console.error('GeneratePage error:', error)
     }, [error])

     return (
          <DashboardShell>
               <div className="flex flex-col gap-8 lg:flex-row h-[calc(100vh-8rem)]">
                    <div className="flex-1 flex items-center justify-center">
                         <Card className="max-w-md w-full p-8 text-center space-y-6">
                              <div className="text-6xl">⚠️</div>

                              <div className="space-y-2">
                                   <h2 className="text-2xl font-bold text-foreground">
                                        Something went wrong
                                   </h2>
                                   <p className="text-foreground-secondary">
                                        We encountered an error while loading the repository data.
                                   </p>
                              </div>

                              <div className="bg-background-secondary/50 rounded-lg p-4 text-left">
                                   <p className="text-sm font-mono text-foreground-secondary break-words">
                                        {error.message || 'An unexpected error occurred'}
                                   </p>
                              </div>

                              <div className="flex flex-col gap-3">
                                   <Button
                                        onClick={reset}
                                        size="lg"
                                        className="w-full"
                                   >
                                        Try again
                                   </Button>

                                   <Button
                                        onClick={() => window.location.href = '/dashboard'}
                                        variant="secondary"
                                        size="lg"
                                        className="w-full"
                                   >
                                        Back to Dashboard
                                   </Button>
                              </div>

                              <p className="text-xs text-foreground-secondary/70">
                                   If this problem persists, please check your GitHub connection and repository permissions.
                              </p>
                         </Card>
                    </div>
               </div>
          </DashboardShell>
     )
}
