import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, role: true, isOwner: true },
    })
    if (!user || user.role !== 'ADMIN') {
        return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
    }
    return { user }
}

// GET - Admin notifications
export async function GET(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unread') === 'true'

    try {
        const where: any = { userId: auth.user.id }
        if (unreadOnly) where.isRead = false

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        })

        const unreadCount = await prisma.notification.count({
            where: { userId: auth.user.id, isRead: false },
        })

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Admin notifications error:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }
}

// POST - Create admin notification (broadcast or targeted)
export async function POST(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    if (!auth.user.isOwner) {
        return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
    }

    try {
        const { title, message, type, priority, targetRole, targetUserId } = await request.json()

        if (!title || !message) {
            return NextResponse.json({ error: 'title and message are required' }, { status: 400 })
        }

        const notificationType = type || 'SYSTEM_ANNOUNCEMENT'
        const notificationPriority = priority || 'NORMAL'

        if (targetUserId) {
            // Send to specific user
            const notification = await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    type: notificationType,
                    title,
                    message,
                    priority: notificationPriority,
                },
            })
            return NextResponse.json({ notification, count: 1 })
        }

        // Broadcast to role or all users
        const where: any = {}
        if (targetRole) where.role = targetRole

        const users = await prisma.user.findMany({
            where,
            select: { id: true },
        })

        if (users.length > 0) {
            await prisma.notification.createMany({
                data: users.map(u => ({
                    userId: u.id,
                    type: notificationType,
                    title,
                    message,
                    priority: notificationPriority,
                })),
            })
        }

        // Audit log
        try {
            await prisma.auditLog.create({
                data: {
                    userId: auth.user.id,
                    userEmail: auth.user.email,
                    action: 'BROADCAST_NOTIFICATION',
                    resource: 'notifications',
                    details: `Sent "${title}" to ${users.length} users (role: ${targetRole || 'ALL'})`,
                },
            })
        } catch { /* non-blocking */ }

        return NextResponse.json({ count: users.length })
    } catch (error) {
        console.error('Create notification error:', error)
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    try {
        const { notificationIds, markAll } = await request.json()

        if (markAll) {
            await prisma.notification.updateMany({
                where: { userId: auth.user.id, isRead: false },
                data: { isRead: true },
            })
        } else if (notificationIds?.length) {
            await prisma.notification.updateMany({
                where: { id: { in: notificationIds }, userId: auth.user.id },
                data: { isRead: true },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update notifications error:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }
}
