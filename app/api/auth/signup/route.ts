import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma/client'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 409 }
            )
        }

        // Check for valid invitation (optional - can be disabled for open signup)
        const invitation = await prisma.invitation.findUnique({
            where: { email }
        })

        // If invitations are enabled, verify the invitation
        if (process.env.REQUIRE_INVITATION === 'true') {
            if (!invitation || invitation.status !== 'PENDING') {
                return NextResponse.json(
                    { error: 'No valid invitation found for this email' },
                    { status: 403 }
                )
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user with role from invitation or default to STUDENT
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: invitation?.role || 'STUDENT',
            }
        })

        // Mark invitation as accepted if it exists
        if (invitation) {
            await prisma.invitation.update({
                where: { email },
                data: { status: 'ACCEPTED' }
            })
        }

        return NextResponse.json(
            { message: 'User created successfully', userId: newUser.id },
            { status: 201 }
        )

    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}