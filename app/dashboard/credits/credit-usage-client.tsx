"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    CreditCard,
    TrendingDown,
    TrendingUp,
    Zap,
    BarChart3,
    Clock,
    Shield,
    Crown,
    AlertTriangle,
    CheckCircle,
    CheckCircle2,
    Info,
    ShoppingCart,
    BookOpen,
    Bell,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Coins,
    Gauge,
    PieChart,
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

function getCreditBarColor(percent: number): string {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-orange-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
}

function getCreditStatus(percent: number): { label: string; color: string; icon: typeof CheckCircle } {
    if (percent >= 90) return { label: 'Critical — Running Out', color: 'text-red-600', icon: AlertTriangle }
    if (percent >= 75) return { label: 'Low — Consider Recharging', color: 'text-orange-600', icon: AlertTriangle }
    if (percent >= 50) return { label: 'Moderate Usage', color: 'text-yellow-600', icon: Info }
    return { label: 'Healthy', color: 'text-green-600', icon: CheckCircle }
}

function DonutChart({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
    const total = segments.reduce((s, seg) => s + seg.value, 0)
    if (total === 0) {
        return (
            <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                <div className="rounded-full border-8 border-muted" style={{ width: size * 0.8, height: size * 0.8 }} />
            </div>
        )
    }
    const radius = 60
    const circumference = 2 * Math.PI * radius
    let offset = 0
    return (
        <svg width={size} height={size} viewBox="0 0 160 160">
            {segments.map((seg, i) => {
                const pct = seg.value / total
                const dashArray = pct * circumference
                const dashOffset = -offset * circumference
                offset += pct
                return (
                    <circle
                        key={i}
                        cx="80" cy="80" r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="20"
                        strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 80 80)"
                    />
                )
            })}
            <text x="80" y="75" textAnchor="middle" className="fill-foreground text-2xl font-bold">{total}</text>
            <text x="80" y="95" textAnchor="middle" className="fill-muted-foreground text-xs">credits used</text>
        </svg>
    )
}

function BarChartVisual({ data }: { data: { label: string; value: number; color: string }[] }) {
    const max = Math.max(...data.map(d => d.value), 1)
    return (
        <div className="space-y-2">
            {data.map((d, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-medium">{d.label}</span>
                        <span className="text-muted-foreground">{d.value}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${Math.max(2, (d.value / max) * 100)}%`,
                                backgroundColor: d.color,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

const CREDIT_NOTIFICATIONS = [
    { threshold: 90, title: 'Credit Almost Depleted', message: 'You have used 90% of your monthly credits. Purchase more to avoid interruption.', severity: 'critical' as const },
    { threshold: 75, title: 'Credits Running Low', message: 'You have used 75% of your credits. Consider purchasing additional credits.', severity: 'warning' as const },
    { threshold: 50, title: 'Half Credits Used', message: 'You have used half of your monthly credit allocation.', severity: 'info' as const },
    { threshold: 100, title: 'Credits Exhausted', message: 'Your credits are fully used. Purchase more to continue using premium features.', severity: 'critical' as const },
]

const CREDIT_PACKAGES = [
    { amount: 50, price: 4.99, label: 'Starter', popular: false },
    { amount: 150, price: 12.99, label: 'Standard', popular: true },
    { amount: 500, price: 39.99, label: 'Professional', popular: false },
    { amount: 1000, price: 69.99, label: 'Enterprise', popular: false },
]

const chartColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6']

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
    const [activeTab, setActiveTab] = useState<'overview' | 'guidelines' | 'buy' | 'notifications'>('overview')
    const [buyingPackage, setBuyingPackage] = useState<number | null>(null)
    const [buySuccess, setBuySuccess] = useState(false)
    const [showAllTransactions, setShowAllTransactions] = useState(false)
    const [guidelinesExpanded, setGuidelinesExpanded] = useState<string | null>(null)

    // Handle return from Stripe checkout
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('purchase') === 'success') {
            setBuySuccess(true)
            setActiveTab('overview')
            // Clean URL
            window.history.replaceState({}, '', '/dashboard/credits')
            setTimeout(() => setBuySuccess(false), 5000)
        }
    }, [])

    const isUnlimited = user.role === 'ADMIN' && user.isOwner
    const isAdmin = user.role === 'ADMIN'
    const totalUsedThisMonth = monthlyUsage.reduce((sum, u) => sum + u.totalUsed, 0)
    const usagePercent = monthlyAllocation > 0
        ? Math.min(100, Math.round((totalUsedThisMonth / monthlyAllocation) * 100))
        : 0
    const remainingCredits = monthlyAllocation > 0 ? Math.max(0, monthlyAllocation - totalUsedThisMonth) : creditBalance
    const creditStatus = getCreditStatus(usagePercent)
    const StatusIcon = creditStatus.icon

    const chartSegments = monthlyUsage.map((u, i) => ({
        label: formatFeatureName(u.featureType),
        value: u.totalUsed,
        color: chartColors[i % chartColors.length],
    }))

    const barData = monthlyUsage
        .sort((a, b) => b.totalUsed - a.totalUsed)
        .slice(0, 8)
        .map((u, i) => ({
            label: formatFeatureName(u.featureType),
            value: u.totalUsed,
            color: chartColors[i % chartColors.length],
        }))

    const activeNotifications = CREDIT_NOTIFICATIONS.filter(n => usagePercent >= n.threshold)

    const handleBuyCredits = async (amount: number) => {
        setBuyingPackage(amount)
        try {
            // Map amount to package ID
            const packageId = String(amount)

            const res = await fetch('/api/stripe/credit-purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId }),
            })
            const data = await res.json()

            if (res.ok && data.url) {
                // Redirect to Stripe checkout
                window.location.href = data.url
            } else if (data.error === 'Payment system is not configured') {
                // Stripe not configured — show message
                alert('Payment system is being set up. Please try again later.')
            } else {
                alert(data.error || 'Failed to start checkout')
            }
        } catch (err) {
            console.error('Purchase failed:', err)
            alert('An error occurred. Please try again.')
        } finally {
            setBuyingPackage(null)
        }
    }

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: Gauge },
        { id: 'guidelines' as const, label: 'Guidelines', icon: BookOpen },
        { id: 'buy' as const, label: 'Buy Credits', icon: ShoppingCart },
        { id: 'notifications' as const, label: 'Alerts', icon: Bell },
    ]

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
            {/* Purchase Success Banner */}
            {buySuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Purchase successful! Your credits have been added to your account.</span>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">Credits &amp; Usage</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor balance, buy credits, and manage feature costs
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={isUnlimited ? "default" : "outline"} className="text-sm">
                        {isUnlimited ? (
                            <><Crown className="mr-1 size-3" /> Owner — Unlimited</>
                        ) : (
                            <><Shield className="mr-1 size-3" /> {billingTier.replace('_', ' ')}</>
                        )}
                    </Badge>
                    {isAdmin && (
                        <Link href="/admin/feature-costs">
                            <Badge variant="outline" className="cursor-pointer text-sm hover:bg-muted">
                                Admin Costs
                            </Badge>
                        </Link>
                    )}
                </div>
            </div>

            {/* Credit Alert Banner */}
            {!isUnlimited && usagePercent >= 75 && (
                <div className={`flex items-center gap-3 rounded-lg border p-4 ${usagePercent >= 90
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                    : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                    }`}>
                    <AlertTriangle className={`size-5 shrink-0 ${usagePercent >= 90 ? 'text-red-600' : 'text-orange-600'}`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${usagePercent >= 90 ? 'text-red-800 dark:text-red-300' : 'text-orange-800 dark:text-orange-300'}`}>
                            {usagePercent >= 90 ? 'Credits Almost Depleted!' : 'Credits Running Low'}
                        </p>
                        <p className={`text-xs ${usagePercent >= 90 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {remainingCredits} credits remaining. {usagePercent >= 90 ? 'Purchase now to avoid interruption.' : 'Consider purchasing more credits.'}
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveTab('buy')}
                        className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-white ${usagePercent >= 90 ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        Buy Credits
                    </button>
                </div>
            )}

            {/* Visual Credit Gauge */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="text-center">
                            <div className="mx-auto mb-2 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                                <Coins className="size-8 text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold">{isUnlimited ? '∞' : creditBalance}</p>
                            <p className="text-sm text-muted-foreground">Available Credits</p>
                        </div>
                        <div className="flex flex-col justify-center sm:col-span-2">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <StatusIcon className={`size-4 ${creditStatus.color}`} />
                                    <span className={`text-sm font-medium ${creditStatus.color}`}>{creditStatus.label}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {isUnlimited ? 'Unlimited' : `${totalUsedThisMonth} / ${monthlyAllocation} used`}
                                </span>
                            </div>
                            {!isUnlimited ? (
                                <div className="relative h-6 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getCreditBarColor(usagePercent)}`}
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-white drop-shadow-sm">{usagePercent}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-6 w-full overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-white">Unlimited</span>
                                    </div>
                                </div>
                            )}
                            <div className="mt-3 grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-lg font-semibold">{isUnlimited ? '∞' : monthlyAllocation === -1 ? '∞' : monthlyAllocation}</p>
                                    <p className="text-xs text-muted-foreground">Monthly Allocation</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold">{totalUsedThisMonth}</p>
                                    <p className="text-xs text-muted-foreground">Used This Month</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold">{isUnlimited ? '∞' : remainingCredits}</p>
                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className="size-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.id === 'notifications' && activeNotifications.length > 0 && (
                                <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {activeNotifications.length}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ──── OVERVIEW TAB ──── */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <PieChart className="size-4" /> Usage Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6">
                                    <DonutChart segments={chartSegments} />
                                    <div className="flex-1 space-y-1.5">
                                        {chartSegments.slice(0, 6).map((seg, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="size-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                                                <span className="truncate text-xs">{seg.label}</span>
                                                <span className="ml-auto text-xs font-medium">{seg.value}</span>
                                            </div>
                                        ))}
                                        {chartSegments.length === 0 && (
                                            <p className="text-xs text-muted-foreground">No usage data yet</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <BarChart3 className="size-4" /> Feature Usage
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {barData.length > 0 ? (
                                    <BarChartVisual data={barData} />
                                ) : (
                                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                                        No usage data yet. Start using features to see your chart.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Zap className="size-4" /> Feature Cost Table
                            </CardTitle>
                            <CardDescription>Credits deducted per feature use</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-2 font-medium">Feature</th>
                                            <th className="pb-2 font-medium">Description</th>
                                            <th className="pb-2 text-right font-medium">Cost</th>
                                            <th className="pb-2 text-right font-medium">Used</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {featureCosts.map(fc => {
                                            const usage = monthlyUsage.find(u => u.featureType === fc.featureType)
                                            return (
                                                <tr key={fc.featureType} className="hover:bg-muted/30">
                                                    <td className="py-2.5 font-medium">{fc.displayName}</td>
                                                    <td className="py-2.5 text-muted-foreground">{fc.description || '—'}</td>
                                                    <td className="py-2.5 text-right">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {isUnlimited ? 'Free' : `${fc.creditCost} cr`}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 text-right text-muted-foreground">
                                                        {usage ? `${usage.count}×` : '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {featureCosts.length === 0 && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No feature costs configured yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="size-4" /> Recent Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1.5">
                                {(showAllTransactions ? recentTransactions : recentTransactions.slice(0, 8)).map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            {getTransactionIcon(tx.type)}
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {tx.description || formatFeatureName(tx.featureType)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </span>
                                    </div>
                                ))}
                                {recentTransactions.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No transactions yet. Credits will be tracked as you use features.
                                    </p>
                                )}
                            </div>
                            {recentTransactions.length > 8 && (
                                <button
                                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                                    className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-primary hover:underline"
                                >
                                    {showAllTransactions ? (
                                        <><ChevronUp className="size-4" /> Show Less</>
                                    ) : (
                                        <><ChevronDown className="size-4" /> Show All ({recentTransactions.length})</>
                                    )}
                                </button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ──── GUIDELINES TAB ──── */}
            {activeTab === 'guidelines' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="size-5" /> Credit System Guidelines
                            </CardTitle>
                            <CardDescription>How credits work on Professor GENIE</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { id: 'what', title: 'What Are Credits?', content: 'Credits are the currency used to access AI-powered features on Professor GENIE. Each feature consumes a specific number of credits when used. Your subscription plan includes a monthly credit allocation that refreshes at the start of each billing cycle.' },
                                { id: 'allocation', title: 'Monthly Credit Allocation', content: `Your current plan (${billingTier.replace('_', ' ')}) provides ${monthlyAllocation === -1 ? 'unlimited' : monthlyAllocation} credits per month. Credits reset on the 1st of each month. Unused credits do not roll over to the next month unless you have a Premium or Enterprise plan.` },
                                { id: 'usage', title: 'How Credits Are Used', content: 'Each AI feature has a fixed credit cost. For example, creating a course costs 5 credits, AI grading costs 1 credit per submission, and generating presentations costs 5 credits. You can see the full cost table in the Overview tab.' },
                                { id: 'running-out', title: 'What Happens When Credits Run Out?', content: 'When your credits are depleted, AI-powered features will be temporarily unavailable until your next monthly allocation or until you purchase additional credits. Basic features like viewing courses and managing students remain accessible.' },
                                { id: 'buy-more', title: 'Purchasing Additional Credits', content: 'You can purchase credit packages at any time from the Buy Credits tab. Purchased credits are added immediately and do not expire at the end of the month. Packages range from 50 credits ($4.99) to 1,000 credits ($69.99).' },
                                { id: 'notifications', title: 'Credit Notifications', content: 'You will receive automatic notifications when your credit usage reaches 50%, 75%, and 90% of your monthly allocation. Critical alerts are sent when credits are exhausted. These help you plan your usage and avoid interruptions.' },
                                { id: 'admin', title: 'Admin & Owner Credits', content: 'Platform owners and administrators have unlimited credits and are not subject to credit restrictions. Admins can also view and manage credit allocations for all users through the admin panel.' },
                            ].map(item => (
                                <div key={item.id} className="rounded-lg border">
                                    <button
                                        onClick={() => setGuidelinesExpanded(guidelinesExpanded === item.id ? null : item.id)}
                                        className="flex w-full items-center justify-between p-4 text-left"
                                    >
                                        <span className="font-medium">{item.title}</span>
                                        {guidelinesExpanded === item.id
                                            ? <ChevronUp className="size-4 text-muted-foreground" />
                                            : <ChevronDown className="size-4 text-muted-foreground" />}
                                    </button>
                                    {guidelinesExpanded === item.id && (
                                        <div className="border-t px-4 pb-4 pt-3">
                                            <p className="text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Plan Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-2 font-medium">Plan</th>
                                            <th className="pb-2 text-right font-medium">Monthly Credits</th>
                                            <th className="pb-2 text-right font-medium">Features</th>
                                            <th className="pb-2 text-right font-medium">Support</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {[
                                            { plan: 'Free Trial', credits: '50', features: 'Basic', support: 'Community' },
                                            { plan: 'Basic', credits: '200', features: 'Standard', support: 'Email' },
                                            { plan: 'Premium', credits: '500', features: 'All Features', support: 'Priority' },
                                            { plan: 'Enterprise', credits: 'Unlimited', features: 'All + Custom', support: 'Dedicated' },
                                        ].map(row => (
                                            <tr key={row.plan} className={`${billingTier.replace('_', ' ').toUpperCase() === row.plan.toUpperCase() ? 'bg-primary/5 font-medium' : ''}`}>
                                                <td className="py-2.5">
                                                    {row.plan}
                                                    {billingTier.replace('_', ' ').toUpperCase() === row.plan.toUpperCase() && (
                                                        <Badge variant="default" className="ml-2 text-[10px]">Current</Badge>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-right">{row.credits}</td>
                                                <td className="py-2.5 text-right">{row.features}</td>
                                                <td className="py-2.5 text-right">{row.support}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ──── BUY CREDITS TAB ──── */}
            {activeTab === 'buy' && (
                <div className="space-y-6">
                    {buySuccess && (
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                            <CheckCircle className="size-5 text-green-600" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                Credits purchased successfully! Your balance will update momentarily.
                            </p>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="size-5" /> Buy Credit Packages
                            </CardTitle>
                            <CardDescription>Purchased credits are added instantly and never expire.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {CREDIT_PACKAGES.map(pkg => (
                                    <div
                                        key={pkg.amount}
                                        className={`relative flex flex-col items-center rounded-xl border-2 p-6 transition-all hover:shadow-md ${pkg.popular
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        {pkg.popular && (
                                            <Badge className="absolute -top-2.5 bg-primary text-xs">Most Popular</Badge>
                                        )}
                                        <Coins className="mb-2 size-8 text-primary" />
                                        <p className="text-2xl font-bold">{pkg.amount}</p>
                                        <p className="text-sm text-muted-foreground">credits</p>
                                        <p className="mt-2 text-xl font-semibold">${pkg.price}</p>
                                        <p className="text-xs text-muted-foreground">
                                            ${(pkg.price / pkg.amount).toFixed(3)} per credit
                                        </p>
                                        <button
                                            onClick={() => handleBuyCredits(pkg.amount)}
                                            disabled={buyingPackage !== null || isUnlimited}
                                            className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isUnlimited
                                                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                                                : pkg.popular
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                }`}
                                        >
                                            {buyingPackage === pkg.amount ? 'Processing...' : isUnlimited ? 'Not Needed' : 'Purchase'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {!isUnlimited && billingTier !== 'ENTERPRISE' && (
                        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
                                <div className="flex-1">
                                    <h3 className="font-semibold">Need more credits every month?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Upgrade your plan for a higher monthly allocation and access to more features.
                                    </p>
                                </div>
                                <Link
                                    href="/subscription/upgrade"
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Upgrade Plan <ArrowRight className="size-4" />
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ──── NOTIFICATIONS TAB ──── */}
            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="size-5" /> Credit Alerts
                            </CardTitle>
                            <CardDescription>Active alerts based on your current usage ({usagePercent}% used)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isUnlimited ? (
                                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                                    <CheckCircle className="size-5 text-green-600" />
                                    <p className="text-sm text-green-800 dark:text-green-300">
                                        You have unlimited credits. No alerts needed.
                                    </p>
                                </div>
                            ) : activeNotifications.length > 0 ? (
                                activeNotifications.map((notif, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 rounded-lg border p-4 ${notif.severity === 'critical'
                                            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                            : notif.severity === 'warning'
                                                ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                                                : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30'
                                            }`}
                                    >
                                        <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${notif.severity === 'critical' ? 'text-red-600' : notif.severity === 'warning' ? 'text-orange-600' : 'text-blue-600'
                                            }`} />
                                        <div>
                                            <p className={`text-sm font-medium ${notif.severity === 'critical' ? 'text-red-800 dark:text-red-300' : notif.severity === 'warning' ? 'text-orange-800 dark:text-orange-300' : 'text-blue-800 dark:text-blue-300'
                                                }`}>{notif.title}</p>
                                            <p className={`text-xs ${notif.severity === 'critical' ? 'text-red-600 dark:text-red-400' : notif.severity === 'warning' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
                                                }`}>{notif.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                                    <CheckCircle className="size-5 text-green-600" />
                                    <p className="text-sm text-green-800 dark:text-green-300">
                                        All clear! Your credit usage is healthy.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Notification Schedule</CardTitle>
                            <CardDescription>You will receive notifications at these usage thresholds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {CREDIT_NOTIFICATIONS.map((notif, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <span className="text-sm font-bold">{notif.threshold}%</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                                        </div>
                                        <Badge variant={
                                            notif.severity === 'critical' ? 'destructive'
                                                : notif.severity === 'warning' ? 'outline'
                                                    : 'secondary'
                                        } className="text-xs">{notif.severity}</Badge>
                                        {usagePercent >= notif.threshold && (
                                            <CheckCircle className="size-4 text-orange-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Notification Preferences</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { label: 'In-app credit alerts', desc: 'Show alerts in the notification bell', enabled: true },
                                    { label: 'Email credit warnings', desc: 'Send email when credits drop below 25%', enabled: true },
                                    { label: 'Monthly usage summary', desc: 'Receive monthly credit usage report', enabled: true },
                                    { label: 'Purchase confirmations', desc: 'Get notified for credit purchases', enabled: true },
                                ].map((pref, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">{pref.label}</p>
                                            <p className="text-xs text-muted-foreground">{pref.desc}</p>
                                        </div>
                                        <div className={`flex h-6 w-10 items-center rounded-full p-0.5 ${pref.enabled ? 'bg-primary' : 'bg-muted'}`}>
                                            <div className={`size-5 rounded-full bg-white shadow transition-transform ${pref.enabled ? 'translate-x-4' : ''}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
