"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
    Settings, Save, RefreshCw, CreditCard, Zap,
    DollarSign, TrendingUp, BarChart3, Bell,
    FileText, Users, Activity, Target, Calculator,
    CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from "recharts"

// --------------- Types ---------------

interface FeatureCost {
    id: string
    featureType: string
    creditCost: number
    dollarPrice: number
    displayName: string
    description: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface MonthlyData {
    month: string
    revenue: number
    usage: number
    transactions: number
}

interface FeatureUsage {
    featureType: string
    totalCredits: number
    count: number
}

interface BreakEven {
    estimatedMonthlyCosts: number
    avgMonthlyRevenue: number
    breakEvenCredits: number
    isBreakEven: boolean
    shortfall: number
}

interface Earnings {
    totalRevenue: number
    thisMonthRevenue: number
    totalUsageCredits: number
    thisMonthUsageCredits: number
    totalUsers: number
    activeUsers: number
    dollarPerCredit: number
    monthlyData: MonthlyData[]
    featureUsage: FeatureUsage[]
    breakEven: BreakEven
}

interface AuditLog {
    id: string
    action: string
    resource: string
    userEmail: string | null
    details: string | null
    createdAt: string
}

interface Notification {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
}

type TabKey = "costs" | "earnings" | "audit" | "notifications"

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "costs", label: "Feature Costs", icon: <Settings className="size-4" /> },
    { key: "earnings", label: "Earnings & Analytics", icon: <TrendingUp className="size-4" /> },
    { key: "audit", label: "Audit Logs", icon: <FileText className="size-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="size-4" /> },
]

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48", "#a855f7"]
const TAX_RATE = 0.15

// --------------- Component ---------------

export default function FeatureCostsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("costs")
    const [featureCosts, setFeatureCosts] = useState<FeatureCost[]>([])
    const [earnings, setEarnings] = useState<Earnings | null>(null)
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [auditTotal, setAuditTotal] = useState(0)
    const [auditPage, setAuditPage] = useState(1)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    // --------------- Data Loading ---------------

    const loadFeatureCosts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/admin/feature-costs?include=earnings")
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    setError("You don't have permission to view feature costs.")
                    return
                }
                throw new Error("Failed to load feature costs")
            }
            const data = await res.json()
            setFeatureCosts(data.featureCosts || [])
            if (data.earnings) setEarnings(data.earnings)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load feature costs")
        } finally {
            setLoading(false)
        }
    }, [])

    const loadAuditLogs = useCallback(async (page = 1) => {
        try {
            const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=20`)
            if (!res.ok) return
            const data = await res.json()
            setAuditLogs(data.logs || [])
            setAuditTotal(data.pagination?.total || 0)
            setAuditPage(page)
        } catch { /* silent */ }
    }, [])

    const loadNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/notifications")
            if (!res.ok) return
            const data = await res.json()
            setNotifications(data.notifications || [])
            setUnreadCount(data.unreadCount || 0)
        } catch { /* silent */ }
    }, [])

    useEffect(() => { loadFeatureCosts() }, [loadFeatureCosts])
    useEffect(() => { if (activeTab === "audit") loadAuditLogs(1) }, [activeTab, loadAuditLogs])
    useEffect(() => { if (activeTab === "notifications") loadNotifications() }, [activeTab, loadNotifications])

    // --------------- Handlers ---------------

    const handleFieldChange = (featureType: string, field: "creditCost" | "dollarPrice", value: number) => {
        setFeatureCosts(prev =>
            prev.map(fc => fc.featureType === featureType ? { ...fc, [field]: value } : fc)
        )
    }

    const handleToggleActive = async (featureType: string, isActive: boolean) => {
        setSaving(featureType)
        try {
            const res = await fetch("/api/admin/feature-costs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featureType, isActive }),
            })
            if (!res.ok) throw new Error((await res.json()).error || "Failed to update")
            setFeatureCosts(prev =>
                prev.map(fc => fc.featureType === featureType ? { ...fc, isActive } : fc)
            )
            toast({ title: "Updated", description: `${featureType} ${isActive ? "enabled" : "disabled"}` })
        } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
        } finally {
            setSaving(null)
        }
    }

    const handleSave = async (fc: FeatureCost) => {
        setSaving(fc.featureType)
        try {
            const res = await fetch("/api/admin/feature-costs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    featureType: fc.featureType,
                    creditCost: fc.creditCost,
                    dollarPrice: fc.dollarPrice,
                }),
            })
            if (!res.ok) throw new Error((await res.json()).error || "Failed to save")
            toast({ title: "Saved", description: `Costs updated for ${fc.displayName}` })
        } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
        } finally {
            setSaving(null)
        }
    }

    // --------------- Loading / Error States ---------------

    if (loading) {
        return (
            <div className="container mx-auto space-y-6 py-8">
                <div className="flex items-center gap-3">
                    <Settings className="size-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Feature Costs & Analytics</h1>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-3"><div className="h-5 w-32 rounded bg-muted" /></CardHeader>
                            <CardContent><div className="h-10 w-20 rounded bg-muted" /></CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto space-y-6 py-8">
                <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            </div>
        )
    }

    // --------------- Computed Values ---------------

    const activeCount = featureCosts.filter(fc => fc.isActive).length
    const totalCredits = featureCosts.reduce((sum, fc) => sum + fc.creditCost, 0)
    const avgDollar = featureCosts.length > 0
        ? (featureCosts.reduce((s, fc) => s + fc.dollarPrice, 0) / featureCosts.length).toFixed(2)
        : "0.00"

    // --------------- Render ---------------

    return (
        <div className="container mx-auto space-y-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="size-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Feature Costs & Analytics</h1>
                        <p className="text-muted-foreground">
                            Manage pricing, view earnings, and monitor platform activity
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={loadFeatureCosts}>
                    <RefreshCw className="mr-2 size-4" /> Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.key === "notifications" && unreadCount > 0 && (
                            <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ===== Tab: Feature Costs ===== */}
            {activeTab === "costs" && (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Features</CardTitle>
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{featureCosts.length}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Features</CardTitle>
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Credit Cost</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {featureCosts.length > 0 ? (totalCredits / featureCosts.length).toFixed(1) : 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Dollar Price</CardTitle>
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold text-emerald-600">${avgDollar}</div></CardContent>
                        </Card>
                    </div>

                    {/* Feature Cost Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {featureCosts.map(fc => (
                            <Card
                                key={fc.id}
                                className={fc.isActive
                                    ? "border-green-200 dark:border-green-900"
                                    : "border-gray-200 opacity-60 dark:border-gray-700"}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                            <Zap className="size-4 text-amber-500" />
                                            {fc.displayName}
                                        </CardTitle>
                                        <Switch
                                            checked={fc.isActive}
                                            onCheckedChange={(v) => handleToggleActive(fc.featureType, v)}
                                            disabled={saving === fc.featureType}
                                        />
                                    </div>
                                    <CardDescription>{fc.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Credit Cost */}
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="size-4 text-muted-foreground" />
                                        <Input
                                            type="number" min={0}
                                            value={fc.creditCost}
                                            onChange={(e) => handleFieldChange(fc.featureType, "creditCost", parseInt(e.target.value) || 0)}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-muted-foreground">credits</span>
                                    </div>
                                    {/* Dollar Price */}
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="size-4 text-emerald-600" />
                                        <Input
                                            type="number" min={0} step={0.01}
                                            value={fc.dollarPrice}
                                            onChange={(e) => handleFieldChange(fc.featureType, "dollarPrice", parseFloat(e.target.value) || 0)}
                                            className="w-24"
                                        />
                                        <span className="text-sm text-muted-foreground">USD</span>
                                    </div>
                                    {/* Save + Badge */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={fc.isActive ? "default" : "secondary"}>
                                                {fc.isActive ? "Active" : "Disabled"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{fc.featureType}</span>
                                        </div>
                                        <Button size="sm" onClick={() => handleSave(fc)} disabled={saving === fc.featureType}>
                                            {saving === fc.featureType
                                                ? <RefreshCw className="size-4 animate-spin" />
                                                : <><Save className="mr-1 size-4" />Save</>}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== Tab: Earnings & Analytics ===== */}
            {activeTab === "earnings" && (
                <EarningsTab earnings={earnings} featureCosts={featureCosts} />
            )}

            {/* ===== Tab: Audit Logs ===== */}
            {activeTab === "audit" && (
                <AuditTab
                    logs={auditLogs}
                    total={auditTotal}
                    page={auditPage}
                    onPageChange={(p) => loadAuditLogs(p)}
                />
            )}

            {/* ===== Tab: Notifications ===== */}
            {activeTab === "notifications" && (
                <NotificationsTab notifications={notifications} onRefresh={loadNotifications} />
            )}
        </div>
    )
}

// ========================================================
// Earnings & Analytics Sub-Component
// ========================================================

function EarningsTab({ earnings, featureCosts }: { earnings: Earnings | null; featureCosts: FeatureCost[] }) {
    if (!earnings) {
        return (
            <Alert>
                <AlertDescription>
                    No earnings data available yet. Revenue will appear once credit transactions occur.
                </AlertDescription>
            </Alert>
        )
    }

    const { totalRevenue, thisMonthRevenue, totalUsageCredits, thisMonthUsageCredits, totalUsers, activeUsers, monthlyData, featureUsage, breakEven } = earnings

    const taxEstimate = totalRevenue * TAX_RATE
    const netRevenue = totalRevenue - taxEstimate
    const thisMonthTax = thisMonthRevenue * TAX_RATE
    const thisMonthNet = thisMonthRevenue - thisMonthTax

    // Chart data for revenue
    const revenueChartData = monthlyData.map(m => ({
        name: m.month.slice(5), // "01", "02" etc
        revenue: m.revenue,
        usage: m.usage,
        transactions: m.transactions,
    }))

    // Pie data for feature usage
    const pieData = featureUsage
        .filter(f => f.totalCredits > 0)
        .sort((a, b) => b.totalCredits - a.totalCredits)
        .slice(0, 10)
        .map(f => {
            const match = featureCosts.find(fc => fc.featureType === f.featureType)
            return { name: match?.displayName || f.featureType, value: f.totalCredits, count: f.count }
        })

    return (
        <div className="space-y-6">
            {/* Revenue Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="size-4" /> Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="size-4" /> This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${thisMonthRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{thisMonthUsageCredits} credits used</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="size-4" /> Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">{activeUsers} active this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="size-4" /> Credits Used
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsageCredits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All time total</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="size-5" /> Monthly Revenue & Usage (12 months)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis yAxisId="left" className="text-xs" />
                                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                                    formatter={(value, name) => {
                                        const v = Number(value ?? 0)
                                        return name === "revenue"
                                            ? [`$${v.toFixed(2)}`, "Revenue"]
                                            : [v, name === "usage" ? "Credits Used" : "Transactions"]
                                    }}
                                />
                                <Bar yAxisId="left" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="revenue" />
                                <Bar yAxisId="right" dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} name="usage" opacity={0.6} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-12 text-center text-muted-foreground">No transaction data yet</p>
                    )}
                </CardContent>
            </Card>

            {/* Feature Usage Pie + Break-Even Side by Side */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Feature Usage Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="size-5" /> Feature Usage Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length > 0 ? (
                            <div className="flex flex-col items-center gap-4">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={100}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [`${Number(v ?? 0)} credits`, "Usage"]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {pieData.map((d, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            {d.name}: {d.value}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="py-12 text-center text-muted-foreground">No usage data yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Break-Even Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="size-5" /> Break-Even Analysis
                        </CardTitle>
                        <CardDescription>Monthly operational costs vs. revenue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Est. Monthly Costs</p>
                                <p className="text-xl font-bold text-red-500">${breakEven.estimatedMonthlyCosts}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Avg Monthly Revenue</p>
                                <p className="text-xl font-bold text-emerald-600">${breakEven.avgMonthlyRevenue.toFixed(2)}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Break-Even Credits</p>
                                <p className="text-xl font-bold">{breakEven.breakEvenCredits.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Status</p>
                                {breakEven.isBreakEven ? (
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="size-5 text-green-500" />
                                        <span className="font-bold text-green-600">Profitable</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <AlertTriangle className="size-5 text-amber-500" />
                                        <span className="font-bold text-amber-600">-${breakEven.shortfall.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div>
                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                <span>Revenue vs. Costs</span>
                                <span>{Math.min(100, Math.round((breakEven.avgMonthlyRevenue / breakEven.estimatedMonthlyCosts) * 100))}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={`h-full rounded-full transition-all ${breakEven.isBreakEven ? "bg-green-500" : "bg-amber-500"}`}
                                    style={{ width: `${Math.min(100, (breakEven.avgMonthlyRevenue / breakEven.estimatedMonthlyCosts) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tax Estimation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="size-5" /> Tax & Net Revenue Estimation
                    </CardTitle>
                    <CardDescription>Estimated at {(TAX_RATE * 100).toFixed(0)}% tax rate — consult your accountant for actuals</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Gross Revenue</p>
                            <p className="text-lg font-bold">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Est. Tax</p>
                            <p className="text-lg font-bold text-red-500">-${taxEstimate.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Net Revenue</p>
                            <p className="text-lg font-bold text-emerald-600">${netRevenue.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">This Month Gross</p>
                            <p className="text-lg font-bold">${thisMonthRevenue.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">This Month Tax</p>
                            <p className="text-lg font-bold text-red-500">-${thisMonthTax.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">This Month Net</p>
                            <p className="text-lg font-bold text-emerald-600">${thisMonthNet.toFixed(2)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ========================================================
// Audit Logs Sub-Component
// ========================================================

function AuditTab({ logs, total, page, onPageChange }: {
    logs: AuditLog[]
    total: number
    page: number
    onPageChange: (p: number) => void
}) {
    const totalPages = Math.ceil(total / 20)

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="size-5" /> Audit Logs
                    </CardTitle>
                    <CardDescription>{total} total entries</CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No audit logs yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Time</th>
                                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Action</th>
                                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Resource</th>
                                        <th className="pb-2 pr-4 font-medium text-muted-foreground">User</th>
                                        <th className="pb-2 font-medium text-muted-foreground">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} className="border-b last:border-0">
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                <Clock className="mr-1 inline size-3" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs">{log.resource}</td>
                                            <td className="py-2 pr-4 text-xs">{log.userEmail || "System"}</td>
                                            <td className="max-w-[200px] truncate py-2 text-xs text-muted-foreground">
                                                {log.details || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    disabled={page <= 1}
                                    onClick={() => onPageChange(page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => onPageChange(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ========================================================
// Notifications Sub-Component
// ========================================================

function NotificationsTab({ notifications, onRefresh }: {
    notifications: Notification[]
    onRefresh: () => void
}) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="size-5" /> Admin Notifications
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="mr-1 size-4" /> Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No notifications</p>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 rounded-lg border p-3 ${n.isRead ? "opacity-60" : "border-primary/30 bg-primary/5"
                                        }`}
                                >
                                    <div className="mt-0.5">
                                        {n.type === "COST_ALERT" ? (
                                            <AlertTriangle className="size-4 text-amber-500" />
                                        ) : n.type === "SECURITY_ALERT" ? (
                                            <AlertTriangle className="size-4 text-red-500" />
                                        ) : (
                                            <Bell className="size-4 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{n.title}</span>
                                            {!n.isRead && (
                                                <span className="size-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{n.message}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">{n.type}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
