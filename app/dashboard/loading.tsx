import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card } from "@/components/ui/Card"

export default function Loading() {
     return (
          <DashboardShell>
               <div className="space-y-6">
                    <div>
                         <div className="h-9 w-48 bg-background-secondary/50 rounded animate-pulse mb-2" />
                         <div className="h-5 w-96 bg-background-secondary/30 rounded animate-pulse" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {[...Array(6)].map((_, i) => (
                              <Card key={i} className="p-6 space-y-4">
                                   <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                             <div className="h-6 w-3/4 bg-background-secondary/50 rounded animate-pulse" />
                                             <div className="h-4 w-1/2 bg-background-secondary/30 rounded animate-pulse" />
                                        </div>
                                   </div>
                                   <div className="space-y-2">
                                        <div className="h-4 w-full bg-background-secondary/20 rounded animate-pulse" />
                                        <div className="h-4 w-5/6 bg-background-secondary/20 rounded animate-pulse" />
                                   </div>
                                   <div className="flex items-center gap-4 pt-2">
                                        <div className="h-4 w-16 bg-background-secondary/30 rounded animate-pulse" />
                                        <div className="h-4 w-20 bg-background-secondary/30 rounded animate-pulse" />
                                   </div>
                              </Card>
                         ))}
                    </div>
               </div>
          </DashboardShell>
     )
}
