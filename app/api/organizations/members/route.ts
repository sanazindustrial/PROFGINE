import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Add member to organization
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { organizationId, email, role } = await request.json()

        if (!organizationId || !email || !role) {
            return NextResponse.json({ error: 'Organization ID, email, and role are required' }, { status: 400 })
        }

        // Check if user is admin of the organization
        const userMembership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                orgId: organizationId,
                orgRole: 'ADMIN'
            }
        })

        if (!userMembership) {
            return NextResponse.json({ error: 'Admin access required for this organization' }, { status: 403 })
        }

        // Find or create the user
        let targetUser = await prisma.user.findUnique({
            where: { email }
        })

        if (!targetUser) {
            // Create new user account
            targetUser = await prisma.user.create({
                data: {
                    email,
                    name: email.split('@')[0], // Default name from email
                    role: role === 'ADMIN' ? 'ADMIN' : role === 'PROFESSOR' ? 'PROFESSOR' : 'STUDENT',
                    subscriptionType: 'FREE',
                    creditBalance: role === 'PROFESSOR' ? 100 : 10, // Default credits based on role
                    monthlyCredits: role === 'PROFESSOR' ? 100 : 10
                }
            })
        }

        // Check if user is already a member
        const existingMembership = await prisma.organizationMember.findFirst({
            where: {
                userId: targetUser.id,
                orgId: organizationId
            }
        })

        if (existingMembership) {
            return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 })
        }

        // Add user to organization
        const membership = await prisma.organizationMember.create({
            data: {
                userId: targetUser.id,
                orgId: organizationId,
                orgRole: role.toUpperCase()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                }
            }
        })

        // Update user role if needed (for professors and admins)
        if (role === 'PROFESSOR' && targetUser.role === 'STUDENT') {
            await prisma.user.update({
                where: { id: targetUser.id },
                data: { role: 'PROFESSOR' }
            })
        } else if (role === 'ADMIN' && targetUser.role !== 'ADMIN') {
            await prisma.user.update({
                where: { id: targetUser.id },
                data: { role: 'ADMIN' }
            })
        }

        return NextResponse.json({
            membership,
            message: 'User added to organization successfully'
        })

    } catch (error) {
        console.error('Add organization member error:', error)
        return NextResponse.json({ error: 'Failed to add member to organization' }, { status: 500 })
    }
}

// Update member role
export async function PUT(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { membershipId, role } = await request.json()

        if (!membershipId || !role) {
            return NextResponse.json({ error: 'Membership ID and role are required' }, { status: 400 })
        }

        // Get the membership to check organization
        const membership = await prisma.organizationMember.findUnique({
            where: { id: membershipId },
            include: {
                org: true,
                user: true
            }
        })

        if (!membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
        }

        // Check if requesting user is admin of the organization
        const userMembership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                orgId: membership.orgId,
                orgRole: 'ADMIN'
            }
        })

        if (!userMembership) {
            return NextResponse.json({ error: 'Admin access required for this organization' }, { status: 403 })
        }

        // Update membership role
        const updatedMembership = await prisma.organizationMember.update({
            where: { id: membershipId },
            data: { orgRole: role.toUpperCase() },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                }
            }
        })

        // Update user's global role if promoting
        if (role === 'PROFESSOR' && membership.user.role === 'STUDENT') {
            await prisma.user.update({
                where: { id: membership.userId },
                data: { role: 'PROFESSOR' }
            })
        } else if (role === 'ADMIN' && membership.user.role !== 'ADMIN') {
            await prisma.user.update({
                where: { id: membership.userId },
                data: { role: 'ADMIN' }
            })
        }

        return NextResponse.json({
            membership: updatedMembership,
            message: 'Member role updated successfully'
        })

    } catch (error) {
        console.error('Update organization member error:', error)
        return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }
}

// Remove member from organization
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const membershipId = searchParams.get('membershipId')

        if (!membershipId) {
            return NextResponse.json({ error: 'Membership ID is required' }, { status: 400 })
        }

        // Get the membership to check organization
        const membership = await prisma.organizationMember.findUnique({
            where: { id: membershipId },
            include: {
                org: true
            }
        })

        if (!membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
        }

        // Check if requesting user is admin of the organization
        const userMembership = await prisma.organizationMember.findFirst({
            where: {
                userId: session.user.id,
                orgId: membership.orgId,
                orgRole: 'ADMIN'
            }
        })

        if (!userMembership && session.user.id !== membership.userId) {
            return NextResponse.json({ error: 'Admin access required or can only remove yourself' }, { status: 403 })
        }

        // Don't allow removing the last admin
        if (membership.orgRole === 'ADMIN') {
            const adminCount = await prisma.organizationMember.count({
                where: {
                    orgId: membership.orgId,
                    orgRole: 'ADMIN'
                }
            })

            if (adminCount <= 1) {
                return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 })
            }
        }

        // Remove membership
        await prisma.organizationMember.delete({
            where: { id: membershipId }
        })

        return NextResponse.json({
            message: 'Member removed from organization successfully'
        })

    } catch (error) {
        console.error('Remove organization member error:', error)
        return NextResponse.json({ error: 'Failed to remove member from organization' }, { status: 500 })
    }
}