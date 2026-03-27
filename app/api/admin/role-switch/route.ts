import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Owner emails who can switch roles for testing
const OWNER_EMAILS = [
    'rjassaf13@gmail.com',
    'ohaddad12@gmail.com',
    'sanazindustrial@gmail.com',
    'versorabusiness@gmail.com'
]

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user is an owner
        const isOwner = OWNER_EMAILS.includes(user.email) || user.isOwner

        return NextResponse.json({
            user,
            isOwner,
            canSwitchRoles: isOwner || user.role === 'ADMIN',
            availableRoles: isOwner
                ? ['OWNER', 'ADMIN', 'PROFESSOR', 'STUDENT']
                : user.role === 'ADMIN'
                    ? ['ADMIN', 'PROFESSOR', 'STUDENT']
                    : [user.role]
        })
    } catch (error) {
        console.error('Error fetching role info:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Only owners can actually switch roles
        const isOwner = OWNER_EMAILS.includes(user.email) || user.isOwner

        if (!isOwner) {
            return NextResponse.json({ error: 'Only platform owners can switch roles' }, { status: 403 })
        }

        const body = await req.json()
        const { targetRole, testMode } = body

        if (!['OWNER', 'ADMIN', 'PROFESSOR', 'STUDENT'].includes(targetRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // If test mode, just return the permissions for that role without actually switching
        if (testMode) {
            return NextResponse.json({
                success: true,
                testMode: true,
                viewingAs: targetRole,
                message: `Viewing permissions as ${targetRole}`,
                originalRole: user.role
            })
        }

        // Log the role switch for audit (console only - OwnerAccessLog model pending)
        console.log('[ROLE_SWITCH] Owner role switch:', {
            userId: user.id,
            fromRole: user.role,
            toRole: targetRole,
            timestamp: new Date().toISOString()
        })

        // Temporarily update user role (owner can always switch back)
        await prisma.user.update({
            where: { id: user.id },
            data: { role: targetRole }
        })

        return NextResponse.json({
            success: true,
            message: `Role switched to ${targetRole}`,
            newRole: targetRole,
            canRevert: true
        })
    } catch (error) {
        console.error('Error switching role:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
