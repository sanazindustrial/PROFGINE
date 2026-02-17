"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Star,
    MessageSquare,
    ThumbsUp,
    AlertTriangle,
    Lightbulb,
    Target,
    BookOpen,
    GraduationCap,
    Beaker,
    Briefcase,
    ChevronRight,
    ChevronDown,
    Plus,
    X,
    RefreshCw,
    Send,
    Eye,
    Edit3,
    Check,
    Info,
    Loader2,
    FileText,
    Layers,
    Wand2,
} from 'lucide-react'

// Aliases for renamed icons
const Sparkles = Star
const MessageSquarePlus = MessageSquare

// Types
interface ConstructiveFeedbackItem {
    criterion: string
    finding: string
    rationale: string
    lineReferences: number[]
    uncertaintyBadge: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface HeatmapSegment {
    startLine: number
    endLine: number
    text: string
    rubricCriterion: string
    evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK'
    aiConfidence: number
}

interface ProcessAnomaly {
    type: 'ONE_CLICK_PASTE' | 'NO_DRAFTS' | 'RAPID_COMPLETION' | 'STYLE_INCONSISTENCY' | 'OTHER'
    description: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    evidence?: string
}

interface FeedbackCycleData {
    id?: string
    submissionId: string
    feedbackStyle: 'ENCOURAGING_MENTOR' | 'CRITICAL_PEER' | 'SCHOLARLY_ADVISOR' | 'TECHNICAL_LEAD'
    academicLevel: 'UNDERGRADUATE' | 'GRADUATE' | 'DOCTORAL'
    fieldOfStudy?: string
    topBunPositive: string
    fillingConstructive: ConstructiveFeedbackItem[]
    bottomBunMotivational: string
    heatmapData?: HeatmapSegment[]
    uncertaintyScore?: number
    processAnomalies?: ProcessAnomaly[]
    isDraft?: boolean
    isApproved?: boolean
}

interface RubricCriterion {
    id: string
    label: string
    maxPoints: number
}

interface SandwichFeedbackCoachProps {
    submissionId: string
    submissionContent?: string
    rubricCriteria?: RubricCriterion[]
    studentName?: string
    assignmentTitle?: string
    existingFeedback?: FeedbackCycleData
    enableAI?: boolean
    maxPoints?: number
    onSave: (data: FeedbackCycleData) => void | Promise<void>
    onApprove?: (data: FeedbackCycleData) => void
    onFeedbackGenerated?: (feedback: FeedbackCycleData) => void
    onCancel?: () => void
    isReadOnly?: boolean
}

// Style configuration based on academic level
const STYLE_CONFIG = {
    ENCOURAGING_MENTOR: {
        label: 'Encouraging Mentor',
        description: 'Undergraduate - Focus on mastery of core concepts',
        icon: GraduationCap,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    CRITICAL_PEER: {
        label: 'Critical Peer',
        description: 'Graduate - Synthesis and professional application',
        icon: Briefcase,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    SCHOLARLY_ADVISOR: {
        label: 'Scholarly Advisor',
        description: 'Doctoral - Methodological rigor and publication potential',
        icon: BookOpen,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    TECHNICAL_LEAD: {
        label: 'Technical Lead',
        description: 'XR/Lab - Procedure adherence and safety telemetry',
        icon: Beaker,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    },
}

const ACADEMIC_LEVELS = [
    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
    { value: 'GRADUATE', label: 'Graduate' },
    { value: 'DOCTORAL', label: 'Doctoral' },
]

const FIELDS_OF_STUDY = [
    'Clinical', 'Engineering', 'Humanities', 'Business', 'Sciences',
    'Education', 'Arts', 'Social Sciences', 'Computer Science', 'Other'
]

// Validation schema
const FeedbackFormSchema = z.object({
    feedbackStyle: z.enum(['ENCOURAGING_MENTOR', 'CRITICAL_PEER', 'SCHOLARLY_ADVISOR', 'TECHNICAL_LEAD']),
    academicLevel: z.enum(['UNDERGRADUATE', 'GRADUATE', 'DOCTORAL']),
    fieldOfStudy: z.string().optional(),
    topBunPositive: z.string().min(20, 'Please provide a meaningful positive opening'),
    bottomBunMotivational: z.string().min(20, 'Please provide actionable next steps'),
})

type FeedbackFormData = z.infer<typeof FeedbackFormSchema>

export function SandwichFeedbackCoach({
    submissionId,
    submissionContent = '',
    rubricCriteria = [],
    studentName,
    assignmentTitle,
    existingFeedback,
    enableAI = false,
    maxPoints,
    onSave,
    onApprove,
    onFeedbackGenerated,
    onCancel,
    isReadOnly = false,
}: SandwichFeedbackCoachProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'compose' | 'preview' | 'heatmap'>('compose')
    const [constructiveItems, setConstructiveItems] = useState<ConstructiveFeedbackItem[]>(
        existingFeedback?.fillingConstructive || []
    )
    const [showAddItem, setShowAddItem] = useState(false)
    const [selectedStyle, setSelectedStyle] = useState<keyof typeof STYLE_CONFIG>(
        existingFeedback?.feedbackStyle || 'ENCOURAGING_MENTOR'
    )
    const [heatmapData, setHeatmapData] = useState<HeatmapSegment[]>(
        existingFeedback?.heatmapData || []
    )
    const [processAnomalies, setProcessAnomalies] = useState<ProcessAnomaly[]>(
        existingFeedback?.processAnomalies || []
    )
    const [uncertaintyScore, setUncertaintyScore] = useState(
        existingFeedback?.uncertaintyScore ?? 0.85
    )

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm<FeedbackFormData>({
        resolver: zodResolver(FeedbackFormSchema) as any,
        defaultValues: {
            feedbackStyle: existingFeedback?.feedbackStyle || 'ENCOURAGING_MENTOR',
            academicLevel: existingFeedback?.academicLevel || 'UNDERGRADUATE',
            fieldOfStudy: existingFeedback?.fieldOfStudy || '',
            topBunPositive: existingFeedback?.topBunPositive || '',
            bottomBunMotivational: existingFeedback?.bottomBunMotivational || '',
        },
    })

    const watchedValues = watch()
    const StyleIcon = STYLE_CONFIG[selectedStyle]?.icon || GraduationCap

    // Auto-suggest feedback style based on academic level
    useEffect(() => {
        const level = watchedValues.academicLevel
        if (level === 'UNDERGRADUATE') {
            setSelectedStyle('ENCOURAGING_MENTOR')
            setValue('feedbackStyle', 'ENCOURAGING_MENTOR')
        } else if (level === 'GRADUATE') {
            setSelectedStyle('CRITICAL_PEER')
            setValue('feedbackStyle', 'CRITICAL_PEER')
        } else if (level === 'DOCTORAL') {
            setSelectedStyle('SCHOLARLY_ADVISOR')
            setValue('feedbackStyle', 'SCHOLARLY_ADVISOR')
        }
    }, [watchedValues.academicLevel, setValue])

    // Generate AI feedback
    const generateAIFeedback = async () => {
        setIsGenerating(true)
        try {
            const response = await fetch('/api/grading-workflow/feedback-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    submissionContent,
                    rubricCriteria,
                    feedbackStyle: selectedStyle,
                    academicLevel: watchedValues.academicLevel,
                    fieldOfStudy: watchedValues.fieldOfStudy,
                }),
            })

            if (!response.ok) throw new Error('Failed to generate feedback')

            const result = await response.json()

            setValue('topBunPositive', result.topBunPositive)
            setValue('bottomBunMotivational', result.bottomBunMotivational)
            setConstructiveItems(result.fillingConstructive || [])
            setHeatmapData(result.heatmapData || [])
            setProcessAnomalies(result.processAnomalies || [])
            setUncertaintyScore(result.uncertaintyScore || 0.85)
        } catch (error) {
            console.error('Error generating feedback:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    // Add a new constructive feedback item
    const addConstructiveItem = (item: ConstructiveFeedbackItem) => {
        setConstructiveItems([...constructiveItems, item])
        setShowAddItem(false)
    }

    // Remove a constructive feedback item
    const removeConstructiveItem = (index: number) => {
        setConstructiveItems(constructiveItems.filter((_, i) => i !== index))
    }

    // Save feedback (draft)
    const saveFeedback = async (data: FeedbackFormData) => {
        setIsSaving(true)
        try {
            const feedbackData: FeedbackCycleData = {
                submissionId,
                ...data,
                feedbackStyle: selectedStyle,
                fillingConstructive: constructiveItems,
                heatmapData,
                processAnomalies,
                uncertaintyScore,
                isDraft: true,
                isApproved: false,
            }

            await onSave(feedbackData)
        } catch (error) {
            console.error('Error saving feedback:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Approve and finalize feedback
    const approveFeedback = async (data: FeedbackFormData) => {
        if (!onApprove) return

        setIsSaving(true)
        try {
            const feedbackData: FeedbackCycleData = {
                submissionId,
                ...data,
                feedbackStyle: selectedStyle,
                fillingConstructive: constructiveItems,
                heatmapData,
                processAnomalies,
                uncertaintyScore,
                isDraft: false,
                isApproved: true,
            }

            await onApprove(feedbackData)
        } catch (error) {
            console.error('Error approving feedback:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Get uncertainty badge color
    const getUncertaintyColor = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
        switch (level) {
            case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                                <Layers className="size-6 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Sandwich Feedback Coach
                                    <Badge variant="secondary" className="ml-2">
                                        <Sparkles className="size-3 mr-1" />
                                        AI-Assisted
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    {studentName && `Feedback for ${studentName}`}
                                    {assignmentTitle && ` - ${assignmentTitle}`}
                                </CardDescription>
                            </div>
                        </div>

                        {/* Uncertainty Score */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border">
                                        <span className="text-sm text-muted-foreground">AI Confidence:</span>
                                        <Badge className={uncertaintyScore >= 0.8 ? 'bg-green-500' : uncertaintyScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}>
                                            {Math.round(uncertaintyScore * 100)}%
                                        </Badge>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>How confident the AI is in its analysis</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
            </Card>

            {/* Style Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="size-5" />
                        Feedback Context
                    </CardTitle>
                    <CardDescription>
                        Set the academic context to personalize the feedback tone
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Academic Level */}
                        <div className="space-y-2">
                            <Label>Academic Level</Label>
                            <Select
                                value={watchedValues.academicLevel}
                                onValueChange={(v) => setValue('academicLevel', v as any)}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACADEMIC_LEVELS.map(level => (
                                        <SelectItem key={level.value} value={level.value}>
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Field of Study */}
                        <div className="space-y-2">
                            <Label>Field of Study</Label>
                            <Select
                                value={watchedValues.fieldOfStudy}
                                onValueChange={(v) => setValue('fieldOfStudy', v)}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELDS_OF_STUDY.map(field => (
                                        <SelectItem key={field} value={field}>
                                            {field}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Feedback Style */}
                        <div className="space-y-2">
                            <Label>Coaching Style</Label>
                            <Select
                                value={selectedStyle}
                                onValueChange={(v) => {
                                    setSelectedStyle(v as keyof typeof STYLE_CONFIG)
                                    setValue('feedbackStyle', v as any)
                                }}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STYLE_CONFIG).map(([key, config]) => (
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
                    </div>

                    {/* Style Description */}
                    <div className={`p-3 rounded-lg ${STYLE_CONFIG[selectedStyle].bgColor}`}>
                        <div className="flex items-center gap-2">
                            <StyleIcon className={`size-5 ${STYLE_CONFIG[selectedStyle].color}`} />
                            <span className="font-medium">{STYLE_CONFIG[selectedStyle].label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {STYLE_CONFIG[selectedStyle].description}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="compose" className="flex items-center gap-2">
                        <Edit3 className="size-4" />
                        Compose
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="size-4" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="heatmap" className="flex items-center gap-2">
                        <FileText className="size-4" />
                        Heatmap
                    </TabsTrigger>
                </TabsList>

                {/* Compose Tab */}
                <TabsContent value="compose" className="space-y-4 mt-4">
                    {/* Generate AI Feedback Button */}
                    {!isReadOnly && (
                        <Button
                            onClick={generateAIFeedback}
                            disabled={isGenerating}
                            className="w-full"
                            variant="outline"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Generating AI Feedback...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="size-4 mr-2" />
                                    Generate AI Feedback Draft
                                </>
                            )}
                        </Button>
                    )}

                    {/* Top Bun - Positive */}
                    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                                <ThumbsUp className="size-5" />
                                Top Bun: Positive Highlights
                            </CardTitle>
                            <CardDescription>
                                Open with specific strengths and demonstrated learning outcome mastery
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                {...register('topBunPositive')}
                                placeholder="I noticed excellent work in... Your understanding of [concept] is demonstrated through..."
                                className="min-h-[120px] bg-white dark:bg-gray-900"
                                disabled={isReadOnly}
                            />
                            {errors.topBunPositive && (
                                <p className="text-sm text-red-500 mt-1">{errors.topBunPositive.message}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Filling - Constructive */}
                    <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                        <AlertTriangle className="size-5" />
                                        Filling: Constructive Growth Areas
                                    </CardTitle>
                                    <CardDescription>
                                        Identify gaps with specific line references and rationales
                                    </CardDescription>
                                </div>
                                {!isReadOnly && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAddItem(true)}
                                    >
                                        <Plus className="size-4 mr-1" />
                                        Add Item
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {constructiveItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No growth areas added yet. Click "Add Item" or generate AI feedback.
                                </p>
                            ) : (
                                constructiveItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="p-3 rounded-lg bg-white dark:bg-gray-900 border space-y-2"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{item.criterion}</Badge>
                                                <Badge className={getUncertaintyColor(item.uncertaintyBadge)}>
                                                    {item.uncertaintyBadge} confidence
                                                </Badge>
                                            </div>
                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeConstructiveItem(index)}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium">{item.finding}</p>
                                        <p className="text-sm text-muted-foreground">{item.rationale}</p>
                                        {item.lineReferences.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Lines: {item.lineReferences.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}

                            {/* Add Item Form */}
                            {showAddItem && (
                                <ConstructiveItemForm
                                    rubricCriteria={rubricCriteria}
                                    onAdd={addConstructiveItem}
                                    onCancel={() => setShowAddItem(false)}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Bottom Bun - Motivational */}
                    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <Lightbulb className="size-5" />
                                Bottom Bun: Motivational Next Steps
                            </CardTitle>
                            <CardDescription>
                                Provide actionable tasks and encouragement for future growth
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                {...register('bottomBunMotivational')}
                                placeholder="For your next submission, I recommend... You're on the right track with... Consider exploring..."
                                className="min-h-[120px] bg-white dark:bg-gray-900"
                                disabled={isReadOnly}
                            />
                            {errors.bottomBunMotivational && (
                                <p className="text-sm text-red-500 mt-1">{errors.bottomBunMotivational.message}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Process Anomalies Warning */}
                    {processAnomalies.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="size-4" />
                            <AlertDescription>
                                <strong>Process Anomalies Detected:</strong>
                                <ul className="mt-2 space-y-1">
                                    {processAnomalies.map((anomaly, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Badge variant={anomaly.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                                                {anomaly.severity}
                                            </Badge>
                                            {anomaly.description}
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquarePlus className="size-5" />
                                Feedback Preview
                            </CardTitle>
                            <CardDescription>
                                This is how the student will see your feedback
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none space-y-6">
                                {/* Positive Section */}
                                <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                                    <h4 className="text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                                        <ThumbsUp className="size-4" />
                                        Strengths & Achievements
                                    </h4>
                                    <p className="text-sm whitespace-pre-wrap">
                                        {watchedValues.topBunPositive || 'No positive feedback added yet.'}
                                    </p>
                                </div>

                                {/* Constructive Section */}
                                <div className="p-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                                    <h4 className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                                        <Target className="size-4" />
                                        Areas for Growth
                                    </h4>
                                    {constructiveItems.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No growth areas identified.</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {constructiveItems.map((item, index) => (
                                                <li key={index} className="text-sm">
                                                    <strong>{item.criterion}:</strong> {item.finding}
                                                    <p className="text-muted-foreground mt-1">{item.rationale}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Motivational Section */}
                                <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                                    <h4 className="text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2">
                                        <Lightbulb className="size-4" />
                                        Next Steps & Encouragement
                                    </h4>
                                    <p className="text-sm whitespace-pre-wrap">
                                        {watchedValues.bottomBunMotivational || 'No next steps added yet.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Heatmap Tab */}
                <TabsContent value="heatmap" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-5" />
                                Evidence Heatmap
                            </CardTitle>
                            <CardDescription>
                                AI-highlighted evidence mapped to rubric criteria
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {heatmapData.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="size-12 mx-auto mb-3 opacity-50" />
                                    <p>No heatmap data available.</p>
                                    <p className="text-sm">Generate AI feedback to see evidence highlighting.</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-2">
                                        {heatmapData.map((segment, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded border-l-4 ${segment.evidenceStrength === 'STRONG'
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                                    : segment.evidenceStrength === 'MODERATE'
                                                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                                                        : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge variant="outline">{segment.rubricCriterion}</Badge>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Lines {segment.startLine}-{segment.endLine}
                                                        </span>
                                                        <Badge className={
                                                            segment.evidenceStrength === 'STRONG' ? 'bg-green-500' :
                                                                segment.evidenceStrength === 'MODERATE' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }>
                                                            {segment.evidenceStrength}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-sm">&quot;{segment.text}&quot;</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    AI Confidence: {Math.round(segment.aiConfidence * 100)}%
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            {!isReadOnly && (
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleSubmit(saveFeedback)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Edit3 className="size-4 mr-2" />
                                    Save Draft
                                </>
                            )}
                        </Button>
                        {onApprove && (
                            <Button
                                onClick={handleSubmit(approveFeedback)}
                                disabled={isSaving || constructiveItems.length === 0}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-4 mr-2" />
                                        Approve & Finalize
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// Constructive Item Form Component
function ConstructiveItemForm({
    rubricCriteria,
    onAdd,
    onCancel,
}: {
    rubricCriteria: RubricCriterion[]
    onAdd: (item: ConstructiveFeedbackItem) => void
    onCancel: () => void
}) {
    const [criterion, setCriterion] = useState('')
    const [finding, setFinding] = useState('')
    const [rationale, setRationale] = useState('')
    const [lineRefs, setLineRefs] = useState('')
    const [uncertainty, setUncertainty] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')

    const handleAdd = () => {
        if (criterion && finding && rationale) {
            onAdd({
                criterion,
                finding,
                rationale,
                lineReferences: lineRefs.split(',').map(l => parseInt(l.trim())).filter(n => !isNaN(n)),
                uncertaintyBadge: uncertainty,
            })
        }
    }

    return (
        <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border space-y-3">
            <div className="space-y-2">
                <Label>Rubric Criterion</Label>
                <Select value={criterion} onValueChange={setCriterion}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select criterion..." />
                    </SelectTrigger>
                    <SelectContent>
                        {rubricCriteria.map(c => (
                            <SelectItem key={c.id} value={c.label}>
                                {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Finding</Label>
                <Input
                    value={finding}
                    onChange={(e) => setFinding(e.target.value)}
                    placeholder="What needs improvement?"
                />
            </div>

            <div className="space-y-2">
                <Label>Rationale (cite specific evidence)</Label>
                <Textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explain why this needs attention, citing specific lines or sections..."
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Line References (comma-separated)</Label>
                    <Input
                        value={lineRefs}
                        onChange={(e) => setLineRefs(e.target.value)}
                        placeholder="e.g., 10, 15, 23"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Confidence Level</Label>
                    <Select value={uncertainty} onValueChange={(v) => setUncertainty(v as any)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LOW">Low Confidence</SelectItem>
                            <SelectItem value="MEDIUM">Medium Confidence</SelectItem>
                            <SelectItem value="HIGH">High Confidence</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={!criterion || !finding || !rationale}>
                    <Plus className="size-4 mr-1" />
                    Add
                </Button>
            </div>
        </div>
    )
}

export default SandwichFeedbackCoach
