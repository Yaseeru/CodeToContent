"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { ContentPreview } from "@/components/features/ContentPreview"
import { ContentDraft } from "@/types"
import { Spinner } from "@/components/ui/icons/Spinner"
import { FileText } from "@/components/ui/icons/FileText"

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
                         content: `Just upgraded our AI model to Gemini 1.5 Pro!\n\nThe reasoning capabilities are insane. We were hitting limits with complex code diffs, but the larger context window changes everything.\n\nCheck out the diff below #BuildInPublic #AI`
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
          <div className="flex flex-col gap-4 h-full">
               {/* Header with Generate Button */}
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-h2 font-semibold">Drafts</h2>
                         <p className="text-caption text-foreground-secondary">
                              AI-generated content based on the selected code
                         </p>
                    </div>
                    <Button
                         onClick={handleGenerate}
                         disabled={isGenerating}
                         variant="primary"
                         size="lg"
                         loading={isGenerating}
                    >
                         {isGenerating ? "Analyzing..." : "Generate Content"}
                    </Button>
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-auto">
                    {drafts.length > 0 ? (
                         <ContentPreview drafts={drafts} />
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-foreground-secondary">
                              <FileText size="lg" className="mb-4 opacity-50" />
                              <p className="text-body">Select code and click Generate</p>
                         </div>
                    )}
               </div>
          </div>
     )
}
