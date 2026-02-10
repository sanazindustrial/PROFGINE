import { getServerSession } from "next-auth/next"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"
import { SubscriptionType, UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({
                authenticated: false,
                redirectUrl: '/auth/signin',
                message: 'Not authenticated'
            })
        }

        // Force profile completion when name/image missing
        if (!session.user?.name || !session.user?.image) {
            return NextResponse.json({
                authenticated: true,
                user: {
                    email: session.user?.email,
                    name: session.user?.name,
                    role: session.user?.role,
                    subscriptionType: session.user?.subscriptionType,
                    trialExpiresAt: session.user?.trialExpiresAt
                },
                redirectUrl: '/dashboard/profile',
                timestamp: new Date().toISOString()
            })
        }

        // Determine where user should be redirected based on their role/subscription
        let redirectUrl = '/trial-dashboard' // default

        if (session.user?.role === UserRole.ADMIN) {
            redirectUrl = '/user-management'
        } else {
            const subscriptionType = session.user?.subscriptionType
            const trialExpired = session.user?.trialExpiresAt &&
                new Date() > new Date(session.user.trialExpiresAt)

            switch (subscriptionType) {
                case SubscriptionType.FREE:
                    redirectUrl = trialExpired ? '/subscription/upgrade' : '/trial-dashboard'
                    break
                case SubscriptionType.BASIC:
                case SubscriptionType.PREMIUM:
                    redirectUrl = '/dashboard'
                    break
                default:
                    redirectUrl = '/trial-dashboard'
            }
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                email: session.user?.email,
                name: session.user?.name,
                role: session.user?.role,
                subscriptionType: session.user?.subscriptionType,
                trialExpiresAt: session.user?.trialExpiresAt
            },
            redirectUrl: redirectUrl,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        return NextResponse.json({
            error: 'Failed to check redirect status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}