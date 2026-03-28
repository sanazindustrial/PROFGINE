import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getBillingContext } from '@/lib/access/getBillingContext'
import CreditUsageClient from './credit-usage-client'

export default async function CreditsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect('/auth/signin')
    }

    const billingContext = await getBillingContext()

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            role: true,
            isOwner: true,
            name: true,
            email: true,
            creditBalance: true,
            monthlyCredits: true,
            subscriptionType: true,
        }
    })

    if (!user) {
        redirect('/auth/signin')
    }

    // Get current month usage by feature
    const currentMonthStart = new Date()
    currentMonthStart.setDate(1)
    currentMonthStart.setHours(0, 0, 0, 0)

    const monthlyUsage = await prisma.creditTransaction.groupBy({
        by: ['featureType'],
        where: {
            userId: user.id,
            type: 'USAGE',
            createdAt: { gte: currentMonthStart }
        },
        _sum: { amount: true },
        _count: true,
    })

    // Recent transactions
    const recentTransactions = await prisma.creditTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
    })

    // Feature costs from DB (or defaults)
    let featureCosts = await prisma.featureCost.findMany({
        where: { isActive: true },
        orderBy: { displayName: 'asc' }
    })

    // Get usage counter
    const usageCounter = await prisma.userUsageCounter.findUnique({
        where: { userId: user.id }
    })

    // Determine monthly credit allocation based on billing tier
    const tierCredits: Record<string, number> = {
        FREE_TRIAL: 50,
        BASIC: 200,
        PREMIUM: 500,
        ENTERPRISE: -1, // unlimited
    }
    const monthlyAllocation = tierCredits[billingContext.tier] ?? 50

    return (
        <CreditUsageClient
            user={{
                ...user,
                name: user.name ?? undefined,
            }}
            billingTier={billingContext.tier}
            monthlyAllocation={monthlyAllocation}
            creditBalance={user.creditBalance}
            monthlyCredits={user.monthlyCredits}
            monthlyUsage={monthlyUsage.map(u => ({
                featureType: u.featureType,
                totalUsed: Math.abs(u._sum.amount || 0),
                count: u._count,
            }))}
            recentTransactions={recentTransactions.map(t => ({
                id: t.id,
                amount: t.amount,
                type: t.type,
                description: t.description,
                featureType: t.featureType,
                createdAt: t.createdAt.toISOString(),
            }))}
            featureCosts={featureCosts.map(fc => ({
                featureType: fc.featureType,
                creditCost: fc.creditCost,
                displayName: fc.displayName,
                description: fc.description,
            }))}
            usageCounter={usageCounter ? {
                creditsUsed: (usageCounter as any).creditsUsed ?? 0,
                creditsRemaining: (usageCounter as any).creditsRemaining ?? user.creditBalance,
                periodStart: usageCounter.periodStart.toISOString(),
            } : null}
        />
    )
}
