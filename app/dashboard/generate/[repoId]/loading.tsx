import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card } from "@/components/ui/Card"

export default function Loading() {
     return (
          <DashboardShell>
               <div className="flex flex-col gap-8 lg:flex-row h-[calc(100vh-8rem)]">
                    {/* Left Panel: Loading State */}
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                         <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                   <div className="h-8 w-48 bg-background-secondary/50 rounded animate-pulse" />
                                   <div className="h-4 w-64 bg-background-secondary/30 rounded animate-pulse" />
                              </div>
                              <div className="h-10 w-40 bg-background-secondary/50 rounded animate-pulse" />
                         </div>

                         <div className="flex-1 overflow-hidden">
                              <Card className="bg-[#1B2236] border-none overflow-hidden h-full">
                                   <div className="flex items-center justify-between px-4 py-2 bg-[#2A2F4A]/50 border-b border-[#2A2F4A]">
                                        <div className="h-4 w-32 bg-background-secondary/30 rounded animate-pulse" />
                                        <div className="h-4 w-20 bg-background-secondary/30 rounded animate-pulse" />
                                   </div>
                                   <div className="p-8 space-y-4">
                                        {[...Array(8)].map((_, i) => (
                                             <div key={i} className="h-5 bg-background-secondary/20 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                        ))}
                                   </div>
                              </Card>
                         </div>
                    </div>

                    {/* Right Panel: Loading State */}
                    <div className="flex-1 flex flex-col gap-6 bg-background-secondary/30 rounded-xl p-6 border border-dashed border-border">
                         <div className="space-y-2">
                              <div className="h-8 w-32 bg-background-secondary/50 rounded animate-pulse" />
                              <div className="h-4 w-48 bg-background-secondary/30 rounded animate-pulse" />
                         </div>

                         <div className="flex-1 flex items-center justify-center">
                              <div className="text-center space-y-4">
                                   <div className="text-4xl animate-pulse">⏳</div>
                                   <p className="text-foreground-secondary">Loading repository data...</p>
                              </div>
                         </div>
                    </div>
               </div>
          </DashboardShell>
     )
}
