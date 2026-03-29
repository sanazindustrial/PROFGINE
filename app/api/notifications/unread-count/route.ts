import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { notificationService } from '@/lib/services/notification.service'

export async function GET() {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ count: 0 })
        }

        const count = await notificationService.getUnreadCount(session.user.id)
        return NextResponse.json({ count })
    } catch {
        return NextResponse.json({ count: 0 })
    }
}
