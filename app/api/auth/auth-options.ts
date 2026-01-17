import { prisma } from "@/prisma/client"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "@prisma/client"

// Check if Google OAuth is configured
const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        // Google OAuth (if configured)
        ...(hasGoogleConfig ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            })
        ] : []),

        // Demo/Guest login (always available)
        CredentialsProvider({
            id: "guest",
            name: "Guest Access",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "demo@example.com" }
            },
            async authorize(credentials) {
                // For demo purposes - in production, you'd validate credentials
                const email = credentials?.email || "guest@demo.com"

                // Allow guest access in development or if explicitly enabled
                if (process.env.NODE_ENV === "development" || process.env.ALLOW_GUEST_ACCESS === "true") {
                    return {
                        id: "guest-" + Date.now(),
                        email: email,
                        name: "Guest User",
                        role: UserRole.STUDENT,
                    }
                }

                return null
            }
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async signIn({ user, account }) {
            // Skip database checks for guest/demo accounts
            if (account?.provider === "guest") {
                return true
            }

            // Original invitation-based logic for Google OAuth
            if (account?.provider === "google") {
                const userExist = await prisma.user.findUnique({
                    where: { email: user.email! },
                })
                if (userExist) return true

                // Allow new users to sign up via Google OAuth
                return true
            }

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.isGuest = user.id?.startsWith("guest-") || false
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).isGuest = token.isGuest as boolean
            }
            return session
        },
    },
    pages: {
        signIn: '/login', // Use our custom direct login page
    },
}

// Helper to get auth status
export function getAuthStatus() {
    return {
        hasGoogleOAuth: hasGoogleConfig,
        allowsGuests: process.env.NODE_ENV === "development" || process.env.ALLOW_GUEST_ACCESS === "true",
        isProduction: process.env.NODE_ENV === "production",
    }
}
