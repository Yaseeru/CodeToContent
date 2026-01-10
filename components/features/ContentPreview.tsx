"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ContentDraft } from "@/types"

interface ContentPreviewProps {
    drafts: ContentDraft[];
}

export function ContentPreview({ drafts }: ContentPreviewProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = async (draft: ContentDraft) => {
        try {
            await navigator.clipboard.writeText(draft.content)
            setCopiedId(draft.id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
        }
    }

    return (
        <div className="space-y-6">
            {drafts.map((draft) => (
                <Card key={draft.id} className="border border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-medium text-accent">
                            {draft.type === 'twitter' ? '🐦 X Thread' :
                                draft.type === 'linkedin' ? '💼 LinkedIn Post' : '📝 Blog Outline'}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => handleCopy(draft)}
                        >
                            {copiedId === draft.id ? '✓ Copied' : 'Copy'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">
                            {draft.content}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
