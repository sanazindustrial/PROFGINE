import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma/client'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { hasInvitation: true, userExists: true },
                { status: 200 }
            )
        }

        // Check for valid invitation
        const invitation = await prisma.invitation.findUnique({
            where: { email }
        })

        const hasInvitation = invitation && invitation.status === 'PENDING'

        return NextResponse.json(
            { hasInvitation, userExists: false },
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