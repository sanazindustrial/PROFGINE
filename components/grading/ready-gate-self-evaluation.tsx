"use client"

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileText,
    BookOpen,
    Shield,
    Star,
    ArrowRight,
    Loader2,
} from 'lucide-react'

// Export status type for external use
export type ReadyGateStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW'

// Validation schema for the form
const SelfReflectionSchema = z.object({
    criterion: z.string(),
    selfScore: z.number().min(0).max(100),
    note: z.string().min(10, "Please provide a meaningful reflection (at least 10 characters)"),
})

const ReadyGateSchema = z.object({
    submissionId: z.string().uuid(),
    reflections: z.array(SelfReflectionSchema).min(1),
    outcomesMastery: z.record(z.string(), z.number()),
    structureCheck: z.boolean(),
    citationsCheck: z.boolean(),
    evidenceCheck: z.boolean(),
    accessibilityCheck: z.boolean(),
})

export type ReadyGateFormData = z.infer<typeof ReadyGateSchema>

interface RubricCriterion {
    id: string
    name: string
    description: string
    maxScore: number
}

interface ReadyGateSelfEvaluationProps {
    assignmentId: string
    studentId: string
    studentName?: string
    dueDate?: string
    rubricCriteria?: RubricCriterion[]
    onComplete?: (data: ReadyGateFormData) => void
    onFormSubmit?: (data: ReadyGateFormData) => void | Promise<void>
    onSave?: (data: Partial<ReadyGateFormData>) => void
    showHistory?: boolean
}

const DEFAULT_CRITERIA: RubricCriterion[] = [
    { id: '1', name: 'Thesis & Argument', description: 'Clear thesis statement and logical argument flow', maxScore: 25 },
    { id: '2', name: 'Evidence & Support', description: 'Quality of sources and evidence integration', maxScore: 25 },
    { id: '3', name: 'Organization', description: 'Structure, transitions, and coherence', maxScore: 20 },
    { id: '4', name: 'Writing Mechanics', description: 'Grammar, spelling, and formatting', maxScore: 15 },
    { id: '5', name: 'Critical Analysis', description: 'Depth of analysis and original thinking', maxScore: 15 },
]

export function ReadyGateSelfEvaluation({
    assignmentId,
    studentId,
    studentName,
    dueDate,
    rubricCriteria = DEFAULT_CRITERIA,
    onComplete,
    onFormSubmit,
    onSave,
    showHistory = false,
}: ReadyGateSelfEvaluationProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [complianceChecks, setComplianceChecks] = useState({
        structureCheck: false,
        citationsCheck: false,
        evidenceCheck: false,
        accessibilityCheck: false,
    })

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReadyGateFormData>({
        resolver: zodResolver(ReadyGateSchema),
        defaultValues: {
            submissionId: assignmentId,
            reflections: rubricCriteria.map(c => ({
                criterion: c.id,
                selfScore: 50,
                note: '',
            })),
            outcomesMastery: {},
            structureCheck: false,
            citationsCheck: false,
            evidenceCheck: false,
            accessibilityCheck: false,
        },
    })

    const reflections = watch('reflections')

    const steps = [
        { title: 'Outcome Mastery', icon: <Star className="size-5" /> },
        { title: 'Compliance Check', icon: <Shield className="size-5" /> },
        { title: 'Review & Submit', icon: <CheckCircle2 className="size-5" /> },
    ]

    const overallProgress = reflections?.reduce((acc, r) => acc + (r.note?.length >= 10 ? 1 : 0), 0) ?? 0
    const progressPercent = Math.round((overallProgress / rubricCriteria.length) * 100)

    const complianceComplete = Object.values(complianceChecks).every(Boolean)

    const onSubmit = async (data: ReadyGateFormData) => {
        setIsSubmitting(true)
        try {
            // Merge compliance checks into data
            const finalData = {
                ...data,
                ...complianceChecks,
            }
            await onComplete?.(finalData)
        } catch (error) {
            console.error('Error submitting Ready-Gate:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleComplianceToggle = (key: keyof typeof complianceChecks) => {
        const newChecks = { ...complianceChecks, [key]: !complianceChecks[key] }
        setComplianceChecks(newChecks)
        setValue(key, newChecks[key])
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="size-6" />
                    Ready-Gate Self-Evaluation
                </CardTitle>
                <CardDescription>
                    Complete this self-reflection before final submission. Your honest assessment helps improve feedback quality.
                </CardDescription>

                {/* Progress indicator */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span>Reflection Progress</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                </div>
            </CardHeader>

            <CardContent>
                {/* Step indicators */}
                <div className="flex justify-between mb-8">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentStep === index
                                ? 'bg-primary text-primary-foreground'
                                : currentStep > index
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {currentStep > index ? <CheckCircle2 className="size-5" /> : step.icon}
                            <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Step 1: Outcome Mastery Reflection */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <Alert>
                                <BookOpen className="size-4" />
                                <AlertDescription>
                                    For each learning outcome, rate your mastery and explain how you demonstrated it in your work.
                                </AlertDescription>
                            </Alert>

                            {rubricCriteria.map((criterion, index) => (
                                <div key={criterion.id} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold">{criterion.name}</h4>
                                            <p className="text-sm text-muted-foreground">{criterion.description}</p>
                                        </div>
                                        <Badge variant="outline">{criterion.maxScore} pts</Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Self-Assessment Score: {reflections?.[index]?.selfScore || 50}%
                                        </label>
                                        <Slider
                                            value={[reflections?.[index]?.selfScore || 50]}
                                            onValueChange={([value]) => setValue(`reflections.${index}.selfScore`, value)}
                                            max={100}
                                            step={5}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">
                                            How did you demonstrate mastery of this outcome?
                                        </label>
                                        <Textarea
                                            {...register(`reflections.${index}.note`)}
                                            placeholder="Describe specific examples from your work..."
                                            className="mt-1"
                                        />
                                        {errors.reflections?.[index]?.note && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {errors.reflections[index]?.note?.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <Button type="button" onClick={() => setCurrentStep(1)} className="w-full">
                                Continue to Compliance Check
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Compliance Check */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <Alert>
                                <Shield className="size-4" />
                                <AlertDescription>
                                    Verify that your submission meets all required standards. Your work will remain locked until all checks pass.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                {[
                                    { key: 'structureCheck' as const, label: 'Document Structure', description: 'Introduction, body, conclusion, and proper headings' },
                                    { key: 'citationsCheck' as const, label: 'Citations & References', description: 'All sources properly cited in the required format' },
                                    { key: 'evidenceCheck' as const, label: 'Evidence & Support', description: 'Claims are backed by appropriate evidence' },
                                    { key: 'accessibilityCheck' as const, label: 'Accessibility', description: 'Alt text for images, proper heading hierarchy, readable fonts' },
                                ].map((check) => (
                                    <div
                                        key={check.key}
                                        onClick={() => handleComplianceToggle(check.key)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${complianceChecks[check.key]
                                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold">{check.label}</h4>
                                                <p className="text-sm text-muted-foreground">{check.description}</p>
                                            </div>
                                            {complianceChecks[check.key] ? (
                                                <CheckCircle2 className="size-6 text-green-600" />
                                            ) : (
                                                <XCircle className="size-6 text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!complianceComplete && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="size-4" />
                                    <AlertDescription>
                                        All compliance checks must pass before you can submit.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!complianceComplete}
                                    className="flex-1"
                                >
                                    Review Submission
                                    <ArrowRight className="size-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review & Submit */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
                                <CheckCircle2 className="size-4 text-green-600" />
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                    All checks passed! Review your self-evaluation below.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <h3 className="font-semibold">Self-Assessment Summary</h3>
                                {rubricCriteria.map((criterion, index) => (
                                    <div key={criterion.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span>{criterion.name}</span>
                                        <Badge variant={
                                            (reflections?.[index]?.selfScore || 0) >= 80 ? 'default' :
                                                (reflections?.[index]?.selfScore || 0) >= 60 ? 'secondary' : 'outline'
                                        }>
                                            {reflections?.[index]?.selfScore || 0}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border rounded-lg bg-muted/50">
                                <label className="flex items-start gap-3">
                                    <input type="checkbox" className="mt-1" required />
                                    <span className="text-sm">
                                        I certify that this self-evaluation accurately reflects my understanding of my work.
                                        I have not misrepresented my mastery of any learning outcomes.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                                    Back
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="size-4 mr-2" />
                                            Complete Ready-Gate
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}

export default ReadyGateSelfEvaluation
