/**
 * Notifications API Route
 * Handles notification retrieval and management
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { notificationService, type NotificationType } from "@/lib/services/notification.service"

// =============================================================================
// GET /api/notifications - Get user's notifications
// =============================================================================

export async function GET(request: NextRequest) {
    const session = await requireSession()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    try {
        const notifications = await notificationService.getUserNotifications(session.user.id, limit)

        return NextResponse.json({
            success: true,
            notifications,
            count: notifications.length
        })
    } catch (error) {
        console.error('[Notifications API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}

// =============================================================================
// POST /api/notifications - Send a notification
// =============================================================================

export async function POST(request: NextRequest) {
    const session = await requireSession()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only professors and admins can send notifications
    if (session.user.role !== 'PROFESSOR' && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { type, recipientEmail, recipientName, subject, message, data, courseId, userId } = body

        if (!type || !recipientEmail || !subject || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: type, recipientEmail, subject, message' },
                { status: 400 }
            )
        }

        const result = await notificationService.sendNotification({
            type: type as NotificationType,
            recipientEmail,
            recipientName,
            subject,
            message,
            data,
            courseId,
            userId,
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('[Notifications API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send notification' },
            { status: 500 }
        )
    }
}

// =============================================================================
// PATCH /api/notifications - Mark notification as read
// =============================================================================

export async function PATCH(request: NextRequest) {
    const session = await requireSession()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { notificationId } = body

        if (!notificationId) {
            return NextResponse.json(
                { error: 'Missing required field: notificationId' },
                { status: 400 }
            )
        }

        const success = await notificationService.markAsRead(notificationId)

        return NextResponse.json({ success })

    } catch (error) {
        console.error('[Notifications API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update notification' },
            { status: 500 }
        )
    }
}
