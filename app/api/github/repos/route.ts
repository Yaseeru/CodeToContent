import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()

    // @ts-expect-error: Custom session property
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // @ts-expect-error: Custom session property
        const github = new GitHubService(session.accessToken)
        const repos = await github.getRepositories()
        return NextResponse.json(repos)
    } catch {
        return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 })
    }
}
