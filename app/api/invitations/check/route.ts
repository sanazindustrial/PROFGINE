import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma/client'
import { checkRateLimit, getClientIP, rateLimiters } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    try {
        // Rate limit to prevent enumeration
        const clientIP = getClientIP(req)
        const rateCheck = checkRateLimit(rateLimiters.invitation, clientIP)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            )
        }

        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Check for valid invitation — do NOT reveal whether user already exists
        const invitation = await prisma.invitation.findUnique({
            where: { email }
        })

        const hasInvitation = invitation && invitation.status === 'PENDING'

        // Return only invitation status — never expose user existence
        return NextResponse.json(
            { hasInvitation: !!hasInvitation },
            { status: 200 }
        )

    } catch (error) {
        console.error('Invitation check error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}