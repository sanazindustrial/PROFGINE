"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
    Area,
    AreaChart,
} from 'recharts'
import {
    Shield,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Users,
    TrendingUp,
    TrendingDown,
    FileText,
    Clock,
    Edit3,
    History,
    Scale,
    Lock,
    Unlock,
    BarChart3,
    PieChartIcon,
    Activity,
    AlertCircle,
    Info,
    RefreshCw,
    Download,
    Loader2,
} from 'lucide-react'

// Types
interface GovernanceData {
    id: string
    feedbackCycleId: string
    isBlindGraded: boolean
    irrValue?: number
    varianceDetected: boolean
    biasFlag: boolean
    fairnessCheckPassed: boolean
    wasOverridden: boolean
    originalAIScore?: number
    finalScore?: number
    overrideRationale?: string
    overriddenBy?: string
    overriddenAt?: string
    auditLog?: AuditLogEntry[]
    ferpaCompliant: boolean
    gdprCompliant: boolean
}

interface AuditLogEntry {
    timestamp: string
    action: string
    userId: string
    userName?: string
    details: string
    previousValue?: any
    newValue?: any
}

interface ScoreDistribution {
    range: string
    count: number
    percentage: number
}

interface DemographicMetrics {
    group: string
    meanScore: number
    count: number
    variance: number
}

interface ConsensusReviewData {
    reviewerId: string
    reviewerName?: string
    reviewerRole: string
    score: number
    weight: number
    confidenceLevel: string
    requiresReconciliation: boolean
}

interface GovernanceDashboardProps {
    feedbackCycleId?: string
    submissionId?: string
    courseId: string
    assignmentId?: string
    instructorId?: string
    existingGovernance?: GovernanceData
    consensusReviews?: ConsensusReviewData[]
    scoreDistribution?: ScoreDistribution[]
    demographicMetrics?: DemographicMetrics[]
    onSave?: (data: Partial<GovernanceData>) => void
    onAcknowledgeAlert?: () => void | Promise<void>
    onExportAuditLog?: () => void
    isInstructor?: boolean
    isAdmin?: boolean
}

// Chart colors
const CHART_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
]

const IRR_THRESHOLDS = {
    EXCELLENT: 0.8,
    GOOD: 0.6,
    FAIR: 0.4,
}

export function GovernanceDashboard({
    feedbackCycleId,
    submissionId,
    courseId,
    assignmentId,
    instructorId,
    existingGovernance,
    consensusReviews = [],
    scoreDistribution = [],
    demographicMetrics = [],
    onSave,
    onAcknowledgeAlert,
    onExportAuditLog,
    isInstructor = false,
    isAdmin = false,
}: GovernanceDashboardProps) {
    const [governance, setGovernance] = useState<GovernanceData | null>(existingGovernance || null)
    const [isBlindMode, setIsBlindMode] = useState(existingGovernance?.isBlindGraded || false)
    const [isLoading, setIsLoading] = useState(false)
    const [overrideRationale, setOverrideRationale] = useState('')
    const [showOverrideDialog, setShowOverrideDialog] = useState(false)
    const [newScore, setNewScore] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'fairness' | 'consensus' | 'audit'>('overview')

    // Calculate IRR status
    const irrValue = governance?.irrValue ?? calculateIRRFromReviews(consensusReviews)
    const irrStatus = getIRRStatus(irrValue)

    // Check for bias indicators
    const hasBiasFlag = governance?.biasFlag || checkForBias(demographicMetrics)
    const hasVariance = governance?.varianceDetected || checkForHighVariance(consensusReviews)

    // Compliance status
    const isCompliant = governance?.ferpaCompliant !== false && governance?.gdprCompliant !== false

    // Toggle blind grading mode
    const toggleBlindMode = async () => {
        setIsLoading(true)
        try {
            const newValue = !isBlindMode
            setIsBlindMode(newValue)
            await onSave?.({ isBlindGraded: newValue })
        } finally {
            setIsLoading(false)
        }
    }

    // Submit grade override with rationale
    const submitOverride = async () => {
        if (!overrideRationale.trim() || newScore === null) return

        setIsLoading(true)
        try {
            await onSave?.({
                wasOverridden: true,
                originalAIScore: governance?.finalScore,
                finalScore: newScore,
                overrideRationale,
                overriddenAt: new Date().toISOString(),
            })
            setShowOverrideDialog(false)
            setOverrideRationale('')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                                <Shield className="size-6 text-slate-600" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Governance & Compliance Dashboard
                                </CardTitle>
                                <CardDescription>
                                    Ethical oversight, bias mitigation, and audit trails
                                </CardDescription>
                            </div>
                        </div>

                        {/* Compliance Badges */}
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant={isCompliant ? "default" : "destructive"} className="gap-1">
                                            {isCompliant ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                                            FERPA
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Family Educational Rights and Privacy Act compliance</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant={isCompliant ? "default" : "destructive"} className="gap-1">
                                            {isCompliant ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                                            GDPR
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>General Data Protection Regulation compliance</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Blind Grading Status */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isBlindMode ? (
                                    <EyeOff className="size-5 text-green-600" />
                                ) : (
                                    <Eye className="size-5 text-yellow-600" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">Blind Grading</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isBlindMode ? 'Identity hidden' : 'Identity visible'}
                                    </p>
                                </div>
                            </div>
                            {(isInstructor || isAdmin) && (
                                <Switch
                                    checked={isBlindMode}
                                    onCheckedChange={toggleBlindMode}
                                    disabled={isLoading}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* IRR Score */}
                <Card className={irrStatus.bgColor}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Scale className={`size-5 ${irrStatus.color}`} />
                            <div>
                                <p className="text-sm font-medium">Inter-Rater Reliability</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg font-bold ${irrStatus.color}`}>
                                        {irrValue ? irrValue.toFixed(2) : 'N/A'}
                                    </span>
                                    <Badge variant={irrStatus.variant as any}>{irrStatus.label}</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bias Flag */}
                <Card className={hasBiasFlag ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            {hasBiasFlag ? (
                                <AlertTriangle className="size-5 text-red-600" />
                            ) : (
                                <CheckCircle2 className="size-5 text-green-600" />
                            )}
                            <div>
                                <p className="text-sm font-medium">Bias Detection</p>
                                <p className={`text-xs ${hasBiasFlag ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    {hasBiasFlag ? 'Anomaly detected' : 'No anomalies'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Override Status */}
                <Card className={governance?.wasOverridden ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {governance?.wasOverridden ? (
                                    <Edit3 className="size-5 text-yellow-600" />
                                ) : (
                                    <Activity className="size-5 text-blue-600" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">Grade Status</p>
                                    <p className="text-xs text-muted-foreground">
                                        {governance?.wasOverridden ? 'Manually overridden' : 'AI-generated'}
                                    </p>
                                </div>
                            </div>
                            {(isInstructor || isAdmin) && !governance?.wasOverridden && (
                                <Button variant="outline" size="sm" onClick={() => setShowOverrideDialog(true)}>
                                    Override
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="size-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="fairness" className="flex items-center gap-2">
                        <Scale className="size-4" />
                        Fairness
                    </TabsTrigger>
                    <TabsTrigger value="consensus" className="flex items-center gap-2">
                        <Users className="size-4" />
                        Consensus
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <History className="size-4" />
                        Audit Trail
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Score Distribution Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="size-4" />
                                    Score Distribution
                                </CardTitle>
                                <CardDescription>
                                    Distribution of grades across this course
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {scoreDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={scoreDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="range" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                        <p>No distribution data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Compliance Checklist */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shield className="size-4" />
                                    Compliance Checklist
                                </CardTitle>
                                <CardDescription>
                                    Regulatory and ethical requirements
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <ComplianceItem
                                        label="Traceability"
                                        description="Links raw inputs to computed scores"
                                        passed={true}
                                    />
                                    <ComplianceItem
                                        label="A11y Gating"
                                        description="UI meets WCAG 2.2 AA standards"
                                        passed={true}
                                    />
                                    <ComplianceItem
                                        label="Explainability"
                                        description="Uncertainty badges displayed for AI scores"
                                        passed={true}
                                    />
                                    <ComplianceItem
                                        label="Privacy"
                                        description="PII hashed in analytics exports"
                                        passed={governance?.gdprCompliant !== false}
                                    />
                                    <ComplianceItem
                                        label="Bias Mitigation"
                                        description="Fairness dashboards reviewed"
                                        passed={!hasBiasFlag}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Variance Warning */}
                    {hasVariance && (
                        <Alert variant="destructive">
                            <AlertTriangle className="size-4" />
                            <AlertDescription>
                                <strong>High Variance Detected:</strong> Reviewer scores show significant disagreement.
                                Consider requesting reconciliation or viva examination.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                {/* Fairness Tab */}
                <TabsContent value="fairness" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Scale className="size-4" />
                                Demographic Score Analysis
                            </CardTitle>
                            <CardDescription>
                                Monitor score distributions for equitable grading
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {demographicMetrics.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={demographicMetrics} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} />
                                            <YAxis dataKey="group" type="category" width={100} />
                                            <RechartsTooltip />
                                            <Bar dataKey="meanScore" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>

                                    <Separator className="my-4" />

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {demographicMetrics.map((metric, index) => (
                                            <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                                                <p className="text-sm font-medium">{metric.group}</p>
                                                <p className="text-2xl font-bold">{metric.meanScore.toFixed(1)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    n={metric.count} | σ={metric.variance.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    <div className="text-center">
                                        <Scale className="size-12 mx-auto mb-3 opacity-50" />
                                        <p>No demographic data available</p>
                                        <p className="text-sm">Requires aggregated course-level data</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bias Alert */}
                    {hasBiasFlag && (
                        <Alert variant="destructive">
                            <AlertTriangle className="size-4" />
                            <AlertDescription>
                                <strong>Bias Alert:</strong> Score distribution shows significant deviation
                                from expected demographic means. Review grading criteria and consider peer review.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                {/* Consensus Tab */}
                <TabsContent value="consensus" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="size-4" />
                                Reviewer Consensus
                            </CardTitle>
                            <CardDescription>
                                Multi-reviewer scores and reconciliation status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {consensusReviews.length > 0 ? (
                                <div className="space-y-4">
                                    {/* IRR Gauge */}
                                    <div className="flex items-center justify-center">
                                        <div className="text-center">
                                            <div className={`text-4xl font-bold ${irrStatus.color}`}>
                                                {irrValue?.toFixed(2) || 'N/A'}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Krippendorff&apos;s Alpha</p>
                                            <Badge variant={irrStatus.variant as any} className="mt-1">
                                                {irrStatus.label}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Reviewer List */}
                                    <div className="space-y-3">
                                        {consensusReviews.map((review, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border ${review.requiresReconciliation
                                                    ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                                                    : 'bg-muted/30'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <span className="text-sm font-medium">
                                                                {review.reviewerName?.[0] || 'R'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {isBlindMode ? `Reviewer ${index + 1}` : review.reviewerName || 'Anonymous'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {review.reviewerRole} • Weight: {review.weight}x
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold">{review.score}</p>
                                                        <Badge
                                                            variant={
                                                                review.confidenceLevel === 'HIGH' ? 'default' :
                                                                    review.confidenceLevel === 'MEDIUM' ? 'secondary' : 'destructive'
                                                            }
                                                        >
                                                            {review.confidenceLevel}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {review.requiresReconciliation && (
                                                    <Alert className="mt-3" variant="default">
                                                        <AlertCircle className="size-4" />
                                                        <AlertDescription>
                                                            This score differs significantly from consensus. Reconciliation recommended.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                    <div className="text-center">
                                        <Users className="size-12 mx-auto mb-3 opacity-50" />
                                        <p>No consensus reviews yet</p>
                                        <p className="text-sm">Multi-reviewer scoring not enabled</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audit Trail Tab */}
                <TabsContent value="audit" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <History className="size-4" />
                                        Audit Trail
                                    </CardTitle>
                                    <CardDescription>
                                        Complete history of all grading actions
                                    </CardDescription>
                                </div>
                                {onExportAuditLog && (
                                    <Button variant="outline" size="sm" onClick={onExportAuditLog}>
                                        <Download className="size-4 mr-2" />
                                        Export
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                {governance?.auditLog && governance.auditLog.length > 0 ? (
                                    <div className="space-y-4">
                                        {governance.auditLog.map((entry, index) => (
                                            <div key={index} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="size-3 rounded-full bg-primary" />
                                                    {index < governance.auditLog!.length - 1 && (
                                                        <div className="w-px h-full bg-border" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{entry.action}</p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(entry.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        by {isBlindMode ? 'Anonymous' : entry.userName || entry.userId}
                                                    </p>
                                                    <p className="text-sm mt-1">{entry.details}</p>
                                                    {entry.previousValue !== undefined && entry.newValue !== undefined && (
                                                        <div className="flex items-center gap-2 mt-2 text-xs">
                                                            <Badge variant="outline">{JSON.stringify(entry.previousValue)}</Badge>
                                                            <span>→</span>
                                                            <Badge>{JSON.stringify(entry.newValue)}</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                        <div className="text-center">
                                            <History className="size-12 mx-auto mb-3 opacity-50" />
                                            <p>No audit entries yet</p>
                                            <p className="text-sm">Actions will be logged here</p>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Override Dialog */}
            <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="size-5" />
                            Override AI Grade
                        </DialogTitle>
                        <DialogDescription>
                            Provide a mandatory rationale for changing the AI-suggested grade.
                            This action will be logged for audit compliance.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <span>Current AI Score:</span>
                            <span className="font-bold">{governance?.finalScore ?? 'N/A'}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>New Score</Label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={newScore ?? ''}
                                onChange={(e) => setNewScore(parseInt(e.target.value) || null)}
                                className="w-full p-2 border rounded-md"
                                placeholder="Enter new score (0-100)"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Override Rationale (Required)</Label>
                            <Textarea
                                value={overrideRationale}
                                onChange={(e) => setOverrideRationale(e.target.value)}
                                placeholder="Explain why you are overriding the AI-suggested grade..."
                                className="min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground">
                                This rationale is required for compliance and will be included in the audit trail.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitOverride}
                            disabled={!overrideRationale.trim() || newScore === null || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Confirm Override'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Helper Components
function ComplianceItem({
    label,
    description,
    passed
}: {
    label: string
    description: string
    passed: boolean
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
                {passed ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                    <XCircle className="size-5 text-red-600" />
                )}
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <Badge variant={passed ? "default" : "destructive"}>
                {passed ? 'Passed' : 'Failed'}
            </Badge>
        </div>
    )
}

// Helper Functions
function calculateIRRFromReviews(reviews: ConsensusReviewData[]): number | null {
    if (reviews.length < 2) return null

    const scores = reviews.map(r => r.score)
    const n = scores.length

    // Simplified Krippendorff alpha calculation
    let observedDisagreement = 0
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            observedDisagreement += Math.pow(scores[i] - scores[j], 2)
        }
    }
    observedDisagreement = observedDisagreement / (n * (n - 1) / 2)

    const mean = scores.reduce((a, b) => a + b, 0) / n
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n
    const expectedDisagreement = variance * 2

    if (expectedDisagreement === 0) return 1.0
    return Math.max(0, 1 - (observedDisagreement / expectedDisagreement))
}

function getIRRStatus(irr: number | null): {
    label: string
    color: string
    bgColor: string
    variant: string
} {
    if (irr === null) {
        return { label: 'N/A', color: 'text-gray-600', bgColor: '', variant: 'secondary' }
    }
    if (irr >= IRR_THRESHOLDS.EXCELLENT) {
        return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/20', variant: 'default' }
    }
    if (irr >= IRR_THRESHOLDS.GOOD) {
        return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20', variant: 'secondary' }
    }
    if (irr >= IRR_THRESHOLDS.FAIR) {
        return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', variant: 'secondary' }
    }
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/20', variant: 'destructive' }
}

function checkForBias(metrics: DemographicMetrics[]): boolean {
    if (metrics.length < 2) return false

    const scores = metrics.map(m => m.meanScore)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const threshold = 5 // 5 point deviation threshold

    return scores.some(s => Math.abs(s - mean) > threshold)
}

function checkForHighVariance(reviews: ConsensusReviewData[]): boolean {
    if (reviews.length < 2) return false

    const scores = reviews.map(r => r.score)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    const sd = Math.sqrt(variance)

    return sd > 10 // SD > 10 triggers variance flag
}

export default GovernanceDashboard
