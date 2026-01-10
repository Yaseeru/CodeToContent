import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { AuthenticationError, handleAPIError } from "@/lib/errors"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.accessToken) {
            throw new AuthenticationError("Unauthorized")
        }

        const github = new GitHubService(session.accessToken)
        const repos = await github.getRepositories()
        return NextResponse.json(repos)
    } catch (error) {
        return handleAPIError(error)
    }
}
