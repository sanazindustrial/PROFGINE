"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    FileText,
    Loader2,
    Lock,
    MessageSquare,
    Scale,
    Shield,
    Users,
    Wand2,
    XCircle,
} from 'lucide-react'

// Import child components
import { ReadyGateSelfEvaluation, type ReadyGateStatus } from './ready-gate-self-evaluation'
import { SandwichFeedbackCoach } from './sandwich-feedback-coach'
import { GovernanceDashboard } from './governance-dashboard'
import { InterventionHub } from './intervention-hub'

// Types
type WorkflowPhase = 'READY_GATE' | 'GRADING' | 'FINALIZATION'
type WorkflowStepStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'

interface WorkflowStep {
    id: string
    phase: WorkflowPhase
    name: string
    description: string
    status: WorkflowStepStatus
    order: number
    requiredForCompletion: boolean
    estimatedMinutes?: number
    completedAt?: string
}

interface StudentSubmission {
    id: string
    studentId: string
    studentName: string
    submittedAt: string
    fileName: string
    status: 'PENDING' | 'IN_REVIEW' | 'GRADED' | 'RETURNED'
    grade?: number
    readyGateStatus?: ReadyGateStatus
}

interface AssignmentContext {
    id: string
    title: string
    courseId: string
    courseName: string
    dueDate: string
    maxPoints: number
    gradingRubricId?: string
    submissionCount: number
    gradedCount: number
}

interface GradingWorkflowPageProps {
    assignment: AssignmentContext
    submissions: StudentSubmission[]
    currentUserId: string
    currentUserRole: 'PROFESSOR' | 'TA' | 'GRADER'
    enableAI?: boolean
    enableGovernance?: boolean
    onCompleteStep?: (stepId: string) => Promise<void>
    onSaveGrade?: (submissionId: string, grade: number, feedback: string) => Promise<void>
    onReturnSubmission?: (submissionId: string) => Promise<void>
    onRequestBiasCheck?: () => Promise<void>
    onExportBundle?: () => Promise<void>
}

const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: 'ready-gate',
        phase: 'READY_GATE',
        name: 'Ready Gate Self-Evaluation',
        description: 'Student pre-submission compliance check',
        status: 'AVAILABLE',
        order: 1,
        requiredForCompletion: true,
        estimatedMinutes: 5,
    },
    {
        id: 'ai-statement',
        phase: 'READY_GATE',
        name: 'AI-Use Statement',
        description: 'Tool transparency declaration',
        status: 'LOCKED',
        order: 2,
        requiredForCompletion: true,
        estimatedMinutes: 3,
    },
    {
        id: 'sandwich-feedback',
        phase: 'GRADING',
        name: 'Sandwich Feedback Coach',
        description: 'Structured feedback composition',
        status: 'LOCKED',
        order: 3,
        requiredForCompletion: true,
        estimatedMinutes: 15,
    },
    {
        id: 'consensus-review',
        phase: 'GRADING',
        name: 'Consensus Review',
        description: 'Multi-evaluator agreement analysis',
        status: 'LOCKED',
        order: 4,
        requiredForCompletion: false,
        estimatedMinutes: 10,
    },
    {
        id: 'bias-mitigation',
        phase: 'FINALIZATION',
        name: 'Bias Mitigation',
        description: 'Fairness checks and alerts',
        status: 'LOCKED',
        order: 5,
        requiredForCompletion: true,
        estimatedMinutes: 5,
    },
    {
        id: 'final-bundle',
        phase: 'FINALIZATION',
        name: 'Final Bundle PDF',
        description: 'Feedback package generation',
        status: 'LOCKED',
        order: 6,
        requiredForCompletion: true,
        estimatedMinutes: 2,
    },
    {
        id: 'portfolio-archive',
        phase: 'FINALIZATION',
        name: 'Portfolio Archival',
        description: 'Student 360-profile attachment',
        status: 'LOCKED',
        order: 7,
        requiredForCompletion: true,
        estimatedMinutes: 1,
    },
]

const PHASE_CONFIG: Record<WorkflowPhase, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    READY_GATE: {
        label: 'Phase I: Ready Gate',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: <Shield className="size-4" />,
    },
    GRADING: {
        label: 'Phase II: Grading',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: <Wand2 className="size-4" />,
    },
    FINALIZATION: {
        label: 'Phase III: Finalization',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: <FileText className="size-4" />,
    },
}

const STATUS_CONFIG: Record<WorkflowStepStatus, { label: string; color: string; icon: React.ReactNode }> = {
    LOCKED: { label: 'Locked', color: 'text-gray-400', icon: <Lock className="size-4" /> },
    AVAILABLE: { label: 'Available', color: 'text-blue-600', icon: <ChevronRight className="size-4" /> },
    IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-600', icon: <Loader2 className="size-4 animate-spin" /> },
    COMPLETED: { label: 'Completed', color: 'text-green-600', icon: <CheckCircle2 className="size-4" /> },
    SKIPPED: { label: 'Skipped', color: 'text-gray-500', icon: <XCircle className="size-4" /> },
}

export function GradingWorkflowPage({
    assignment,
    submissions,
    currentUserId,
    currentUserRole,
    enableAI = true,
    enableGovernance = true,
    onCompleteStep,
    onSaveGrade,
    onReturnSubmission,
    onRequestBiasCheck,
    onExportBundle,
}: GradingWorkflowPageProps) {
    const [steps, setSteps] = useState<WorkflowStep[]>(WORKFLOW_STEPS)
    const [activeStepId, setActiveStepId] = useState<string>('ready-gate')
    const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(submissions[0] || null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showCompletionDialog, setShowCompletionDialog] = useState(false)
    const [expandedPhases, setExpandedPhases] = useState<WorkflowPhase[]>(['READY_GATE', 'GRADING', 'FINALIZATION'])

    const activeStep = steps.find(s => s.id === activeStepId)
    const currentPhase = activeStep?.phase || 'READY_GATE'

    const overallProgress = Math.round(
        (steps.filter(s => s.status === 'COMPLETED' || s.status === 'SKIPPED').length / steps.length) * 100
    )

    const completedRequired = steps
        .filter(s => s.requiredForCompletion)
        .every(s => s.status === 'COMPLETED')

    const togglePhase = (phase: WorkflowPhase) => {
        setExpandedPhases(prev =>
            prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
        )
    }

    const handleStepComplete = useCallback(async (stepId: string) => {
        setIsProcessing(true)
        try {
            if (onCompleteStep) {
                await onCompleteStep(stepId)
            }

            setSteps(prevSteps => {
                const newSteps = [...prevSteps]
                const stepIndex = newSteps.findIndex(s => s.id === stepId)
                if (stepIndex !== -1) {
                    newSteps[stepIndex] = {
                        ...newSteps[stepIndex],
                        status: 'COMPLETED',
                        completedAt: new Date().toISOString(),
                    }
                    // Unlock next step
                    if (stepIndex + 1 < newSteps.length) {
                        newSteps[stepIndex + 1] = {
                            ...newSteps[stepIndex + 1],
                            status: 'AVAILABLE',
                        }
                    }
                }
                return newSteps
            })

            // Auto-advance to next step
            const currentIndex = steps.findIndex(s => s.id === stepId)
            if (currentIndex < steps.length - 1) {
                setActiveStepId(steps[currentIndex + 1].id)
            } else {
                setShowCompletionDialog(true)
            }
        } catch (error) {
            console.error('Error completing step:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [steps, onCompleteStep])

    const renderStepContent = () => {
        if (!activeStep) return null

        switch (activeStep.id) {
            case 'ready-gate':
                return (
                    <ReadyGateSelfEvaluation
                        assignmentId={assignment.id}
                        studentId={selectedSubmission?.studentId || ''}
                        studentName={selectedSubmission?.studentName || ''}
                        dueDate={assignment.dueDate}
                        onFormSubmit={async () => {
                            await handleStepComplete('ready-gate')
                        }}
                        showHistory={currentUserRole === 'PROFESSOR'}
                    />
                )

            case 'ai-statement':
                return (
                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle>AI-Use Statement</CardTitle>
                            <CardDescription>
                                Review and verify the student's AI tool usage declaration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    Student must declare all AI tools used in this assignment.
                                </AlertDescription>
                            </Alert>
                            <Button onClick={() => handleStepComplete('ai-statement')}>
                                Confirm AI Statement Reviewed
                            </Button>
                        </CardContent>
                    </Card>
                )

            case 'sandwich-feedback':
                return (
                    <SandwichFeedbackCoach
                        submissionId={selectedSubmission?.id || ''}
                        studentName={selectedSubmission?.studentName || ''}
                        assignmentTitle={assignment.title}
                        enableAI={enableAI}
                        maxPoints={assignment.maxPoints}
                        onSave={async (feedback) => {
                            await handleStepComplete('sandwich-feedback')
                        }}
                        onFeedbackGenerated={(feedback) => {
                            console.log('Feedback generated:', feedback)
                        }}
                    />
                )

            case 'consensus-review':
                return (
                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-5" />
                                Consensus Review
                            </CardTitle>
                            <CardDescription>
                                Compare grades with other evaluators and resolve discrepancies.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-3xl font-bold">85%</p>
                                    <p className="text-sm text-muted-foreground">Your Grade</p>
                                </div>
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-3xl font-bold">82%</p>
                                    <p className="text-sm text-muted-foreground">TA Grade</p>
                                </div>
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-3xl font-bold text-green-600">0.92</p>
                                    <p className="text-sm text-muted-foreground">IRR Score</p>
                                </div>
                            </div>
                            <Button onClick={() => handleStepComplete('consensus-review')}>
                                Confirm Consensus Reached
                            </Button>
                        </CardContent>
                    </Card>
                )

            case 'bias-mitigation':
                return enableGovernance ? (
                    <GovernanceDashboard
                        courseId={assignment.courseId}
                        assignmentId={assignment.id}
                        instructorId={currentUserId}
                        onAcknowledgeAlert={async () => {
                            await handleStepComplete('bias-mitigation')
                        }}
                    />
                ) : (
                    <Card className="p-6">
                        <CardContent>
                            <p className="text-muted-foreground">Governance features disabled.</p>
                            <Button className="mt-4" onClick={() => handleStepComplete('bias-mitigation')}>
                                Skip Bias Check
                            </Button>
                        </CardContent>
                    </Card>
                )

            case 'final-bundle':
                return (
                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-5" />
                                Final Bundle PDF
                            </CardTitle>
                            <CardDescription>
                                Generate comprehensive feedback package for the student.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">Bundle Contents</h4>
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Graded Submission</li>
                                        <li>• Sandwich Feedback</li>
                                        <li>• Rubric Scores</li>
                                        <li>• Improvement Suggestions</li>
                                    </ul>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">Settings</h4>
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Include grade: Yes</li>
                                        <li>• Include rubric: Yes</li>
                                        <li>• Include AI analysis: {enableAI ? 'Yes' : 'No'}</li>
                                    </ul>
                                </div>
                            </div>
                            <Button onClick={() => {
                                onExportBundle?.()
                                handleStepComplete('final-bundle')
                            }}>
                                Generate &amp; Download PDF
                            </Button>
                        </CardContent>
                    </Card>
                )

            case 'portfolio-archive':
                return (
                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle>Portfolio Archival</CardTitle>
                            <CardDescription>
                                Attach feedback and grades to student's 360-degree profile.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <CheckCircle2 className="size-4" />
                                <AlertTitle>Ready to Archive</AlertTitle>
                                <AlertDescription>
                                    This feedback will be added to {selectedSubmission?.studentName}'s academic portfolio.
                                </AlertDescription>
                            </Alert>
                            <Button onClick={() => handleStepComplete('portfolio-archive')}>
                                Archive to Student Portfolio
                            </Button>
                        </CardContent>
                    </Card>
                )

            default:
                return <p>Unknown step</p>
        }
    }

    return (
        <div className="flex h-full">
            {/* Sidebar - Workflow Steps */}
            <aside className="w-80 border-r bg-muted/30 p-4 overflow-auto">
                <div className="mb-4">
                    <h2 className="font-semibold">{assignment.title}</h2>
                    <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span className="font-medium">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                    {(['READY_GATE', 'GRADING', 'FINALIZATION'] as WorkflowPhase[]).map((phase) => {
                        const config = PHASE_CONFIG[phase]
                        const phaseSteps = steps.filter(s => s.phase === phase)
                        const isExpanded = expandedPhases.includes(phase)
                        const phaseComplete = phaseSteps.every(s => s.status === 'COMPLETED' || s.status === 'SKIPPED')

                        return (
                            <div key={phase} className="border rounded-lg overflow-hidden">
                                <button
                                    className={`w-full p-3 flex items-center justify-between text-left ${config.bgColor}`}
                                    onClick={() => togglePhase(phase)}
                                >
                                    <div className="flex items-center gap-2">
                                        {config.icon}
                                        <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {phaseComplete && <CheckCircle2 className="size-4 text-green-600" />}
                                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="p-2 space-y-1">
                                        {phaseSteps.map(step => {
                                            const statusConfig = STATUS_CONFIG[step.status]
                                            const isActive = step.id === activeStepId

                                            return (
                                                <button
                                                    key={step.id}
                                                    className={`w-full p-2 rounded text-left text-sm flex items-center gap-2 transition-colors ${isActive ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                                                        } ${step.status === 'LOCKED' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    onClick={() => step.status !== 'LOCKED' && setActiveStepId(step.id)}
                                                    disabled={step.status === 'LOCKED'}
                                                >
                                                    <span className={statusConfig.color}>{statusConfig.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{step.name}</p>
                                                        {step.estimatedMinutes && (
                                                            <p className="text-xs text-muted-foreground">~{step.estimatedMinutes} min</p>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <Separator className="my-4" />

                {/* Submission Selector */}
                <div>
                    <h3 className="text-sm font-semibold mb-2">Submissions</h3>
                    <ScrollArea className="h-48">
                        <div className="space-y-1">
                            {submissions.map(sub => (
                                <button
                                    key={sub.id}
                                    className={`w-full p-2 rounded text-left text-sm ${selectedSubmission?.id === sub.id ? 'bg-primary/10' : 'hover:bg-muted'
                                        }`}
                                    onClick={() => setSelectedSubmission(sub)}
                                >
                                    <p className="font-medium truncate">{sub.studentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {sub.status === 'GRADED' ? `Grade: ${sub.grade}%` : sub.status}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Step Header */}
                    {activeStep && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Badge variant="outline" className={PHASE_CONFIG[currentPhase].color}>
                                    {PHASE_CONFIG[currentPhase].label}
                                </Badge>
                                <span>•</span>
                                <span>Step {activeStep.order} of {steps.length}</span>
                            </div>
                            <h1 className="text-2xl font-bold">{activeStep.name}</h1>
                            <p className="text-muted-foreground">{activeStep.description}</p>
                        </div>
                    )}

                    {/* Step Content */}
                    {renderStepContent()}

                    {/* Navigation */}
                    <div className="mt-6 flex items-center justify-between">
                        <Button
                            variant="outline"
                            disabled={steps.findIndex(s => s.id === activeStepId) === 0}
                            onClick={() => {
                                const currentIndex = steps.findIndex(s => s.id === activeStepId)
                                if (currentIndex > 0) {
                                    setActiveStepId(steps[currentIndex - 1].id)
                                }
                            }}
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            Previous
                        </Button>

                        <Button
                            disabled={
                                steps.findIndex(s => s.id === activeStepId) === steps.length - 1 ||
                                activeStep?.status !== 'COMPLETED'
                            }
                            onClick={() => {
                                const currentIndex = steps.findIndex(s => s.id === activeStepId)
                                if (currentIndex < steps.length - 1) {
                                    setActiveStepId(steps[currentIndex + 1].id)
                                }
                            }}
                        >
                            Next
                            <ArrowRight className="size-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </main>

            {/* Completion Dialog */}
            <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="size-6 text-green-600" />
                            Workflow Complete!
                        </DialogTitle>
                        <DialogDescription>
                            You have completed all required steps for grading {selectedSubmission?.studentName}'s submission.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
                            Review Steps
                        </Button>
                        <Button onClick={() => {
                            onReturnSubmission?.(selectedSubmission?.id || '')
                            setShowCompletionDialog(false)
                        }}>
                            Return to Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default GradingWorkflowPage
