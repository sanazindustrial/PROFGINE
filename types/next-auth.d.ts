import { DefaultSession, DefaultUser } from "next-auth"
import { UserRole, SubscriptionType, SubscriptionStatus } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            subscriptionType?: SubscriptionType
            subscriptionExpiresAt?: Date
            trialExpiresAt?: Date
            subscriptionStatus?: SubscriptionStatus
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role: UserRole
        subscriptionType?: SubscriptionType
        subscriptionExpiresAt?: Date
        trialExpiresAt?: Date
        subscriptionStatus?: SubscriptionStatus
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        subscriptionType?: SubscriptionType
        subscriptionExpiresAt?: Date
        trialExpiresAt?: Date
        subscriptionStatus?: SubscriptionStatus
    }
}