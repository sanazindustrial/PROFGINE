"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    CreditCard,
    TrendingDown,
    TrendingUp,
    Zap,
    BarChart3,
    Clock,
    Shield,
    Crown,
} from 'lucide-react'

interface CreditUsageClientProps {
    user: {
        id: string
        role: string
        isOwner: boolean
        name?: string
        email: string
        creditBalance: number
        monthlyCredits: number
        subscriptionType: string
    }
    billingTier: string
    monthlyAllocation: number
    creditBalance: number
    monthlyCredits: number
    monthlyUsage: {
        featureType: string | null
        totalUsed: number
        count: number
    }[]
    recentTransactions: {
        id: string
        amount: number
        type: string
        description: string | null
        featureType: string | null
        createdAt: string
    }[]
    featureCosts: {
        featureType: string
        creditCost: number
        displayName: string
        description: string | null
    }[]
    usageCounter: {
        creditsUsed: number
        creditsRemaining: number
        periodStart: string
    } | null
}

function formatFeatureName(name: string | null): string {
    if (!name) return 'General'
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getTransactionIcon(type: string) {
    switch (type) {
        case 'USAGE': return <TrendingDown className="size-4 text-red-500" />
        case 'PURCHASE': return <TrendingUp className="size-4 text-green-500" />
        case 'BONUS': return <Zap className="size-4 text-yellow-500" />
        case 'REFUND': return <TrendingUp className="size-4 text-blue-500" />
        case 'MONTHLY_ALLOCATION': return <CreditCard className="size-4 text-purple-500" />
        case 'ROLLOVER': return <Clock className="size-4 text-gray-500" />
        default: return <CreditCard className="size-4 text-gray-500" />
    }
}

export default function CreditUsageClient({
    user,
    billingTier,
    monthlyAllocation,
    creditBalance,
    monthlyCredits,
    monthlyUsage,
    recentTransactions,
    featureCosts,
    usageCounter,
}: CreditUsageClientProps) {
    const isUnlimited = user.role === 'ADMIN' && user.isOwner
    const totalUsedThisMonth = monthlyUsage.reduce((sum, u) => sum + u.totalUsed, 0)
    const usagePercent = monthlyAllocation > 0
        ? Math.min(100, Math.round((totalUsedThisMonth / monthlyAllocation) * 100))
        : 0

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Credits & Usage</h1>
                    <p className="text-muted-foreground">
                        Monitor your credit balance and feature usage
                    </p>
                </div>
                <Badge variant={isUnlimited ? "default" : "outline"} className="text-sm">
                    {isUnlimited ? (
                        <><Crown className="mr-1 size-3" /> Owner — Unlimited</>
                    ) : (
                        <><Shield className="mr-1 size-3" /> {billingTier.replace('_', ' ')}</>
                    )}
                </Badge>
            </div>

            {/* Credit Overview Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Credit Balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {isUnlimited ? '∞' : creditBalance}
                        </p>
                        <p className="text-xs text-muted-foreground">credits available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Monthly Allocation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {monthlyAllocation === -1 ? '∞' : monthlyAllocation}
                        </p>
                        <p className="text-xs text-muted-foreground">credits per month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Used This Month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalUsedThisMonth}</p>
                        <p className="text-xs text-muted-foreground">credits consumed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Subscription</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{billingTier.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Usage Progress */}
            {!isUnlimited && monthlyAllocation > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="size-5" />
                            Monthly Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span>{totalUsedThisMonth} of {monthlyAllocation} credits used</span>
                            <span className="font-medium">{usagePercent}%</span>
                        </div>
                        <Progress value={usagePercent} className="h-3" />
                        {usagePercent >= 80 && (
                            <p className="text-sm text-yellow-600">
                                You&apos;re running low on credits. Consider upgrading your plan.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Feature Cost Table & Usage Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Feature Costs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="size-5" />
                            Feature Costs
                        </CardTitle>
                        <CardDescription>
                            Credits required per feature use
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {featureCosts.length > 0 ? featureCosts.map(fc => (
                                <div key={fc.featureType} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{fc.displayName}</p>
                                        {fc.description && (
                                            <p className="text-xs text-muted-foreground">{fc.description}</p>
                                        )}
                                    </div>
                                    <Badge variant="secondary">
                                        {isUnlimited ? 'Free' : `${fc.creditCost} credits`}
                                    </Badge>
                                </div>
                            )) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    No feature costs configured yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Usage Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="size-5" />
                            Usage Breakdown
                        </CardTitle>
                        <CardDescription>
                            Credits used per feature this month
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {monthlyUsage.length > 0 ? monthlyUsage.map((u, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{formatFeatureName(u.featureType)}</p>
                                        <p className="text-xs text-muted-foreground">{u.count} operations</p>
                                    </div>
                                    <Badge variant="outline">{u.totalUsed} credits</Badge>
                                </div>
                            )) : (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    No usage recorded this month
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="size-5" />
                        Recent Transactions
                    </CardTitle>
                    <CardDescription>
                        Last 25 credit transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recentTransactions.length > 0 ? recentTransactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    {getTransactionIcon(tx.type)}
                                    <div>
                                        <p className="text-sm font-medium">
                                            {tx.description || formatFeatureName(tx.featureType)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                            </div>
                        )) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No transactions yet. Credits will be tracked as you use features.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
