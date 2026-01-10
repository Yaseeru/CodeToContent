import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { AuthenticationError, handleAPIError } from "@/lib/errors"
import { withLogging, withRateLimit, getRequestContext } from "@/lib/middleware"
import { NextResponse } from "next/server"

async function handler(req: Request) {
    try {
        const session = await auth()

        if (!session?.accessToken) {
            throw new AuthenticationError("Unauthorized")
        }

        const github = new GitHubService(session.accessToken)
        const repos = await github.getRepositories()
        return NextResponse.json(repos)
    } catch (error) {
        const requestContext = await getRequestContext(req)
        return handleAPIError(error, requestContext)
    }
}

export const GET = withRateLimit(withLogging(handler))
