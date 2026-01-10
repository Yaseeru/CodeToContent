import { auth } from "@/lib/auth"
import { GeminiService } from "@/lib/gemini"
import { GitHubService } from "@/lib/github"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { repoName, owner, commitSha } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 })
    }

    try {
        // 1. Fetch Diff
        const github = new GitHubService(session.accessToken)
        const diff = await github.getCommitDiff(owner, repoName, commitSha)

        // 2. Generate Content
        const gemini = new GeminiService(process.env.GEMINI_API_KEY)
        const drafts = await gemini.generateContent(diff, `Commit in ${repoName}`)

        return NextResponse.json({ drafts })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }
}
