"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Code, FileText, Copy, Check } from "@/components/ui/icons"
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

    const getContentTypeIcon = (type: ContentDraft['type']) => {
        switch (type) {
            case 'twitter':
                return <Code size="sm" className="text-accent" />
            case 'linkedin':
                return <FileText size="sm" className="text-accent" />
            case 'blog':
                return <FileText size="sm" className="text-accent" />
        }
    }

    const getContentTypeLabel = (type: ContentDraft['type']) => {
        switch (type) {
            case 'twitter':
                return 'X Thread'
            case 'linkedin':
                return 'LinkedIn Post'
            case 'blog':
                return 'Blog Outline'
        }
    }

    if (drafts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText size="lg" className="text-foreground-secondary mb-4" />
                <p className="text-body text-foreground-secondary">
                    No content drafts available
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {drafts.map((draft) => (
                <Card key={draft.id} variant="default">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="flex items-center gap-2 text-h3 font-medium text-accent">
                            {getContentTypeIcon(draft.type)}
                            {getContentTypeLabel(draft.type)}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={copiedId === draft.id ? <Check size="sm" /> : <Copy size="sm" />}
                            onClick={() => handleCopy(draft)}
                            aria-label={copiedId === draft.id ? "Copied to clipboard" : "Copy to clipboard"}
                        >
                            {copiedId === draft.id ? 'Copied' : 'Copy'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-wrap text-body text-foreground leading-relaxed">
                            {draft.content}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
