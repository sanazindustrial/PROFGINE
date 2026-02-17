"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
    AlertTriangle,
    Archive,
    Award,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileCheck2,
    FileDown,
    FileText,
    GraduationCap,
    Hash,
    Loader2,
    Lock,
    MessageSquare,
    PenLine,
    Printer,
    Scale,
    Send,
    Settings2,
    Share2,
    Shield,
    Star,
    TrendingUp,
    User,
    Wand2,
    XCircle,
} from 'lucide-react'

// Types
interface RubricScore {
    criterionId: string
    criterionName: string
    maxPoints: number
    earnedPoints: number
    level: string
    feedback?: string
}

interface SandwichFeedback {
    commendation: string
    constructive: string
    encouragement: string
}

interface AIInsight {
    category: string
    insight: string
    confidence: number
    actionable: boolean
}

interface BiasCheckResult {
    dimension: string
    status: 'PASS' | 'WARNING' | 'FLAG'
    details: string
}

interface StudentPortfolioEntry {
    assignmentId: string
    assignmentTitle: string
    courseTitle: string
    term: string
    grade: number
    skills: string[]
}

interface BundleSection {
    id: string
    name: string
    description: string
    included: boolean
    required: boolean
    order: number
}

interface FinalBundlePDFProps {
    submissionId: string
    studentId: string
    studentName: string
    studentEmail: string
    assignmentId: string
    assignmentTitle: string
    courseName: string
    courseCode: string
    term: string
    submittedAt: string
    gradedAt?: string
    gradedBy: string
    finalGrade: number
    maxPoints: number
    rubricScores: RubricScore[]
    sandwichFeedback: SandwichFeedback
    aiInsights?: AIInsight[]
    biasChecks?: BiasCheckResult[]
    portfolioHistory?: StudentPortfolioEntry[]
    enableDigitalSignature?: boolean
    enablePortfolioArchive?: boolean
    onGeneratePDF?: (options: BundleOptions) => Promise<Blob>
    onArchiveToPortfolio?: (submissionId: string) => Promise<void>
    onSendToStudent?: (submissionId: string) => Promise<void>
    onRequestReview?: () => Promise<void>
}

interface BundleOptions {
    includeGrade: boolean
    includeRubric: boolean
    includeFeedback: boolean
    includeAIInsights: boolean
    includeBiasReport: boolean
    includePortfolioContext: boolean
    includeDigitalSignature: boolean
    instructorNotes?: string
}

const DEFAULT_SECTIONS: BundleSection[] = [
    { id: 'header', name: 'Header & Summary', description: 'Assignment info and final grade', included: true, required: true, order: 1 },
    { id: 'rubric', name: 'Rubric Breakdown', description: 'Detailed criterion scores', included: true, required: false, order: 2 },
    { id: 'feedback', name: 'Sandwich Feedback', description: 'Structured feedback comments', included: true, required: true, order: 3 },
    { id: 'ai-insights', name: 'AI Insights', description: 'AI-generated recommendations', included: false, required: false, order: 4 },
    { id: 'bias-report', name: 'Fairness Report', description: 'Bias mitigation results', included: false, required: false, order: 5 },
    { id: 'portfolio', name: 'Portfolio Context', description: 'Historical performance', included: false, required: false, order: 6 },
    { id: 'signature', name: 'Digital Signature', description: 'Instructor verification', included: true, required: false, order: 7 },
]

export function FinalBundlePDF({
    submissionId,
    studentId,
    studentName,
    studentEmail,
    assignmentId,
    assignmentTitle,
    courseName,
    courseCode,
    term,
    submittedAt,
    gradedAt,
    gradedBy,
    finalGrade,
    maxPoints,
    rubricScores,
    sandwichFeedback,
    aiInsights = [],
    biasChecks = [],
    portfolioHistory = [],
    enableDigitalSignature = true,
    enablePortfolioArchive = true,
    onGeneratePDF,
    onArchiveToPortfolio,
    onSendToStudent,
    onRequestReview,
}: FinalBundlePDFProps) {
    const [sections, setSections] = useState<BundleSection[]>(DEFAULT_SECTIONS)
    const [instructorNotes, setInstructorNotes] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [generatedPDF, setGeneratedPDF] = useState<Blob | null>(null)

    const gradePercentage = Math.round((finalGrade / maxPoints) * 100)
    const gradeColor = gradePercentage >= 90 ? 'text-green-600' : gradePercentage >= 70 ? 'text-blue-600' : gradePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'

    const toggleSection = (sectionId: string) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId && !s.required ? { ...s, included: !s.included } : s
        ))
    }

    const getBundleOptions = useCallback((): BundleOptions => {
        return {
            includeGrade: sections.find(s => s.id === 'header')?.included ?? true,
            includeRubric: sections.find(s => s.id === 'rubric')?.included ?? true,
            includeFeedback: sections.find(s => s.id === 'feedback')?.included ?? true,
            includeAIInsights: sections.find(s => s.id === 'ai-insights')?.included ?? false,
            includeBiasReport: sections.find(s => s.id === 'bias-report')?.included ?? false,
            includePortfolioContext: sections.find(s => s.id === 'portfolio')?.included ?? false,
            includeDigitalSignature: sections.find(s => s.id === 'signature')?.included ?? true,
            instructorNotes: instructorNotes || undefined,
        }
    }, [sections, instructorNotes])

    const handleGeneratePDF = async () => {
        setIsGenerating(true)
        try {
            if (onGeneratePDF) {
                const pdf = await onGeneratePDF(getBundleOptions())
                setGeneratedPDF(pdf)
                // Download the PDF
                const url = URL.createObjectURL(pdf)
                const a = document.createElement('a')
                a.href = url
                a.download = `${courseCode}_${assignmentTitle}_${studentName.replace(/\s+/g, '_')}.pdf`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleArchive = async () => {
        setIsArchiving(true)
        try {
            if (onArchiveToPortfolio) {
                await onArchiveToPortfolio(submissionId)
            }
        } catch (error) {
            console.error('Error archiving:', error)
        } finally {
            setIsArchiving(false)
        }
    }

    const handleSendToStudent = async () => {
        setIsSending(true)
        try {
            if (onSendToStudent) {
                await onSendToStudent(submissionId)
            }
        } catch (error) {
            console.error('Error sending:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <TooltipProvider>
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-5" />
                                Final Bundle PDF
                            </CardTitle>
                            <CardDescription>
                                Generate comprehensive feedback package for {studentName}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                                <Settings2 className="size-4 mr-1" />
                                Settings
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                                <Eye className="size-4 mr-1" />
                                Preview
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Summary Card */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-2">
                                <User className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{studentName}</p>
                                    <p className="text-xs text-muted-foreground">{studentEmail}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{courseCode}</p>
                                    <p className="text-xs text-muted-foreground">{term}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-2">
                                <Award className={`size-5 ${gradeColor}`} />
                                <div>
                                    <p className={`text-2xl font-bold ${gradeColor}`}>{gradePercentage}%</p>
                                    <p className="text-xs text-muted-foreground">{finalGrade}/{maxPoints} pts</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="size-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        {gradedAt ? new Date(gradedAt).toLocaleDateString() : 'Pending'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Graded by {gradedBy}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Separator />

                    {/* Section Selection */}
                    <div>
                        <h3 className="font-semibold mb-4">Bundle Contents</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {sections.sort((a, b) => a.order - b.order).map(section => (
                                <div
                                    key={section.id}
                                    className={`flex items-start gap-3 p-3 border rounded-lg ${section.included ? 'bg-primary/5 border-primary/30' : ''
                                        }`}
                                >
                                    <Checkbox
                                        id={section.id}
                                        checked={section.included}
                                        onCheckedChange={() => toggleSection(section.id)}
                                        disabled={section.required}
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor={section.id} className="font-medium cursor-pointer">
                                            {section.name}
                                            {section.required && (
                                                <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                                            )}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">{section.description}</p>
                                    </div>
                                    {section.included && <CheckCircle2 className="size-4 text-green-600" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Rubric Preview */}
                    <div>
                        <h3 className="font-semibold mb-4">Rubric Summary</h3>
                        <ScrollArea className="h-48">
                            <div className="space-y-2">
                                {rubricScores.map(score => (
                                    <div key={score.criterionId} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{score.criterionName}</p>
                                            <p className="text-xs text-muted-foreground">{score.level}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{score.earnedPoints}/{score.maxPoints}</p>
                                            <Progress
                                                value={(score.earnedPoints / score.maxPoints) * 100}
                                                className="w-24 h-1"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <Separator />

                    {/* Feedback Preview */}
                    <div>
                        <h3 className="font-semibold mb-4">Sandwich Feedback</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                                <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                                    <Star className="size-4" /> Commendation
                                </p>
                                <p className="text-sm mt-1">{sandwichFeedback.commendation}</p>
                            </div>
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                                    <TrendingUp className="size-4" /> Constructive Feedback
                                </p>
                                <p className="text-sm mt-1">{sandwichFeedback.constructive}</p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                    <MessageSquare className="size-4" /> Encouragement
                                </p>
                                <p className="text-sm mt-1">{sandwichFeedback.encouragement}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bias Checks */}
                    {sections.find(s => s.id === 'bias-report')?.included && biasChecks.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Scale className="size-4" />
                                    Fairness Report
                                </h3>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {biasChecks.map((check, idx) => (
                                        <div key={idx} className={`p-3 border rounded-lg ${check.status === 'PASS' ? 'border-green-300 bg-green-50 dark:bg-green-900/10' :
                                                check.status === 'WARNING' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' :
                                                    'border-red-300 bg-red-50 dark:bg-red-900/10'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                {check.status === 'PASS' && <CheckCircle2 className="size-4 text-green-600" />}
                                                {check.status === 'WARNING' && <AlertTriangle className="size-4 text-yellow-600" />}
                                                {check.status === 'FLAG' && <XCircle className="size-4 text-red-600" />}
                                                <span className="font-medium text-sm">{check.dimension}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Instructor Notes */}
                    <div>
                        <Label htmlFor="instructor-notes" className="font-semibold">
                            Additional Notes (Optional)
                        </Label>
                        <Textarea
                            id="instructor-notes"
                            placeholder="Add any additional notes to include in the bundle..."
                            value={instructorNotes}
                            onChange={(e) => setInstructorNotes(e.target.value)}
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    {/* Digital Signature */}
                    {enableDigitalSignature && sections.find(s => s.id === 'signature')?.included && (
                        <Alert>
                            <PenLine className="size-4" />
                            <AlertTitle>Digital Signature</AlertTitle>
                            <AlertDescription>
                                This bundle will be digitally signed by {gradedBy} upon generation.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>

                <CardFooter className="flex flex-wrap gap-2 justify-between">
                    <div className="flex gap-2">
                        <Button
                            onClick={handleGeneratePDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="size-4 mr-2" />
                                    Generate PDF
                                </>
                            )}
                        </Button>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => window.print()}>
                                    <Printer className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print Bundle</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex gap-2">
                        {enablePortfolioArchive && (
                            <Button
                                variant="outline"
                                onClick={handleArchive}
                                disabled={isArchiving}
                            >
                                {isArchiving ? (
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                ) : (
                                    <Archive className="size-4 mr-2" />
                                )}
                                Archive to Portfolio
                            </Button>
                        )}

                        <Button
                            variant="default"
                            onClick={handleSendToStudent}
                            disabled={isSending}
                        >
                            {isSending ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="size-4 mr-2" />
                            )}
                            Send to Student
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Bundle Preview</DialogTitle>
                        <DialogDescription>
                            Preview how the final PDF will look.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 bg-white border rounded shadow-sm space-y-6">
                        {/* PDF Header Preview */}
                        <div className="text-center border-b pb-4">
                            <h1 className="text-xl font-bold">{courseName}</h1>
                            <h2 className="text-lg">{assignmentTitle}</h2>
                            <p className="text-sm text-muted-foreground">{term}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><strong>Student:</strong> {studentName}</p>
                                <p><strong>Email:</strong> {studentEmail}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Grade:</strong> {finalGrade}/{maxPoints} ({gradePercentage}%)</p>
                                <p><strong>Graded By:</strong> {gradedBy}</p>
                            </div>
                        </div>

                        <div className="text-xs text-center text-muted-foreground">
                            This is a preview. The actual PDF will contain all selected sections.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Close
                        </Button>
                        <Button onClick={handleGeneratePDF}>
                            <Download className="size-4 mr-2" />
                            Generate PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bundle Settings</DialogTitle>
                        <DialogDescription>
                            Configure default settings for PDF generation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-grade">Show Grade to Student</Label>
                            <Switch id="show-grade" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-rubric">Include Detailed Rubric</Label>
                            <Switch id="show-rubric" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-ai">Include AI Insights</Label>
                            <Switch id="show-ai" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-archive">Auto-Archive to Portfolio</Label>
                            <Switch id="auto-archive" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettings(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setShowSettings(false)}>
                            Save Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}

export default FinalBundlePDF
