import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createEnhancedSubscriptionManager } from '@/lib/enhanced-subscription-manager-v2'

// Get credit balance and usage
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
                        org: true
                    }
                },
                creditTransactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Create subscription manager to get credit info
        const subscriptionContext = {
            userId: user.id,
            role: user.role,
            subscriptionType: user.subscriptionType,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            trialExpiresAt: user.trialExpiresAt,
            creditBalance: user.creditBalance,
            monthlyCredits: user.monthlyCredits,
            organizationId: user.organizationMembers[0]?.org.id
        }

        const subscriptionManager = createEnhancedSubscriptionManager(subscriptionContext)
        const creditBalance = subscriptionManager.getCreditBalance()

        // Get current month usage
        const currentMonthStart = new Date()
        currentMonthStart.setDate(1)
        currentMonthStart.setHours(0, 0, 0, 0)

        const monthlyUsage = await prisma.creditTransaction.groupBy({
            by: ['featureType'],
            where: {
                userId: user.id,
                amount: { lt: 0 }, // Only debit transactions
                createdAt: { gte: currentMonthStart }
            },
            _sum: {
                amount: true
            }
        })

        return NextResponse.json({
            creditBalance,
            monthlyUsage: monthlyUsage.map(usage => ({
                feature: usage.featureType,
                used: Math.abs(usage._sum.amount || 0)
            })),
            recentTransactions: user.creditTransactions,
            subscriptionInfo: subscriptionManager.getSubscriptionInfo()
        })

    } catch (error) {
        console.error('Get credits error:', error)
        return NextResponse.json({ error: 'Failed to retrieve credit information' }, { status: 500 })
    }
}

// Purchase additional credits - redirects to Stripe checkout
export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { amount, packageId } = await request.json()

        // If packageId is provided, redirect to Stripe credit purchase
        if (packageId) {
            return NextResponse.json({
                redirect: '/api/stripe/credit-purchase',
                message: 'Use /api/stripe/credit-purchase endpoint for Stripe-based purchases'
            })
        }

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // For non-Stripe purchases (admin grants, promo codes, etc.)
        // Real money purchases should use /api/stripe/credit-purchase
        const transaction = await prisma.creditTransaction.create({
            data: {
                userId: user.id,
                amount: amount,
                type: 'PURCHASE',
                description: `Credit grant - ${amount} credits`
            }
        })

        await prisma.user.update({
            where: { id: user.id },
            data: {
                creditBalance: {
                    increment: amount
                }
            }
        })

        return NextResponse.json({
            message: 'Credits added successfully',
            transaction: {
                id: transaction.id,
                amount: amount,
                newBalance: user.creditBalance + amount
            }
        })

    } catch (error) {
        console.error('Purchase credits error:', error)
        return NextResponse.json({ error: 'Failed to purchase credits' }, { status: 500 })
    }
}

// Reset monthly credits (admin only)
export async function PUT(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { userId, monthlyCredits } = await request.json()

        // Get subscription manager for credit calculation
        const targetUser = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        const subscriptionContext = {
            userId: targetUser.id,
            role: targetUser.role,
            subscriptionType: targetUser.subscriptionType,
            subscriptionExpiresAt: targetUser.subscriptionExpiresAt,
            trialExpiresAt: targetUser.trialExpiresAt,
            creditBalance: targetUser.creditBalance,
            monthlyCredits: targetUser.monthlyCredits
        }

        const subscriptionManager = createEnhancedSubscriptionManager(subscriptionContext)
        const limits = subscriptionManager.getSubscriptionLimits()

        // Calculate rollover credits (unused from previous month)
        const rolloverCredits = Math.max(0, targetUser.creditBalance - targetUser.monthlyCredits)
        const newTotalCredits = (monthlyCredits || limits.monthlyCredits) + rolloverCredits

        // Update user credits
        await prisma.user.update({
            where: { id: userId },
            data: {
                monthlyCredits: monthlyCredits || limits.monthlyCredits,
                creditBalance: newTotalCredits
            }
        })

        // Create rollover transaction
        if (rolloverCredits > 0) {
            await prisma.creditTransaction.create({
                data: {
                    userId: userId,
                    amount: rolloverCredits,
                    type: 'ROLLOVER',
                    description: `Monthly rollover - ${rolloverCredits} unused credits`
                }
            })
        }

        // Create monthly allocation transaction
        await prisma.creditTransaction.create({
            data: {
                userId: userId,
                amount: monthlyCredits || limits.monthlyCredits,
                type: 'PURCHASE',
                description: 'Monthly credit allocation'
            }
        })

        return NextResponse.json({
            message: 'Monthly credits reset successfully',
            newBalance: newTotalCredits,
            rolloverCredits,
            monthlyAllocation: monthlyCredits || limits.monthlyCredits
        })

    } catch (error) {
        console.error('Reset monthly credits error:', error)
        return NextResponse.json({ error: 'Failed to reset monthly credits' }, { status: 500 })
    }
}