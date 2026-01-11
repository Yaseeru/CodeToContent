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

/**
 * Generate Client Component
 * 
 * Client-side component for generating content from code.
 * Provides interface for triggering content generation and displaying results.
 * 
 * Requirements:
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 * - 4.1-4.13, 5.1-5.11: Theme-appropriate colors
 * - 12.1-12.4: Detail pane with editor-like experience
 * - 13.1-13.8: Visual design constraints
 * - 14.1-14.5: Keyboard accessibility
 */
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
          <div className="flex flex-col gap-lg h-full">
               {/* Header with Generate Button */}
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-md font-semibold text-text-primary">Drafts</h2>
                         <p className="text-sm text-text-secondary">
                              AI-generated content based on the selected code
                         </p>
                    </div>
                    <Button
                         onClick={handleGenerate}
                         disabled={isGenerating}
                         variant="primary"
                         loading={isGenerating}
                         aria-label={isGenerating ? "Generating content, please wait" : "Generate content from code"}
                    >
                         {isGenerating ? "Analyzing..." : "Generate Content"}
                    </Button>
               </div>

               {/* Screen reader announcement for generation status */}
               <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {isGenerating && "Generating content, please wait..."}
                    {!isGenerating && drafts.length > 0 && `Generated ${drafts.length} content drafts`}
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-auto">
                    {drafts.length > 0 ? (
                         <ContentPreview drafts={drafts} />
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-text-secondary" role="status">
                              <FileText size="lg" className="mb-lg text-text-muted" aria-hidden="true" />
                              <p className="text-sm">Select code and click Generate</p>
                         </div>
                    )}
               </div>
          </div>
     )
}
