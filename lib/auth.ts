import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { validateEnv } from "@/lib/env"

// Validate environment variables before configuring NextAuth
validateEnv()

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: {
                params: {
                    scope: "repo read:user user:email",
                },
            },
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: profile.name || profile.login,
                    email: profile.email || `${profile.login}@users.noreply.github.com`,
                    image: profile.avatar_url,
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session?.user && user) {
                // Fetch the account to get the access token
                const account = await prisma.account.findFirst({
                    where: {
                        userId: user.id,
                        provider: "github",
                    },
                })

                if (account?.access_token) {
                    session.accessToken = account.access_token
                }
            }
            return session
        },
    },
})
