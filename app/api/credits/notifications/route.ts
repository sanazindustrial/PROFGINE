import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notification.service'

// Check and trigger credit threshold notifications
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                creditBalance: true,
                monthlyCredits: true,
                role: true,
                subscriptionType: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Owners/admins have unlimited — no notifications needed
        if (user.role === 'ADMIN') {
            return NextResponse.json({ triggered: false, reason: 'Admin has unlimited credits' })
        }

        // Calculate monthly usage
        const currentMonthStart = new Date()
        currentMonthStart.setDate(1)
        currentMonthStart.setHours(0, 0, 0, 0)

        const usageResult = await prisma.creditTransaction.aggregate({
            where: {
                userId: user.id,
                amount: { lt: 0 },
                createdAt: { gte: currentMonthStart }
            },
            _sum: { amount: true }
        })

        const totalUsed = Math.abs(usageResult._sum.amount || 0)

        // Determine monthly allocation based on subscription tier
        const tierCredits: Record<string, number> = {
            FREE_TRIAL: 50,
            BASIC: 200,
            PREMIUM: 500,
            ENTERPRISE: -1,
        }
        const monthlyAllocation = tierCredits[user.subscriptionType] || 50

        if (monthlyAllocation <= 0) {
            return NextResponse.json({ triggered: false, reason: 'Unlimited plan' })
        }

        const usagePercent = Math.min(100, Math.round((totalUsed / monthlyAllocation) * 100))
        const remaining = Math.max(0, monthlyAllocation - totalUsed)

        // Send credit alert (service deduplicates per month)
        const result = await notificationService.sendCreditAlert(
            user.id,
            user.email || '',
            user.name || 'User',
            usagePercent,
            remaining,
            monthlyAllocation
        )

        return NextResponse.json({
            triggered: result?.success ?? false,
            usagePercent,
            remaining,
            monthlyAllocation,
            notificationId: result?.notificationId,
        })

    } catch (error) {
        console.error('Credit notification check error:', error)
        return NextResponse.json({ error: 'Failed to check credit notifications' }, { status: 500 })
    }
}
