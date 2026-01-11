"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { AlertTriangle } from "@/components/ui/icons"

/**
 * Generate Page Error Boundary
 * 
 * Catches and displays errors in the generate page.
 * Uses new design system with proper spacing, typography, and colors.
 * 
 * Requirements:
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 * - 4.1-4.13, 5.1-5.11: Theme-appropriate colors
 * - 13.1-13.8: Visual design constraints
 * - 15.1-15.5: Accessibility
 */
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
          <div className="min-h-screen flex items-center justify-center p-lg bg-bg-app transition-none">
               <Card className="max-w-md w-full text-center space-y-lg border-2 border-status-error" padding="lg">
                    <div className="flex justify-center" aria-hidden="true">
                         <AlertTriangle size="lg" className="text-status-error" />
                    </div>

                    <div className="space-y-sm" role="alert" aria-live="assertive">
                         <h2 className="text-md font-semibold text-text-primary">
                              Something went wrong
                         </h2>
                         <p className="text-sm text-text-secondary">
                              We encountered an error while loading the repository data.
                         </p>
                    </div>

                    <div className="bg-bg-elevated rounded-lg p-lg text-left">
                         <p className="text-sm font-mono text-text-secondary break-words">
                              {error.message || 'An unexpected error occurred'}
                         </p>
                    </div>

                    <div className="flex flex-col gap-sm">
                         <Button
                              onClick={reset}
                              className="w-full"
                         >
                              Try again
                         </Button>

                         <Button
                              onClick={() => window.location.href = '/dashboard'}
                              variant="secondary"
                              className="w-full"
                         >
                              Back to Dashboard
                         </Button>
                    </div>

                    <p className="text-xs text-text-muted">
                         If this problem persists, please check your GitHub connection and repository permissions.
                    </p>
               </Card>
          </div>
     )
}
