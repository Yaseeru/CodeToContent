import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/icons/Spinner"
import styles from "./loading.module.css"

/**
 * Generate Page Loading State
 * 
 * Loading skeleton for the generate page.
 * Uses new design system with proper spacing, typography, and colors.
 * 
 * Requirements:
 * - 1.1-1.6: Global layout structure with AppShell
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 * - 4.1-4.13, 5.1-5.11: Theme-appropriate colors
 * - 13.1-13.8: Visual design constraints
 */
export default function Loading() {
     return (
          <AppShell
               listView={
                    <div className="flex flex-col gap-lg h-full">
                         {/* Header skeleton */}
                         <div className="space-y-sm">
                              <div className="h-6 w-48 bg-bg-elevated rounded animate-pulse" />
                              <div className="h-4 w-64 bg-bg-elevated rounded animate-pulse" />
                         </div>

                         {/* Code context skeleton */}
                         <div className="flex-1 overflow-hidden">
                              <Card className="bg-bg-elevated border-none overflow-hidden h-full">
                                   <div className="flex items-center justify-between px-lg py-sm bg-bg-app border-b border-border-subtle">
                                        <div className="h-4 w-32 bg-bg-elevated rounded animate-pulse" />
                                        <div className="h-4 w-20 bg-bg-elevated rounded animate-pulse" />
                                   </div>
                                   <div className="p-lg space-y-sm">
                                        {[...Array(8)].map((_, i) => (
                                             <div key={i} className={styles.skeletonLine} />
                                        ))}
                                   </div>
                              </Card>
                         </div>
                    </div>
               }
               detailPane={
                    <div className="flex flex-col gap-lg h-full">
                         {/* Header skeleton */}
                         <div className="space-y-sm">
                              <div className="h-6 w-32 bg-bg-elevated rounded animate-pulse" />
                              <div className="h-4 w-48 bg-bg-elevated rounded animate-pulse" />
                         </div>

                         {/* Loading state */}
                         <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
                              <div className="text-center space-y-lg">
                                   <Spinner size="lg" className="mx-auto text-accent-neutral" aria-hidden="true" />
                                   <p className="text-sm text-text-secondary">Loading repository data...</p>
                              </div>
                         </div>
                    </div>
               }
          />
     )
}
