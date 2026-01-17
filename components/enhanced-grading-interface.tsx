"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Zap, 
    Save, 
    Star, 
    MessageSquare, 
    TrendingUp, 
    AlertTriangle, 
    RefreshCw, 
    Edit3, 
    CheckCircle, 
    XCircle, 
    Lightbulb, 
    Bot, 
    Target, 
    Settings,
    Shield,
    Lock
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

interface EnhancedGradingProps {
    submissionId: string
    submissionContent: string
    assignmentTitle: string
    studentName: string
    maxPoints: number
}

interface AIFeedback {
    confidence: number
    strengths: string[]
    improvements: string[]
    suggestions: string[]
    suggestedScore?: number
    refinementPrompts?: string[]
    correctionSuggestions?: string[]
    automatedGrading?: {
        score: number
        reasoning: string
        confidence: number
        criteria: Record<string, number>
    }
}

interface DetailedComment {
    id: number
    text: string
    type: "STRENGTH" | "IMPROVEMENT" | "QUESTION" | "GENERAL"
    category: string
    lineNumber: number | null
    isEditable: boolean
    refinementPrompt?: string
    corrections?: string[]
}

interface AutoGradingConfig {
    enabled: boolean
    mode: "ASSIST" | "SUGGEST" | "AUTO"
    confidenceThreshold: number
    requireHumanReview: boolean
    securityLevel: "STANDARD" | "ENHANCED"
}

interface RefinementSession {
    id: string
    iterations: number
    prompts: string[]
    responses: string[]
    improvements: string[]
    finalVersion: string
}

export default function EnhancedGradingInterface({
    submissionId,
    submissionContent,
    assignmentTitle,
    studentName,
    maxPoints
}: EnhancedGradingProps) {
    // Core grading state
    const [gradeData, setGradeData] = useState({
        score: 0,
        feedback: "",
        rubricScores: [] as any[],
        detailedComments: [] as DetailedComment[]
    })
    
    // AI and automation state
    const [aiSuggestions, setAiSuggestions] = useState<AIFeedback | null>(null)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [autoGradingConfig, setAutoGradingConfig] = useState<AutoGradingConfig>({
        enabled: true,
        mode: "ASSIST",
        confidenceThreshold: 0.8,
        requireHumanReview: true,
        securityLevel: "ENHANCED"
    })
    
    // Refinement and editing state
    const [refinementSession, setRefinementSession] = useState<RefinementSession | null>(null)
    const [isRefining, setIsRefining] = useState(false)
    const [refinementPrompt, setRefinementPrompt] = useState("")
    const [editableResults, setEditableResults] = useState<string>("") 
    const [correctionMode, setCorrectionMode] = useState(false)
    
    // UI state
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("grading")
    const [securityStatus, setSecurityStatus] = useState<"SECURE" | "WARNING" | "CRITICAL">("SECURE")

    // Automated grading with security validation
    const performAutomatedGrading = async () => {
        setIsGeneratingAI(true)
        setError(null)
        
        try {
            // Security validation before processing
            const securityCheck = await fetch(`/api/security/validate-content`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    content: submissionContent,
                    submissionId,
                    securityLevel: autoGradingConfig.securityLevel
                })
            })
            
            if (!securityCheck.ok) {
                throw new Error("Security validation failed")
            }
            
            const response = await fetch(`/api/submissions/${submissionId}/automated-grading`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: submissionContent,
                    assignmentTitle,
                    maxPoints,
                    config: autoGradingConfig
                })
            })

            if (response.ok) {
                const data = await response.json()
                setAiSuggestions(data)
                
                // Auto-apply if confidence is high and auto mode is enabled
                if (autoGradingConfig.mode === "AUTO" && 
                    data.automatedGrading?.confidence >= autoGradingConfig.confidenceThreshold) {
                    setGradeData({
                        ...gradeData,
                        score: data.automatedGrading.score,
                        feedback: data.suggestions.join(' ')
                    })
                }
                
                setEditableResults(JSON.stringify(data, null, 2))
                setSuccessMessage("Automated grading completed successfully!")
                setTimeout(() => setSuccessMessage(null), 3000)
            } else {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                setError(errorData.error || "Failed to perform automated grading")
            }
        } catch (error) {
            console.error("Automated grading failed:", error)
            setError("Security or network error during automated grading")
            setSecurityStatus("WARNING")
        } finally {
            setIsGeneratingAI(false)
        }
    }

    // Refinement with more prompts
    const refineGradingResults = async () => {
        if (!refinementPrompt.trim()) {
            setError("Please provide a refinement prompt")
            return
        }
        
        setIsRefining(true)
        setError(null)
        
        try {
            const response = await fetch(`/api/submissions/${submissionId}/refine`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentGrading: gradeData,
                    refinementPrompt,
                    sessionId: refinementSession?.id || null
                })
            })
            
            if (response.ok) {
                const data = await response.json()
                
                // Update refinement session
                const newSession: RefinementSession = {
                    id: refinementSession?.id || Date.now().toString(),
                    iterations: (refinementSession?.iterations || 0) + 1,
                    prompts: [...(refinementSession?.prompts || []), refinementPrompt],
                    responses: [...(refinementSession?.responses || []), data.refinedGrading],
                    improvements: [...(refinementSession?.improvements || []), data.improvements],
                    finalVersion: data.refinedGrading
                }
                
                setRefinementSession(newSession)
                setEditableResults(data.refinedGrading)
                setRefinementPrompt("") // Clear prompt for next iteration
                setSuccessMessage("Grading refined successfully!")
            } else {
                setError("Failed to refine grading")
            }
        } catch (error) {
            setError("Network error during refinement")
        } finally {
            setIsRefining(false)
        }
    }
    
    // Apply corrections and improvements
    const applyCorrections = async (corrections: string[]) => {
        try {
            const response = await fetch(`/api/submissions/${submissionId}/corrections`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    corrections,
                    currentGrading: gradeData
                })
            })
            
            if (response.ok) {
                const data = await response.json()
                setGradeData(data.updatedGrading)
                setEditableResults(JSON.stringify(data.updatedGrading, null, 2))
                setSuccessMessage("Corrections applied successfully!")
            }
        } catch (error) {
            setError("Failed to apply corrections")
        }
    }
    
    // Security test function
    const runSecurityTest = async () => {
        try {
            const response = await fetch(`/api/security/test-grading`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId,
                    testType: "COMPREHENSIVE"
                })
            })
            
            const result = await response.json()
            setSecurityStatus(result.status)
            
            if (result.status === "CRITICAL") {
                setError(`Security issues detected: ${result.issues.join(", ")}`)
            } else {
                setSuccessMessage(`Security test passed: ${result.status}`)
            }
        } catch (error) {
            setSecurityStatus("WARNING")
            setError("Security test failed")
        }
    }

    const addDetailedComment = (type: "STRENGTH" | "IMPROVEMENT" | "QUESTION" | "GENERAL") => {
        const newComment = {
            id: Date.now(),
            text: "",
            type,
            category: "",
            lineNumber: null,
            isEditable: true
        }
        setGradeData({
            ...gradeData,
            detailedComments: [...gradeData.detailedComments, newComment]
        })
    }

    const updateComment = (commentId: number, field: string, value: any) => {
        setGradeData({
            ...gradeData,
            detailedComments: gradeData.detailedComments.map(comment =>
                comment.id === commentId ? { ...comment, [field]: value } : comment
            )
        })
    }

    const removeComment = (commentId: number) => {
        setGradeData({
            ...gradeData,
            detailedComments: gradeData.detailedComments.filter(comment => comment.id !== commentId)
        })
    }

    const saveGrade = async () => {
        setIsSaving(true)
        setError(null)
        setSuccessMessage(null)

        // Basic validation
        if (gradeData.score < 0 || gradeData.score > maxPoints) {
            setError(`Score must be between 0 and ${maxPoints}`)
            setIsSaving(false)
            return
        }

        try {
            const response = await fetch(`/api/submissions/${submissionId}/enhanced-grading`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...gradeData,
                    aiAssistedFeedback: !!aiSuggestions
                })
            })

            if (response.ok) {
                setSuccessMessage("Grade saved successfully!")
                setTimeout(() => setSuccessMessage(null), 5000)
            } else {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                setError(errorData.error || "Failed to save grade")
            }
        } catch (error) {
            console.error("Failed to save grade:", error)
            setError("Network error: Unable to save grade. Please check your connection and try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const getCommentIcon = (type: string) => {
        switch (type) {
            case "STRENGTH": return <Star className="size-4 text-green-600" />
            case "IMPROVEMENT": return <TrendingUp className="size-4 text-blue-600" />
            case "QUESTION": return <MessageSquare className="size-4 text-orange-600" />
            default: return <AlertTriangle className="size-4 text-gray-600" />
        }
    }

    const getCommentColor = (type: string) => {
        switch (type) {
            case "STRENGTH": return "bg-green-50 border-green-200"
            case "IMPROVEMENT": return "bg-blue-50 border-blue-200"
            case "QUESTION": return "bg-orange-50 border-orange-200"
            default: return "bg-gray-50 border-gray-200"
        }
    }

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
            {/* Left Panel - Submission Content */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Student Submission</CardTitle>
                        <CardDescription>
                            <strong>{studentName}</strong> • {assignmentTitle}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
                            <pre className="whitespace-pre-wrap font-mono text-sm">
                                {submissionContent}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                {/* Error and Success Messages */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="size-4" />
                                <span className="text-sm">{error}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setError(null)}
                                    className="ml-auto size-6 p-0"
                                >
                                    ×
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {successMessage && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-green-700">
                                <Star className="size-4" />
                                <span className="text-sm">{successMessage}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSuccessMessage(null)}
                                    className="ml-auto size-6 p-0"
                                >
                                    ×
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {aiSuggestions && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="size-5 text-purple-600" />
                                AI-Generated Insights
                            </CardTitle>
                            <CardDescription>
                                Confidence: {Math.round((aiSuggestions.confidence || 0) * 100)}%
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="mb-2 font-semibold text-green-700">Strengths Identified</h4>
                                <ul className="space-y-1 text-sm">
                                    {aiSuggestions.strengths?.map((strength: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Star className="mt-1 size-3 shrink-0 text-green-600" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-semibold text-blue-700">Areas for Improvement</h4>
                                <ul className="space-y-1 text-sm">
                                    {aiSuggestions.improvements?.map((improvement: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <TrendingUp className="mt-1 size-3 shrink-0 text-blue-600" />
                                            {improvement}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-semibold text-purple-700">Teaching Suggestions</h4>
                                <ul className="space-y-1 text-sm">
                                    {aiSuggestions.suggestions?.map((suggestion: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Zap className="mt-1 size-3 shrink-0 text-purple-600" />
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right Panel - Grading Interface */}
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Grade Assignment</CardTitle>
                        <CardDescription>
                            Provide score and detailed feedback for this submission
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Grade</TabsTrigger>
                                <TabsTrigger value="detailed">Detailed Comments</TabsTrigger>
                                <TabsTrigger value="rubric">Rubric</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Score</Label>
                                        <span className="text-sm text-gray-500">
                                            {gradeData.score} / {maxPoints} points
                                        </span>
                                    </div>
                                    <Slider
                                        value={[gradeData.score]}
                                        onValueChange={(value) => {
                                            const newScore = Math.min(Math.max(value[0], 0), maxPoints)
                                            setGradeData({ ...gradeData, score: newScore })
                                            setError(null) // Clear any score validation errors
                                        }}
                                        max={maxPoints}
                                        min={0}
                                        step={0.5}
                                        className="w-full"
                                        aria-label={`Score out of ${maxPoints} points`}
                                    />
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>0</span>
                                        <span>{maxPoints}</span>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="feedback">Overall Feedback</Label>
                                    <Textarea
                                        id="feedback"
                                        value={gradeData.feedback}
                                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                        placeholder="Provide constructive feedback for the student..."
                                        rows={6}
                                        className="mt-2"
                                        aria-describedby="feedback-help"
                                    />
                                    <p id="feedback-help" className="mt-1 text-xs text-gray-500">
                                        This feedback will be visible to the student along with their grade.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={performAutomatedGrading}
                                        disabled={isGeneratingAI}
                                        className="flex-1"
                                    >
                                        <Zap className="mr-2 size-4" />
                                        {isGeneratingAI ? "Generating..." : "Get AI Suggestions"}
                                    </Button>
                                    <Button onClick={saveGrade} disabled={isSaving} className="flex-1">
                                        <Save className="mr-2 size-4" />
                                        {isSaving ? "Saving..." : "Save Grade"}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="detailed" className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">Detailed Comments</h4>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => addDetailedComment("STRENGTH")}>
                                            <Star className="mr-1 size-3" />
                                            Strength
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => addDetailedComment("IMPROVEMENT")}>
                                            <TrendingUp className="mr-1 size-3" />
                                            Improvement
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => addDetailedComment("QUESTION")}>
                                            <MessageSquare className="mr-1 size-3" />
                                            Question
                                        </Button>
                                    </div>
                                </div>

                                <div className="max-h-96 space-y-3 overflow-y-auto">
                                    {gradeData.detailedComments.map((comment) => (
                                        <div key={comment.id} className={`rounded-lg border p-3 ${getCommentColor(comment.type)}`}> 
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {getCommentIcon(comment.type)}
                                                    <Badge variant="secondary">{comment.type}</Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeComment(comment.id)}
                                                    className="size-6 p-0"
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={comment.text}
                                                onChange={(e) => updateComment(comment.id, "text", e.target.value)}
                                                placeholder={`Add a ${comment.type.toLowerCase()} comment...`}
                                                rows={2}
                                                className="mb-2"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    value={comment.category}
                                                    onChange={(e) => updateComment(comment.id, "category", e.target.value)}
                                                    placeholder="Category (optional)"
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="number"
                                                    value={comment.lineNumber || ""}
                                                    onChange={(e) => updateComment(comment.id, "lineNumber", e.target.value ? parseInt(e.target.value) : null)}
                                                    placeholder="Line #"
                                                    className="w-20"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button onClick={saveGrade} disabled={isSaving} className="w-full">
                                    <Save className="mr-2 size-4" />
                                    {isSaving ? "Saving..." : "Save Detailed Grade"}
                                </Button>
                            </TabsContent>

                            <TabsContent value="rubric" className="mt-4 space-y-4">
                                <div className="py-8 text-center text-gray-500">
                                    <p>Rubric scoring interface will be implemented based on assignment-specific rubrics</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}