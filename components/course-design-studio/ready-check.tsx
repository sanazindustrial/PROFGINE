"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Shield,
    Layout,
    FileText,
    Accessibility,
    Clock,
    CheckSquare,
    ArrowRight,
    Star,
    Info,
    ChevronRight,
} from "lucide-react"
import type { ReadyCheckReport, ReadyCheckResult, ReadyCheckType } from "@/types/course-design-studio.types"

interface ReadyCheckProps {
    courseId: string
    onRunCheck: () => Promise<ReadyCheckReport>
    onPublish: () => void
    report?: ReadyCheckReport | null
    isRunning?: boolean
}

// Check type configuration
const checkTypeConfig: Record<ReadyCheckType, {
    icon: React.ReactNode
    title: string
    description: string
    weight: number
}> = {
    OBJECTIVE_COVERAGE: {
        icon: <CheckSquare className="size-5" />,
        title: "Objective Coverage",
        description: "Ensure objectives are addressed across sections",
        weight: 25,
    },
    CITATION_COMPLIANCE: {
        icon: <FileText className="size-5" />,
        title: "Citation Compliance",
        description: "Verify content has proper citations",
        weight: 15,
    },
    ACCESSIBILITY_WCAG: {
        icon: <Accessibility className="size-5" />,
        title: "Accessibility",
        description: "Check for accessibility compliance (ADA/WCAG)",
        weight: 10,
    },
    AI_DISCLOSURE: {
        icon: <Info className="size-5" />,
        title: "AI Disclosure",
        description: "Confirm AI-generated content disclosures",
        weight: 10,
    },
    POLICY_COMPLETENESS: {
        icon: <Shield className="size-5" />,
        title: "Policy Completeness",
        description: "Ensure required policies are present",
        weight: 20,
    },
    CONTENT_ALIGNMENT: {
        icon: <Layout className="size-5" />,
        title: "Content Alignment",
        description: "Verify content aligns with objectives",
        weight: 10,
    },
    WORKLOAD_BALANCE: {
        icon: <Clock className="size-5" />,
        title: "Workload Balance",
        description: "Check weekly workload balance",
        weight: 10,
    },
}

// Status colors and icons
const statusConfig = {
    PASSED: {
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-200 dark:border-green-800",
        icon: <CheckCircle2 className="size-5 text-green-600" />,
        label: "Passed",
    },
    FAILED: {
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        borderColor: "border-red-200 dark:border-red-800",
        icon: <XCircle className="size-5 text-red-600" />,
        label: "Failed",
    },
    WARNING: {
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        icon: <AlertTriangle className="size-5 text-yellow-600" />,
        label: "Warning",
    },
    PENDING: {
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        borderColor: "border-border",
        icon: <Clock className="size-5 text-muted-foreground" />,
        label: "Pending",
    },
}

export function ReadyCheck({
    courseId,
    onRunCheck,
    onPublish,
    report,
    isRunning = false,
}: ReadyCheckProps) {
    const [localReport, setLocalReport] = useState<ReadyCheckReport | null>(report || null)
    const [isChecking, setIsChecking] = useState(isRunning)
    const [expandedCheck, setExpandedCheck] = useState<string | null>(null)

    // Calculate overall metrics
    const calculateMetrics = () => {
        if (!localReport?.checks) {
            return { passRate: 0, warningCount: 0, failCount: 0, totalChecks: 0 }
        }

        const results = localReport.checks
        const totalChecks = results.length
        const passCount = results.filter(r => r.status === 'PASSED').length
        const warningCount = results.filter(r => r.status === 'WARNING').length
        const failCount = results.filter(r => r.status === 'FAILED').length

        return {
            passRate: totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0,
            warningCount,
            failCount,
            totalChecks,
        }
    }

    const metrics = calculateMetrics()

    // Run check
    const handleRunCheck = async () => {
        setIsChecking(true)
        try {
            const result = await onRunCheck()
            setLocalReport(result)
        } catch (error) {
            console.error("Ready check error:", error)
        } finally {
            setIsChecking(false)
        }
    }

    // Group results by check type
    const emptyGroupedResults = Object.keys(checkTypeConfig).reduce((acc, key) => {
        acc[key as ReadyCheckType] = []
        return acc
    }, {} as Record<ReadyCheckType, ReadyCheckResult[]>)

    const groupedResults: Record<ReadyCheckType, ReadyCheckResult[]> =
        localReport?.checks?.reduce((acc, result) => {
            acc[result.checkType].push(result)
            return acc
        }, emptyGroupedResults) || emptyGroupedResults

    // Check if can publish
    const canPublish = localReport?.overallStatus === 'PASSED' ||
        (localReport?.overallStatus === 'WARNING' && metrics.failCount === 0)

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="size-5" />
                            Ready Check
                        </CardTitle>
                        <CardDescription>
                            Validate your course before publishing
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleRunCheck}
                        disabled={isChecking}
                        variant={localReport ? "outline" : "default"}
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : localReport ? (
                            <>
                                <RefreshCw className="size-4 mr-2" />
                                Re-run Check
                            </>
                        ) : (
                            <>
                                <CheckSquare className="size-4 mr-2" />
                                Run Check
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {!localReport && !isChecking ? (
                    <div className="text-center py-12">
                        <Shield className="size-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="font-semibold text-lg mb-2">No validation run yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Run a ready check to validate your course against completeness,
                            accessibility, governance, and alignment requirements.
                        </p>
                        <Button onClick={handleRunCheck}>
                            <CheckSquare className="size-4 mr-2" />
                            Start Validation
                        </Button>
                    </div>
                ) : isChecking ? (
                    <div className="text-center py-12">
                        <Loader2 className="size-16 mx-auto text-primary mb-4 animate-spin" />
                        <h3 className="font-semibold text-lg mb-2">Running validation...</h3>
                        <p className="text-sm text-muted-foreground">
                            Checking completeness, alignment, accessibility, and more
                        </p>
                        <div className="mt-6 max-w-xs mx-auto">
                            <Progress value={undefined} className="animate-pulse" />
                        </div>
                    </div>
                ) : localReport && (
                    <div className="space-y-6">
                        {/* Overall Status Banner */}
                        <div className={`
              flex items-center justify-between p-4 rounded-lg border
              ${statusConfig[localReport.overallStatus].bgColor}
              ${statusConfig[localReport.overallStatus].borderColor}
            `}>
                            <div className="flex items-center gap-3">
                                {statusConfig[localReport.overallStatus].icon}
                                <div>
                                    <p className={`font-semibold ${statusConfig[localReport.overallStatus].color}`}>
                                        {localReport.overallStatus === 'PASSED'
                                            ? 'Ready to Publish!'
                                            : localReport.overallStatus === 'WARNING'
                                                ? 'Ready with Warnings'
                                                : 'Not Ready - Issues Found'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {metrics.passRate}% of checks passed
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{metrics.passRate}%</p>
                                <p className="text-xs text-muted-foreground">Score</p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{localReport.checks?.filter(r => r.status === 'PASSED').length || 0}</p>
                                <p className="text-xs text-muted-foreground">Passed</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-yellow-600">{metrics.warningCount}</p>
                                <p className="text-xs text-muted-foreground">Warnings</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{metrics.failCount}</p>
                                <p className="text-xs text-muted-foreground">Failed</p>
                            </div>
                        </div>

                        {/* Blockers Alert */}
                        {localReport.blockers && localReport.blockers.length > 0 && (
                            <Alert variant="destructive">
                                <XCircle className="size-4" />
                                <AlertTitle>Publish Blocked</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        {localReport.blockers.map((blocker, i) => (
                                            <li key={i}>{blocker}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Detailed Results */}
                        <ScrollArea className="h-[400px]">
                            <Accordion
                                type="single"
                                collapsible
                                value={expandedCheck || undefined}
                                onValueChange={(value) => setExpandedCheck(value ?? null)}
                            >
                                {Object.entries(checkTypeConfig).map(([type, config]) => {
                                    const results = groupedResults[type as ReadyCheckType] || []
                                    const passCount = results.filter((r: ReadyCheckResult) => r.status === 'PASSED').length
                                    const totalCount = results.length
                                    const hasIssues = results.some((r: ReadyCheckResult) => r.status !== 'PASSED')

                                    return (
                                        <AccordionItem key={type} value={type}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className={`p-2 rounded-md ${hasIssues ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                                        {config.icon}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-medium">{config.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {config.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={hasIssues ? "outline" : "default"} className={!hasIssues ? "bg-green-600" : ""}>
                                                            {passCount}/{totalCount}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-2 pt-2">
                                                    {results.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No checks in this category
                                                        </p>
                                                    ) : (
                                                        results.map((result: ReadyCheckResult, i: number) => (
                                                            <div
                                                                key={i}
                                                                className={`
                                  flex items-start gap-3 p-3 rounded-md border
                                  ${statusConfig[result.status].bgColor}
                                  ${statusConfig[result.status].borderColor}
                                `}
                                                            >
                                                                {statusConfig[result.status].icon}
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm">
                                                                        {result.issues[0]?.message || "No issues reported."}
                                                                    </p>
                                                                    {result.details && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {result.details}
                                                                        </p>
                                                                    )}
                                                                    {result.issues.length > 1 && (
                                                                        <ul className="mt-2 list-disc list-inside text-xs text-muted-foreground">
                                                                            {result.issues.slice(1).map((issue, issueIndex) => (
                                                                                <li key={issueIndex}>{issue.message}</li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                    {result.suggestions.length > 0 && (
                                                                        <div className="mt-2 space-y-1 text-xs text-primary">
                                                                            {result.suggestions.map((suggestion, suggestionIndex) => (
                                                                                <div key={suggestionIndex} className="flex items-center gap-1">
                                                                                    <Star className="size-3" />
                                                                                    <span>{suggestion.message}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        </ScrollArea>

                        {/* Recommendations */}
                        {localReport.summary && (
                            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-sm">
                                <Info className="size-4 text-primary flex-shrink-0 mt-0.5" />
                                <p>{localReport.summary}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            {localReport && (
                <CardFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="size-4" />
                            Last checked: {new Date(localReport.createdAt).toLocaleString()}
                        </div>
                        <Button
                            onClick={onPublish}
                            disabled={!canPublish}
                            className="gap-2"
                        >
                            {canPublish ? (
                                <>
                                    Publish Course
                                    <ArrowRight className="size-4" />
                                </>
                            ) : (
                                <>
                                    <XCircle className="size-4" />
                                    Fix Issues to Publish
                                </>
                            )}
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}

// Compact version for sidebar/summary
export function ReadyCheckSummary({
    report,
    onClick,
}: {
    report: ReadyCheckReport | null
    onClick: () => void
}) {
    if (!report) {
        return (
            <Button variant="outline" onClick={onClick} className="w-full justify-start">
                <Shield className="size-4 mr-2" />
                Run Ready Check
                <ChevronRight className="size-4 ml-auto" />
            </Button>
        )
    }

    const statusColor = {
        PASSED: "text-green-600",
        WARNING: "text-yellow-600",
        FAILED: "text-red-600",
        PENDING: "text-muted-foreground",
    }

    return (
        <Button
            variant="outline"
            onClick={onClick}
            className={`w-full justify-start ${statusColor[report.overallStatus]}`}
        >
            {statusConfig[report.overallStatus].icon}
            <span className="ml-2">
                {report.overallStatus === 'PASSED' ? 'Ready' : report.overallStatus === 'WARNING' ? 'Warnings' : report.overallStatus === 'PENDING' ? 'Pending' : 'Issues'}
            </span>
            <ChevronRight className="size-4 ml-auto" />
        </Button>
    )
}
