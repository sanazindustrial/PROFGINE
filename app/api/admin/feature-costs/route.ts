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

async function logAudit(userId: string | null, userEmail: string | null, action: string, resource: string, details?: string) {
    try {
        await prisma.auditLog.create({
            data: { userId, userEmail, action, resource, details }
        })
    } catch { /* non-blocking */ }
}

const DEFAULT_FEATURE_COSTS = [
    { featureType: 'COURSE_CREATION', creditCost: 5, dollarPrice: 0.50, displayName: 'Course Creation', description: 'Create a new course' },
    { featureType: 'ASSIGNMENT_CREATION', creditCost: 2, dollarPrice: 0.20, displayName: 'Assignment Creation', description: 'Create a new assignment' },
    { featureType: 'DISCUSSION_CREATION', creditCost: 1, dollarPrice: 0.10, displayName: 'Discussion Creation', description: 'Create a discussion thread' },
    { featureType: 'CUSTOM_RUBRICS', creditCost: 3, dollarPrice: 0.30, displayName: 'Custom Rubrics', description: 'Create custom grading rubric' },
    { featureType: 'AI_GRADING', creditCost: 1, dollarPrice: 0.10, displayName: 'AI Grading', description: 'AI-powered grading per submission' },
    { featureType: 'ADVANCED_ANALYTICS', creditCost: 5, dollarPrice: 0.50, displayName: 'Advanced Analytics', description: 'Generate analytics report' },
    { featureType: 'BULK_OPERATIONS', creditCost: 10, dollarPrice: 1.00, displayName: 'Bulk Operations', description: 'Bulk grading or operations' },
    { featureType: 'API_ACCESS', creditCost: 15, dollarPrice: 1.50, displayName: 'API Access', description: 'External API usage per call' },
    { featureType: 'PROFESSOR_STYLE_LEARNING', creditCost: 8, dollarPrice: 0.80, displayName: 'Professor Style Learning', description: 'AI learns professor grading style' },
    { featureType: 'ORGANIZATION_MANAGEMENT', creditCost: 20, dollarPrice: 2.00, displayName: 'Organization Management', description: 'Organization management operations' },
    { featureType: 'CUSTOM_PROMPTS', creditCost: 3, dollarPrice: 0.30, displayName: 'Custom Prompts', description: 'Custom AI prompt templates' },
    { featureType: 'PRESENTATION_GENERATION', creditCost: 5, dollarPrice: 0.50, displayName: 'Presentation Generation', description: 'Generate AI presentations' },
    { featureType: 'COURSE_DESIGN', creditCost: 10, dollarPrice: 1.00, displayName: 'Course Design Studio', description: 'AI course design assistance' },
] as const

// GET - Retrieve all feature costs + earnings summary
export async function GET(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const url = new URL(request.url)
    const include = url.searchParams.get('include')

    try {
        let featureCosts = await prisma.featureCost.findMany({
            orderBy: { displayName: 'asc' }
        })

        // Seed defaults if empty
        if (featureCosts.length === 0) {
            await prisma.featureCost.createMany({
                data: DEFAULT_FEATURE_COSTS.map(fc => ({
                    featureType: fc.featureType as any,
                    creditCost: fc.creditCost,
                    dollarPrice: fc.dollarPrice,
                    displayName: fc.displayName,
                    description: fc.description,
                }))
            })
            featureCosts = await prisma.featureCost.findMany({
                orderBy: { displayName: 'asc' }
            })
        }

        const response: any = { featureCosts }

        // Include earnings data if requested
        if (include === 'earnings') {
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const last12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1)

            // Monthly revenue from credit purchases
            const purchases = await prisma.creditTransaction.findMany({
                where: {
                    type: 'PURCHASE',
                    createdAt: { gte: last12Months }
                },
                orderBy: { createdAt: 'asc' }
            })

            // Monthly usage
            const usage = await prisma.creditTransaction.findMany({
                where: {
                    type: 'USAGE',
                    createdAt: { gte: last12Months }
                },
                orderBy: { createdAt: 'asc' }
            })

            // Aggregate by month
            const monthlyData: Record<string, { revenue: number; usage: number; transactions: number }> = {}
            for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                monthlyData[key] = { revenue: 0, usage: 0, transactions: 0 }
            }

            // Credit packages pricing (50 credits = $4.99 → ~$0.10/credit)
            const dollarPerCredit = 0.10

            for (const p of purchases) {
                const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`
                if (monthlyData[key]) {
                    monthlyData[key].revenue += p.amount * dollarPerCredit
                    monthlyData[key].transactions++
                }
            }

            for (const u of usage) {
                const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`
                if (monthlyData[key]) {
                    monthlyData[key].usage += Math.abs(u.amount)
                }
            }

            // This month stats
            const thisMonthPurchases = purchases.filter(p => p.createdAt >= startOfMonth)
            const thisMonthUsage = usage.filter(u => u.createdAt >= startOfMonth)
            const totalRevenue = purchases.reduce((s, p) => s + p.amount * dollarPerCredit, 0)
            const thisMonthRevenue = thisMonthPurchases.reduce((s, p) => s + p.amount * dollarPerCredit, 0)
            const totalUsageCredits = usage.reduce((s, u) => s + Math.abs(u.amount), 0)
            const thisMonthUsageCredits = thisMonthUsage.reduce((s, u) => s + Math.abs(u.amount), 0)

            // Usage by feature type
            const featureUsage = await prisma.creditTransaction.groupBy({
                by: ['featureType'],
                where: { type: 'USAGE', featureType: { not: null } },
                _sum: { amount: true },
                _count: true,
            })

            // User counts
            const totalUsers = await prisma.user.count()
            const activeUsers = await prisma.user.count({
                where: { creditTransactions: { some: { createdAt: { gte: startOfMonth } } } }
            })

            // Break-even analysis
            // Estimated monthly fixed costs (server, AI API, maintenance)
            const estimatedMonthlyCosts = 150 // $150/month base operational cost
            const avgMonthlyRevenue = totalRevenue / 12
            const breakEvenCredits = Math.ceil(estimatedMonthlyCosts / dollarPerCredit)

            response.earnings = {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
                totalUsageCredits,
                thisMonthUsageCredits,
                totalUsers,
                activeUsers,
                dollarPerCredit,
                monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
                    month,
                    revenue: Math.round(data.revenue * 100) / 100,
                    usage: data.usage,
                    transactions: data.transactions,
                })),
                featureUsage: featureUsage.map(f => ({
                    featureType: f.featureType,
                    totalCredits: Math.abs(f._sum.amount || 0),
                    count: f._count,
                })),
                breakEven: {
                    estimatedMonthlyCosts,
                    avgMonthlyRevenue: Math.round(avgMonthlyRevenue * 100) / 100,
                    breakEvenCredits,
                    isBreakEven: avgMonthlyRevenue >= estimatedMonthlyCosts,
                    shortfall: Math.max(0, Math.round((estimatedMonthlyCosts - avgMonthlyRevenue) * 100) / 100),
                },
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Get feature costs error:', error)
        return NextResponse.json({ error: 'Failed to get feature costs' }, { status: 500 })
    }
}

// PUT - Update a feature cost (owner-admin only)
export async function PUT(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    if (!auth.user.isOwner) {
        return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
    }

    try {
        const { featureType, creditCost, dollarPrice, isActive } = await request.json()

        if (!featureType) {
            return NextResponse.json({ error: 'featureType is required' }, { status: 400 })
        }

        if (creditCost !== undefined && (typeof creditCost !== 'number' || creditCost < 0)) {
            return NextResponse.json({ error: 'creditCost must be a non-negative number' }, { status: 400 })
        }

        if (dollarPrice !== undefined && (typeof dollarPrice !== 'number' || dollarPrice < 0)) {
            return NextResponse.json({ error: 'dollarPrice must be a non-negative number' }, { status: 400 })
        }

        const updated = await prisma.featureCost.upsert({
            where: { featureType },
            update: {
                ...(creditCost !== undefined && { creditCost }),
                ...(dollarPrice !== undefined && { dollarPrice }),
                ...(isActive !== undefined && { isActive }),
            },
            create: {
                featureType,
                creditCost: creditCost ?? 1,
                dollarPrice: dollarPrice ?? 0,
                displayName: featureType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                isActive: isActive ?? true,
            }
        })

        // Audit log
        const changes: string[] = []
        if (creditCost !== undefined) changes.push(`creditCost=${creditCost}`)
        if (dollarPrice !== undefined) changes.push(`dollarPrice=$${dollarPrice}`)
        if (isActive !== undefined) changes.push(`isActive=${isActive}`)
        await logAudit(
            auth.user.id,
            auth.user.email ?? null,
            'UPDATE_FEATURE_COST',
            featureType,
            changes.join(', ')
        )

        return NextResponse.json({ featureCost: updated })
    } catch (error) {
        console.error('Update feature cost error:', error)
        return NextResponse.json({ error: 'Failed to update feature cost' }, { status: 500 })
    }
}
