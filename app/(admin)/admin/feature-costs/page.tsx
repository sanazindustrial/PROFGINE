"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Save, RefreshCw, CreditCard, Zap } from "lucide-react"

interface FeatureCost {
    id: string
    featureType: string
    creditCost: number
    displayName: string
    description: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export default function FeatureCostsPage() {
    const [featureCosts, setFeatureCosts] = useState<FeatureCost[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    const loadFeatureCosts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/admin/feature-costs")
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    setError("You don't have permission to view feature costs.")
                    return
                }
                throw new Error("Failed to load feature costs")
            }
            const data = await res.json()
            setFeatureCosts(data.featureCosts || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load feature costs")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFeatureCosts()
    }, [loadFeatureCosts])

    const handleCostChange = (featureType: string, newCost: number) => {
        setFeatureCosts(prev =>
            prev.map(fc =>
                fc.featureType === featureType ? { ...fc, creditCost: newCost } : fc
            )
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
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update")
            }
            setFeatureCosts(prev =>
                prev.map(fc =>
                    fc.featureType === featureType ? { ...fc, isActive } : fc
                )
            )
            toast({ title: "Updated", description: `${featureType} ${isActive ? "enabled" : "disabled"}` })
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update",
                variant: "destructive",
            })
        } finally {
            setSaving(null)
        }
    }

    const handleSaveCost = async (featureType: string, creditCost: number) => {
        setSaving(featureType)
        try {
            const res = await fetch("/api/admin/feature-costs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featureType, creditCost }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to save")
            }
            toast({ title: "Saved", description: `Credit cost updated for ${featureType}` })
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to save",
                variant: "destructive",
            })
        } finally {
            setSaving(null)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto space-y-6 py-8">
                <div className="flex items-center gap-3">
                    <Settings className="size-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Feature Credit Costs</h1>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-3">
                                <div className="h-5 w-32 rounded bg-muted" />
                                <div className="h-4 w-48 rounded bg-muted" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-10 w-20 rounded bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto space-y-6 py-8">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    const activeCount = featureCosts.filter(fc => fc.isActive).length
    const totalCredits = featureCosts.reduce((sum, fc) => sum + fc.creditCost, 0)

    return (
        <div className="container mx-auto space-y-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="size-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Feature Credit Costs</h1>
                        <p className="text-muted-foreground">
                            Manage how many credits each platform feature costs
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={loadFeatureCosts}>
                    <RefreshCw className="mr-2 size-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Features
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{featureCosts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Features
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Credit Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {featureCosts.length > 0 ? (totalCredits / featureCosts.length).toFixed(1) : 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feature Cost Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featureCosts.map(fc => (
                    <Card
                        key={fc.id}
                        className={fc.isActive ? "border-green-200 dark:border-green-900" : "border-gray-200 opacity-60 dark:border-gray-700"}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <Zap className="size-4 text-amber-500" />
                                    {fc.displayName}
                                </CardTitle>
                                <Switch
                                    checked={fc.isActive}
                                    onCheckedChange={(checked) =>
                                        handleToggleActive(fc.featureType, checked)
                                    }
                                    disabled={saving === fc.featureType}
                                />
                            </div>
                            <CardDescription>{fc.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <CreditCard className="size-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        min={0}
                                        value={fc.creditCost}
                                        onChange={(e) =>
                                            handleCostChange(fc.featureType, parseInt(e.target.value) || 0)
                                        }
                                        className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">credits</span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveCost(fc.featureType, fc.creditCost)}
                                    disabled={saving === fc.featureType}
                                >
                                    {saving === fc.featureType ? (
                                        <RefreshCw className="size-4 animate-spin" />
                                    ) : (
                                        <Save className="size-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant={fc.isActive ? "default" : "secondary"}>
                                    {fc.isActive ? "Active" : "Disabled"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {fc.featureType}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
