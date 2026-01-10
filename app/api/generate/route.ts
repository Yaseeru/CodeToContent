import { auth } from "@/lib/auth"
import { GeminiService } from "@/lib/gemini"
import { GitHubService } from "@/lib/github"
import { GenerateContentSchema, validateInput } from "@/lib/validation"
import { AuthenticationError, handleAPIError } from "@/lib/errors"
import { withLogging, getRequestContext } from "@/lib/middleware"
import { NextResponse } from "next/server"

async function handler(req: Request) {
    try {
        const session = await auth()

        if (!session?.accessToken) {
            throw new AuthenticationError("Unauthorized")
        }

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API Key missing")
        }

        // Parse and validate request body
        const body = await req.json()
        const validatedData = validateInput(GenerateContentSchema, body)

        const { repoName, owner, commitSha } = validatedData

        // 1. Fetch Diff
        const github = new GitHubService(session.accessToken)
        const diff = await github.getCommitDiff(owner, repoName, commitSha)

        // 2. Generate Content
        const gemini = new GeminiService(process.env.GEMINI_API_KEY)
        const drafts = await gemini.generateContent(diff, `Commit in ${repoName}`)

        return NextResponse.json({ drafts })
    } catch (error) {
        const requestContext = await getRequestContext(req)
        return handleAPIError(error, requestContext)
    }
}

export const POST = withLogging(handler)
