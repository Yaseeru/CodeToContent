import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/Card"

/**
 * Dashboard Loading State
 * 
 * Loading skeleton for the dashboard page.
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
                    <div className="space-y-lg">
                         {/* Header skeleton */}
                         <div>
                              <div className="h-6 w-48 bg-bg-elevated rounded animate-pulse mb-sm" />
                              <div className="h-5 w-96 bg-bg-elevated rounded animate-pulse" />
                         </div>

                         {/* Repository cards skeleton */}
                         <div className="grid gap-lg md:grid-cols-2 lg:grid-cols-3">
                              {[...Array(6)].map((_, i) => (
                                   <Card key={i} padding="lg" className="space-y-lg">
                                        <div className="flex items-start justify-between">
                                             <div className="space-y-sm flex-1">
                                                  <div className="h-6 w-3/4 bg-bg-elevated rounded animate-pulse" />
                                                  <div className="h-4 w-1/2 bg-bg-elevated rounded animate-pulse" />
                                             </div>
                                        </div>
                                        <div className="space-y-sm">
                                             <div className="h-4 w-full bg-bg-elevated rounded animate-pulse" />
                                             <div className="h-4 w-5/6 bg-bg-elevated rounded animate-pulse" />
                                        </div>
                                        <div className="flex items-center gap-lg pt-sm">
                                             <div className="h-4 w-16 bg-bg-elevated rounded animate-pulse" />
                                             <div className="h-4 w-20 bg-bg-elevated rounded animate-pulse" />
                                        </div>
                                   </Card>
                              ))}
                         </div>
                    </div>
               }
          />
     )
}
