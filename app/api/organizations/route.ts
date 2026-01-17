import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createEnhancedSubscriptionManager } from '@/lib/enhanced-subscription-manager-v2'

// Get organization info and members
export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                organizationMembers: {
                    include: {
                        org: {
                            include: {
                                members: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                email: true,
                                                name: true,
                                                role: true,
                                                creditBalance: true,
                                                subscriptionType: true
                                            }
                                        }
                                    }
                                },
                                subscription: true
                            }
                        }
                    }
                }
            }
        })

        if (!user || !user.organizationMembers.length) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        const organization = user.organizationMembers[0].org
        const userRole = user.organizationMembers[0].orgRole

        // Only admins can see full organization details
        if (userRole !== 'ADMIN') {
            return NextResponse.json({
                organization: {
                    id: organization.id,
                    name: organization.name,
                    subscriptionTier: organization.subscription?.tier
                }
            })
        }

        return NextResponse.json({
            organization: {
                ...organization,
                totalMembers: organization.members.length,
                membersByRole: {
                    owner: organization.members.filter(m => m.orgRole === 'OWNER').length,
                    admin: organization.members.filter(m => m.orgRole === 'ADMIN').length,
                    member: organization.members.filter(m => m.orgRole === 'MEMBER').length
                }
            },
            members: organization.members.map(member => ({
                id: member.id,
                user: member.user,
                role: member.orgRole,
                joinedAt: member.createdAt
            }))
        })

    } catch (error) {
        console.error('Get organization error:', error)
        return NextResponse.json({ error: 'Failed to retrieve organization information' }, { status: 500 })
    }
}

// Create new organization (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, subscriptionTier } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // Create organization
        const organization = await prisma.organization.create({
            data: {
                name
            }
        })

        // Create organization subscription
        if (subscriptionTier) {
            await prisma.orgSubscription.create({
                data: {
                    orgId: organization.id,
                    tier: subscriptionTier || 'FREE_TRIAL',
                    status: 'ACTIVE'
                }
            })
        }

        // Add the admin as organization admin
        await prisma.organizationMember.create({
            data: {
                userId: user.id,
                orgId: organization.id,
                orgRole: 'ADMIN'
            }
        })

        return NextResponse.json({
            organization,
            message: 'Organization created successfully'
        })

    } catch (error) {
        console.error('Create organization error:', error)
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }
}

// Update organization settings (admin only)
export async function PUT(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { organizationId, name, subscriptionTier } = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                organizationMembers: {
                    where: {
                        orgId: organizationId,
                        orgRole: 'ADMIN'
                    }
                }
            }
        })

        if (!user || !user.organizationMembers.length) {
            return NextResponse.json({ error: 'Admin access required for this organization' }, { status: 403 })
        }

        const updateData: any = {}
        if (name) updateData.name = name

        const updatedOrg = await prisma.organization.update({
            where: { id: organizationId },
            data: updateData
        })

        // Update subscription if provided
        if (subscriptionTier) {
            await prisma.orgSubscription.upsert({
                where: { orgId: organizationId },
                create: {
                    orgId: organizationId,
                    tier: subscriptionTier,
                    status: 'ACTIVE'
                },
                update: {
                    tier: subscriptionTier
                }
            })
        }

        return NextResponse.json({
            organization: updatedOrg,
            message: 'Organization updated successfully'
        })

    } catch (error) {
        console.error('Update organization error:', error)
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }
}