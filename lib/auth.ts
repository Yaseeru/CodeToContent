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
                    scope: "repo read:user",
                },
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                // @ts-expect-error: Extending session type
                session.accessToken = token.accessToken
            }
            return session
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
    },
})
