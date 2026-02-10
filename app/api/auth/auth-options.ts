import { authOptions as baseAuthOptions } from "@/lib/auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "@prisma/client"

const allowGuest = process.env.NODE_ENV === "development" || process.env.ALLOW_GUEST_ACCESS === "true"

const guestProvider = CredentialsProvider({
    id: "guest",
    name: "Guest Access",
    credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" }
    },
    async authorize(credentials) {
        if (!allowGuest) return null

        const email = credentials?.email || "guest@demo.com"

        return {
            id: "guest-" + Date.now(),
            email,
            name: "Guest User",
            role: UserRole.STUDENT,
        }
    }
})

export const authOptions = {
    ...baseAuthOptions,
    providers: allowGuest
        ? [...(baseAuthOptions.providers || []), guestProvider]
        : baseAuthOptions.providers,
}

export function getAuthStatus() {
    return {
        hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        allowsGuests: allowGuest,
        isProduction: process.env.NODE_ENV === "production",
    }
}
