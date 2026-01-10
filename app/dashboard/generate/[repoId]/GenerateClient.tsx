"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { ContentPreview } from "@/components/features/ContentPreview"
import { ContentDraft } from "@/types"

interface GenerateClientProps {
     repoName: string;
     commitMessage: string;
}

export function GenerateClient({ repoName, commitMessage }: GenerateClientProps) {
     const [isGenerating, setIsGenerating] = React.useState(false)
     const [drafts, setDrafts] = React.useState<ContentDraft[]>([])

     const handleGenerate = () => {
          setIsGenerating(true)
          // Simulate API delay
          setTimeout(() => {
               setDrafts([
                    {
                         id: '1',
                         type: 'twitter',
                         tone: 'casual',
                         content: `Just upgraded our AI model to Gemini 1.5 Pro! 🚀\n\nThe reasoning capabilities are insane. We were hitting limits with complex code diffs, but the larger context window changes everything.\n\nCheck out the diff below 👇 #BuildInPublic #AI`
                    },
                    {
                         id: '2',
                         type: 'linkedin',
                         tone: 'professional',
                         content: `I'm excited to share a significant infrastructure update for ${repoName}.\n\nWe've successfully migrated our insight extraction engine to Gemini 1.5 Pro. This shift allows us to process significantly larger codebases and derive more nuanced technical insights.\n\nAuthenticity in developer content comes from understanding the "why" behind the code. This upgrade brings us one step closer to perfect translation of engineering effort into communication value.`
                    }
               ])
               setIsGenerating(false)
          }, 2000)
     }

     return (
          <>
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-2xl font-bold">Code Context</h2>
                         <p className="text-sm text-foreground-secondary">
                              Selected commit: <span className="font-mono text-accent">{commitMessage}</span>
                         </p>
                    </div>
                    <Button
                         onClick={handleGenerate}
                         disabled={isGenerating}
                         size="lg"
                    >
                         {isGenerating ? "Analyzing..." : "Generate Content ✨"}
                    </Button>
               </div>

               {/* Right Panel: Output */}
               <div className="flex-1 flex flex-col gap-6 bg-background-secondary/30 rounded-xl p-6 border border-dashed border-border">
                    <div>
                         <h2 className="text-2xl font-bold">Drafts</h2>
                         <p className="text-sm text-foreground-secondary">
                              AI-generated content based on the selected code.
                         </p>
                    </div>

                    <div className="flex-1 overflow-auto">
                         {drafts.length > 0 ? (
                              <ContentPreview drafts={drafts} />
                         ) : (
                              <div className="h-full flex flex-col items-center justify-center text-foreground-secondary opacity-50">
                                   <div className="text-4xl mb-4">🪄</div>
                                   <p>Select code and click Generate</p>
                              </div>
                         )}
                    </div>
               </div>
          </>
     )
}
