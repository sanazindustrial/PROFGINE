"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Activity,
    AlertTriangle,
    AlertCircle,
    ArrowRight,
    Bell,
    BookOpen,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Filter,
    Flag,
    Heart,
    HelpCircle,
    Lightbulb,
    Loader2,
    Mail,
    MessageCircle,
    MoreVertical,
    RefreshCw,
    Send,
    ThumbsUp,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    XCircle,
    Zap,
} from 'lucide-react'

// Types
type NudgeType = 'MOTIVATIONAL' | 'REMINDER' | 'ESCALATION' | 'SUPPORT_OFFER'
type InterventionStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'ACTION_TAKEN' | 'ESCALATED'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface StudentRiskData {
    studentId: string
    studentName: string
    studentEmail: string
    riskLevel: RiskLevel
    riskScore: number // 0-100
    riskFactors: RiskFactor[]
    engagementScore: number // 0-100
    lastActivity?: string
    courseProgress: number // 0-100
    interventionCount: number
    activeInterventions: InterventionNudge[]
}

interface RiskFactor {
    type: 'LOW_ENGAGEMENT' | 'MISSED_DEADLINE' | 'FAILING_GRADE' | 'HIGH_VARIANCE' | 'INTEGRITY_CONCERN' | 'INCOMPLETE_GATE'
    severity: RiskLevel
    description: string
    relatedSubmissionId?: string
}

interface InterventionNudge {
    id: string
    studentId: string
    courseId?: string
    submissionId?: string
    nudgeType: NudgeType
    status: InterventionStatus
    positivePart: string
    constructivePart: string
    motivationalPart: string
    actionableSteps?: ActionableStep[]
    estimatedTime?: string
    triggerEvent: string
    triggerData?: any
    sentAt?: string
    acknowledgedAt?: string
    actionTakenAt?: string
    escalationLevel: number
    escalatedToAdvisor: boolean
    createdAt: string
}

interface ActionableStep {
    step: string
    completed: boolean
    dueDate?: string
}

interface InterventionTemplate {
    id: string
    name: string
    nudgeType: NudgeType
    positivePart: string
    constructivePart: string
    motivationalPart: string
    actionableSteps: string[]
    estimatedTime: string
}

interface InterventionHubProps {
    courseId: string
    courseName?: string
    studentsAtRisk: StudentRiskData[]
    templates?: InterventionTemplate[]
    onSendIntervention: (intervention: Omit<InterventionNudge, 'id' | 'createdAt'>) => Promise<void>
    onEscalate: (interventionId: string, advisorId?: string) => Promise<void>
    onRequestViva: (studentId: string, submissionId: string, reason: string) => Promise<void>
    onRefresh?: () => void
    isLoading?: boolean
}

// Risk level configuration
const RISK_CONFIG: Record<RiskLevel, {
    label: string
    color: string
    bgColor: string
    icon: React.ElementType
}> = {
    LOW: {
        label: 'Low Risk',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: CheckCircle2,
    },
    MEDIUM: {
        label: 'Medium Risk',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: AlertCircle,
    },
    HIGH: {
        label: 'High Risk',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        icon: AlertTriangle,
    },
    CRITICAL: {
        label: 'Critical',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: XCircle,
    },
}

const NUDGE_TYPE_CONFIG: Record<NudgeType, {
    label: string
    color: string
    icon: React.ElementType
}> = {
    MOTIVATIONAL: { label: 'Motivational', color: 'text-green-600', icon: Heart },
    REMINDER: { label: 'Reminder', color: 'text-blue-600', icon: Bell },
    ESCALATION: { label: 'Escalation', color: 'text-orange-600', icon: Flag },
    SUPPORT_OFFER: { label: 'Support Offer', color: 'text-purple-600', icon: HelpCircle },
}

const STATUS_CONFIG: Record<InterventionStatus, {
    label: string
    color: string
    bgColor: string
}> = {
    PENDING: { label: 'Pending', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    SENT: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    ACKNOWLEDGED: { label: 'Acknowledged', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    ACTION_TAKEN: { label: 'Action Taken', color: 'text-green-600', bgColor: 'bg-green-100' },
    ESCALATED: { label: 'Escalated', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// Default templates
const DEFAULT_TEMPLATES: InterventionTemplate[] = [
    {
        id: 'motivational-gentle',
        name: 'Gentle Encouragement',
        nudgeType: 'MOTIVATIONAL',
        positivePart: "I've noticed your engagement in the course so far and appreciate your effort!",
        constructivePart: "However, I wanted to reach out because it looks like you might be facing some challenges with the current assignment.",
        motivationalPart: "Remember, you've got this! I'm here to support you. Let's work through this together.",
        actionableSteps: ['Review the assignment rubric', 'Reach out during office hours if needed'],
        estimatedTime: '15 minutes',
    },
    {
        id: 'reminder-deadline',
        name: 'Deadline Reminder',
        nudgeType: 'REMINDER',
        positivePart: "You've shown great progress in the course!",
        constructivePart: "I wanted to remind you that the upcoming deadline is approaching. Don't forget to complete your self-evaluation and AI-use statement.",
        motivationalPart: "You're almost there - just a few more steps to submit successfully!",
        actionableSteps: ['Complete the Ready-Gate self-evaluation', 'Submit your AI-use statement', 'Review and submit'],
        estimatedTime: '30 minutes',
    },
    {
        id: 'support-academic',
        name: 'Academic Support Offer',
        nudgeType: 'SUPPORT_OFFER',
        positivePart: "I value your presence in our class and want to see you succeed.",
        constructivePart: "I've noticed some areas where additional support might help you reach your full potential.",
        motivationalPart: "Our academic support services are available to help. Would you like me to connect you with a tutor?",
        actionableSteps: ['Schedule a meeting with academic support', 'Review supplementary materials', 'Join study group sessions'],
        estimatedTime: '45 minutes',
    },
]

export function InterventionHub({
    courseId,
    courseName,
    studentsAtRisk,
    templates = DEFAULT_TEMPLATES,
    onSendIntervention,
    onEscalate,
    onRequestViva,
    onRefresh,
    isLoading = false,
}: InterventionHubProps) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'compose' | 'history'>('dashboard')
    const [selectedStudent, setSelectedStudent] = useState<StudentRiskData | null>(null)
    const [showComposeDialog, setShowComposeDialog] = useState(false)
    const [showVivaDialog, setShowVivaDialog] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [filterRisk, setFilterRisk] = useState<RiskLevel | 'ALL'>('ALL')

    // Compose form state
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [nudgeType, setNudgeType] = useState<NudgeType>('MOTIVATIONAL')
    const [positivePart, setPositivePart] = useState('')
    const [constructivePart, setConstructivePart] = useState('')
    const [motivationalPart, setMotivationalPart] = useState('')
    const [actionableSteps, setActionableSteps] = useState<string[]>([])
    const [estimatedTime, setEstimatedTime] = useState('15 minutes')
    const [vivaReason, setVivaReason] = useState('')

    // Filter students based on risk level
    const filteredStudents = filterRisk === 'ALL'
        ? studentsAtRisk
        : studentsAtRisk.filter(s => s.riskLevel === filterRisk)

    // Sort by risk score (highest first)
    const sortedStudents = [...filteredStudents].sort((a, b) => b.riskScore - a.riskScore)

    // Statistics
    const stats = {
        total: studentsAtRisk.length,
        critical: studentsAtRisk.filter(s => s.riskLevel === 'CRITICAL').length,
        high: studentsAtRisk.filter(s => s.riskLevel === 'HIGH').length,
        medium: studentsAtRisk.filter(s => s.riskLevel === 'MEDIUM').length,
        low: studentsAtRisk.filter(s => s.riskLevel === 'LOW').length,
        pendingInterventions: studentsAtRisk.reduce(
            (sum, s) => sum + s.activeInterventions.filter(i => i.status === 'PENDING' || i.status === 'SENT').length,
            0
        ),
    }

    // Apply template
    const applyTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId)
        if (template) {
            setSelectedTemplate(templateId)
            setNudgeType(template.nudgeType)
            setPositivePart(template.positivePart)
            setConstructivePart(template.constructivePart)
            setMotivationalPart(template.motivationalPart)
            setActionableSteps(template.actionableSteps)
            setEstimatedTime(template.estimatedTime)
        }
    }

    // Send intervention
    const handleSendIntervention = async () => {
        if (!selectedStudent) return

        setIsSending(true)
        try {
            await onSendIntervention({
                studentId: selectedStudent.studentId,
                courseId,
                nudgeType,
                status: 'PENDING',
                positivePart,
                constructivePart,
                motivationalPart,
                actionableSteps: actionableSteps.map(s => ({ step: s, completed: false })),
                estimatedTime,
                triggerEvent: 'MANUAL_INTERVENTION',
                escalationLevel: 0,
                escalatedToAdvisor: false,
            })
            setShowComposeDialog(false)
            resetComposeForm()
        } finally {
            setIsSending(false)
        }
    }

    // Request viva
    const handleRequestViva = async () => {
        if (!selectedStudent || !vivaReason.trim()) return

        setIsSending(true)
        try {
            // Find the most recent submission with issues
            const relevantSubmission = selectedStudent.riskFactors.find(
                f => f.relatedSubmissionId && (f.type === 'INTEGRITY_CONCERN' || f.type === 'HIGH_VARIANCE')
            )

            await onRequestViva(
                selectedStudent.studentId,
                relevantSubmission?.relatedSubmissionId || '',
                vivaReason
            )
            setShowVivaDialog(false)
            setVivaReason('')
        } finally {
            setIsSending(false)
        }
    }

    // Reset compose form
    const resetComposeForm = () => {
        setSelectedTemplate(null)
        setNudgeType('MOTIVATIONAL')
        setPositivePart('')
        setConstructivePart('')
        setMotivationalPart('')
        setActionableSteps([])
        setEstimatedTime('15 minutes')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                                <Activity className="size-6 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Insight & Intervention Hub
                                    {courseName && <Badge variant="outline">{courseName}</Badge>}
                                </CardTitle>
                                <CardDescription>
                                    Predictive risk identification and personalized student support
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onRefresh && (
                                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                                    <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Users className="size-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total At Risk</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <XCircle className="size-8 mx-auto mb-2 text-red-600" />
                            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                            <p className="text-xs text-muted-foreground">Critical</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertTriangle className="size-8 mx-auto mb-2 text-orange-600" />
                            <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                            <p className="text-xs text-muted-foreground">High</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertCircle className="size-8 mx-auto mb-2 text-yellow-600" />
                            <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
                            <p className="text-xs text-muted-foreground">Medium</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle2 className="size-8 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold text-green-600">{stats.low}</p>
                            <p className="text-xs text-muted-foreground">Low</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Mail className="size-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-2xl font-bold text-blue-600">{stats.pendingInterventions}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="dashboard" className="flex items-center gap-2">
                            <Activity className="size-4" />
                            Risk Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="compose" className="flex items-center gap-2">
                            <MessageCircle className="size-4" />
                            Quick Actions
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <Clock className="size-4" />
                            Intervention History
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Filter:</Label>
                        <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v as any)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Levels</SelectItem>
                                <SelectItem value="CRITICAL">Critical Only</SelectItem>
                                <SelectItem value="HIGH">High Risk</SelectItem>
                                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                                <SelectItem value="LOW">Low Risk</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Risk Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Students At Risk</CardTitle>
                            <CardDescription>
                                Sorted by risk score. Click on a student to view details and send interventions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sortedStudents.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CheckCircle2 className="size-16 mx-auto mb-4 text-green-500 opacity-50" />
                                    <p className="text-lg font-medium">No students at risk!</p>
                                    <p className="text-sm">All students are on track with their coursework.</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[500px]">
                                    <div className="space-y-3">
                                        {sortedStudents.map((student) => (
                                            <StudentRiskCard
                                                key={student.studentId}
                                                student={student}
                                                onSelect={() => {
                                                    setSelectedStudent(student)
                                                    setShowComposeDialog(true)
                                                }}
                                                onEscalate={onEscalate}
                                                onRequestViva={() => {
                                                    setSelectedStudent(student)
                                                    setShowVivaDialog(true)
                                                }}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Quick Actions Tab */}
                <TabsContent value="compose" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Templates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Zap className="size-4" />
                                    Quick Intervention Templates
                                </CardTitle>
                                <CardDescription>
                                    Pre-written messages following the Sandwich feedback style
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {templates.map((template) => {
                                    const config = NUDGE_TYPE_CONFIG[template.nudgeType]
                                    return (
                                        <div
                                            key={template.id}
                                            className="p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                                            onClick={() => applyTemplate(template.id)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <config.icon className={`size-4 ${config.color}`} />
                                                    <span className="font-medium">{template.name}</span>
                                                </div>
                                                <Badge variant="outline">{config.label}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {template.positivePart}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <Clock className="size-3" />
                                                Est. {template.estimatedTime}
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>

                        {/* Batch Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="size-4" />
                                    Batch Actions
                                </CardTitle>
                                <CardDescription>
                                    Send interventions to multiple students at once
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                                    <p className="text-sm font-medium">Send to all Critical students ({stats.critical})</p>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        disabled={stats.critical === 0}
                                    >
                                        <Send className="size-4 mr-2" />
                                        Send Urgent Support Message
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                                    <p className="text-sm font-medium">Send to all High Risk students ({stats.high})</p>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={stats.high === 0}
                                    >
                                        <Bell className="size-4 mr-2" />
                                        Send Reminder Nudge
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                                    <p className="text-sm font-medium">Send encouragement to Low Risk ({stats.low})</p>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={stats.low === 0}
                                    >
                                        <ThumbsUp className="size-4 mr-2" />
                                        Send Positive Reinforcement
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="size-4" />
                                Recent Interventions
                            </CardTitle>
                            <CardDescription>
                                Track the status of all sent interventions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-3">
                                    {studentsAtRisk.flatMap(s => s.activeInterventions).length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Mail className="size-16 mx-auto mb-4 opacity-50" />
                                            <p>No interventions sent yet</p>
                                        </div>
                                    ) : (
                                        studentsAtRisk.flatMap(student =>
                                            student.activeInterventions.map(intervention => (
                                                <InterventionCard
                                                    key={intervention.id}
                                                    intervention={intervention}
                                                    studentName={student.studentName}
                                                    onEscalate={onEscalate}
                                                />
                                            ))
                                        ).sort((a, b) =>
                                            new Date(b.props.intervention.createdAt).getTime() -
                                            new Date(a.props.intervention.createdAt).getTime()
                                        )
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Compose Intervention Dialog */}
            <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="size-5" />
                            Send Intervention to {selectedStudent?.studentName}
                        </DialogTitle>
                        <DialogDescription>
                            Compose a personalized &quot;Sandwich&quot; style support message
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        {/* Template Selection */}
                        <div className="space-y-2">
                            <Label>Start from Template</Label>
                            <Select value={selectedTemplate || ''} onValueChange={applyTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nudge Type */}
                        <div className="space-y-2">
                            <Label>Intervention Type</Label>
                            <Select value={nudgeType} onValueChange={(v) => setNudgeType(v as NudgeType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(NUDGE_TYPE_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <config.icon className={`size-4 ${config.color}`} />
                                                {config.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Positive (Top Bun) */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-green-600">
                                <ThumbsUp className="size-4" />
                                Positive Opening (Top Bun)
                            </Label>
                            <Textarea
                                value={positivePart}
                                onChange={(e) => setPositivePart(e.target.value)}
                                placeholder="Start with specific acknowledgment and strengths..."
                                className="min-h-[80px]"
                            />
                        </div>

                        {/* Constructive (Filling) */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-yellow-600">
                                <AlertCircle className="size-4" />
                                Constructive Concern (Filling)
                            </Label>
                            <Textarea
                                value={constructivePart}
                                onChange={(e) => setConstructivePart(e.target.value)}
                                placeholder="Address the specific concern or area needing attention..."
                                className="min-h-[80px]"
                            />
                        </div>

                        {/* Motivational (Bottom Bun) */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-blue-600">
                                <Lightbulb className="size-4" />
                                Motivational Close (Bottom Bun)
                            </Label>
                            <Textarea
                                value={motivationalPart}
                                onChange={(e) => setMotivationalPart(e.target.value)}
                                placeholder="End with encouragement and clear next steps..."
                                className="min-h-[80px]"
                            />
                        </div>

                        {/* Estimated Time */}
                        <div className="space-y-2">
                            <Label>Estimated Time to Complete</Label>
                            <Input
                                value={estimatedTime}
                                onChange={(e) => setEstimatedTime(e.target.value)}
                                placeholder="e.g., 15 minutes"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendIntervention}
                            disabled={isSending || !positivePart || !constructivePart || !motivationalPart}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="size-4 mr-2" />
                                    Send Intervention
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request Viva Dialog */}
            <Dialog open={showVivaDialog} onOpenChange={setShowVivaDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Request Viva Examination
                        </DialogTitle>
                        <DialogDescription>
                            Request an oral defense for {selectedStudent?.studentName} to clarify their work
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert>
                            <AlertTriangle className="size-4" />
                            <AlertDescription>
                                A viva request is typically made when process anomalies or integrity concerns
                                require clarification directly from the student.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label>Reason for Viva Request (Required)</Label>
                            <Textarea
                                value={vivaReason}
                                onChange={(e) => setVivaReason(e.target.value)}
                                placeholder="Explain why a viva examination is necessary..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVivaDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRequestViva}
                            disabled={isSending || !vivaReason.trim()}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Requesting...
                                </>
                            ) : (
                                'Request Viva'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Student Risk Card Component
function StudentRiskCard({
    student,
    onSelect,
    onEscalate,
    onRequestViva,
}: {
    student: StudentRiskData
    onSelect: () => void
    onEscalate: (interventionId: string) => void
    onRequestViva: () => void
}) {
    const config = RISK_CONFIG[student.riskLevel]
    const RiskIcon = config.icon

    return (
        <div className={`p-4 rounded-lg border ${config.bgColor} hover:border-primary transition-colors`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <RiskIcon className={`size-5 ${config.color}`} />
                    </div>
                    <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={config.color}>
                        Risk: {student.riskScore}%
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onSelect}>
                                <Send className="size-4 mr-2" />
                                Send Intervention
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRequestViva}>
                                <BookOpen className="size-4 mr-2" />
                                Request Viva
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const latest = student.activeInterventions[0]
                                    if (latest) onEscalate(latest.id)
                                }}
                                disabled={student.activeInterventions.length === 0}
                            >
                                <Flag className="size-4 mr-2" />
                                Escalate to Advisor
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <div className="flex items-center gap-2">
                        <Progress value={student.engagementScore} className="h-2" />
                        <span>{student.engagementScore}%</span>
                    </div>
                </div>
                <div>
                    <p className="text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2">
                        <Progress value={student.courseProgress} className="h-2" />
                        <span>{student.courseProgress}%</span>
                    </div>
                </div>
                <div>
                    <p className="text-muted-foreground">Last Active</p>
                    <span>{student.lastActivity || 'Unknown'}</span>
                </div>
            </div>

            {student.riskFactors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {student.riskFactors.slice(0, 3).map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {factor.type.replace(/_/g, ' ')}
                        </Badge>
                    ))}
                    {student.riskFactors.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                            +{student.riskFactors.length - 3} more
                        </Badge>
                    )}
                </div>
            )}
        </div>
    )
}

// Intervention Card Component
function InterventionCard({
    intervention,
    studentName,
    onEscalate,
}: {
    intervention: InterventionNudge
    studentName: string
    onEscalate: (interventionId: string) => void
}) {
    const nudgeConfig = NUDGE_TYPE_CONFIG[intervention.nudgeType]
    const statusConfig = STATUS_CONFIG[intervention.status]
    const NudgeIcon = nudgeConfig.icon

    return (
        <div className="p-4 rounded-lg border">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                        <NudgeIcon className={`size-5 ${nudgeConfig.color}`} />
                    </div>
                    <div>
                        <p className="font-medium">{studentName}</p>
                        <div className="flex items-center gap-2 text-sm">
                            <Badge className={statusConfig.bgColor + ' ' + statusConfig.color} variant="outline">
                                {statusConfig.label}
                            </Badge>
                            <span className="text-muted-foreground">
                                {new Date(intervention.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {intervention.status !== 'ESCALATED' && intervention.status !== 'ACTION_TAKEN' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEscalate(intervention.id)}
                    >
                        <Flag className="size-4 mr-1" />
                        Escalate
                    </Button>
                )}
            </div>

            <div className="mt-3 text-sm space-y-1">
                <p className="text-green-600">&quot;{intervention.positivePart.substring(0, 100)}...&quot;</p>
            </div>

            {intervention.actionableSteps && intervention.actionableSteps.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Action Items:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {intervention.actionableSteps.map((step, index) => (
                            <Badge
                                key={index}
                                variant={step.completed ? "default" : "outline"}
                                className="text-xs"
                            >
                                {step.completed && <Check className="size-3 mr-1" />}
                                {step.step}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default InterventionHub
