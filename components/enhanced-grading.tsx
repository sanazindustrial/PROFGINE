"use client"

import { useEffect, useRef, useState } from "react"
import { Spinner } from "@radix-ui/themes"
// @ts-ignore
import mixpanel from "mixpanel-browser"

import {
    FilePurpose,
    FilePurposeEnum,
    FilePurposeInterface,
} from "@/types/file-purpose.types"
import {
    MESSAGE_CHUNKS_COMPONENTS,
    getMessageContent,
} from "@/lib/user-messages.utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { FileUploader } from "@/components/file-uploader.component"
import {
    DEFAULT_PROFESSOR_STYLES,
    GRADING_PROMPT_TEMPLATES,
    ProfessorStyleConfig,
    GradingRequest,
    AssessmentType,
    createEnhancedSubscriptionManager
} from "@/lib/enhanced-subscription-manager-v2"

type GradingDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
type FeedbackDepth = 'LIGHT' | 'MODERATE' | 'DEEP' | 'COMPREHENSIVE'
type ProfessorPersonality = 'ENCOURAGING' | 'CRITICAL' | 'ANALYTICAL' | 'SUPPORTIVE' | 'DETAILED' | 'CONCISE'

export function EnhancedGrading() {
    // Basic grading state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [messages, setMessages] = useState<Array<{ role: string; content: string; id: string }>>([])
    const [isResponseLoading, setIsResponseLoading] = useState(false)

    // Content state
    const [professorProfile, setProfessorProfile] = useState("")
    const [rubricPrompt, setRubricPrompt] = useState("")
    const [assignmentPrompt, setAssignmentPrompt] = useState("")
    const [studentPost, setStudentPost] = useState("")
    const [refineInstructions, setRefineInstructions] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<FilePurposeInterface>({})

    // Professor Style Configuration
    const [assessmentType, setAssessmentType] = useState<AssessmentType>(AssessmentType.ASSIGNMENT)
    const [gradingDifficulty, setGradingDifficulty] = useState<GradingDifficulty>('MEDIUM')
    const [feedbackDepth, setFeedbackDepth] = useState<FeedbackDepth>('MODERATE')
    const [professorPersonality, setProfessorPersonality] = useState<ProfessorPersonality>('SUPPORTIVE')
    const [customPromptTemplate, setCustomPromptTemplate] = useState("")
    const [keyEvaluationCriteria, setKeyEvaluationCriteria] = useState<string[]>(['Understanding', 'Analysis', 'Organization', 'Writing Quality'])
    const [useCustomPrompt, setUseCustomPrompt] = useState(false)
    const [enableStyleLearning, setEnableStyleLearning] = useState(true)

    // Credits and subscription
    const [creditBalance, setCreditBalance] = useState(0)
    const [creditsRequired, setCreditsRequired] = useState(1)

    const rubricInputRef = useRef<HTMLInputElement>(null)
    const assignmentInputRef = useRef<HTMLInputElement>(null)
    const studentInputRef = useRef<HTMLInputElement>(null)
    const professorInputRef = useRef<HTMLInputElement>(null)

    // Load saved preferences
    useEffect(() => {
        const storedProfile = localStorage.getItem("professorProfile")
        const storedPrompt = localStorage.getItem("rubricPrompt")
        const storedAssignmentPrompt = localStorage.getItem("assignmentPrompt")
        const storedStyleConfig = localStorage.getItem("professorStyleConfig")

        if (storedProfile) setProfessorProfile(storedProfile)
        if (storedPrompt) setRubricPrompt(storedPrompt)
        if (storedAssignmentPrompt) setAssignmentPrompt(storedAssignmentPrompt)

        if (storedStyleConfig) {
            const config = JSON.parse(storedStyleConfig)
            setGradingDifficulty(config.gradingDifficulty || 'MEDIUM')
            setFeedbackDepth(config.feedbackDepth || 'MODERATE')
            setProfessorPersonality(config.personality || 'SUPPORTIVE')
            setKeyEvaluationCriteria(config.keyEvaluationCriteria || ['Understanding', 'Analysis'])
            setCustomPromptTemplate(config.customPromptTemplate || "")
        }
    }, [])

    // Save professor style configuration
    useEffect(() => {
        const config = {
            gradingDifficulty,
            feedbackDepth,
            personality: professorPersonality,
            keyEvaluationCriteria,
            customPromptTemplate
        }
        localStorage.setItem("professorStyleConfig", JSON.stringify(config))
    }, [gradingDifficulty, feedbackDepth, professorPersonality, keyEvaluationCriteria, customPromptTemplate])

    // Apply quick style presets
    const applyStylePreset = (preset: keyof typeof DEFAULT_PROFESSOR_STYLES) => {
        const style = DEFAULT_PROFESSOR_STYLES[preset]
        if (style.gradingDifficulty) setGradingDifficulty(style.gradingDifficulty)
        if (style.feedbackDepth) setFeedbackDepth(style.feedbackDepth)
        if (style.personality) setProfessorPersonality(style.personality)
        if (style.keyEvaluationCriteria) setKeyEvaluationCriteria(style.keyEvaluationCriteria)
    }

    // Generate custom prompt based on configuration
    const generateStylePrompt = (): string => {
        if (useCustomPrompt && customPromptTemplate) {
            return customPromptTemplate
        }

        const baseTemplate = GRADING_PROMPT_TEMPLATES[assessmentType as keyof typeof GRADING_PROMPT_TEMPLATES]
        let prompt = ""

        if (assessmentType === AssessmentType.ASSIGNMENT) {
            prompt = baseTemplate[gradingDifficulty as keyof typeof baseTemplate] || ""
        } else {
            prompt = baseTemplate[feedbackDepth as keyof typeof baseTemplate] || ""
        }

        // Add personality adjustments
        const personalityPrompts = {
            ENCOURAGING: "Maintain an encouraging tone throughout your feedback. Focus on strengths and frame suggestions positively.",
            CRITICAL: "Apply rigorous academic standards with detailed critique. Be direct about weaknesses while remaining constructive.",
            ANALYTICAL: "Provide systematic, logical analysis. Break down each component methodically.",
            SUPPORTIVE: "Balance critique with support. Acknowledge effort while guiding improvement.",
            DETAILED: "Provide comprehensive, detailed feedback on all aspects of the work.",
            CONCISE: "Keep feedback focused and concise while covering essential points."
        }

        prompt += "\\n\\nStyle Guidelines: " + personalityPrompts[professorPersonality]

        if (keyEvaluationCriteria.length > 0) {
            prompt += "\\n\\nKey evaluation criteria to focus on: " + keyEvaluationCriteria.join(", ")
        }

        return prompt
    }

    const trackUploadedFiles = (purpose: FilePurpose, id: string) => {
        setUploadedFiles((uploadedFiles) => {
            if (id) {
                return { ...uploadedFiles, [purpose]: id }
            } else {
                return Object.keys(uploadedFiles)
                    .filter((fileKey) => fileKey !== purpose)
                    .reduce((updatedFiles: Record<string, string>, fileKey) => {
                        updatedFiles[fileKey] = uploadedFiles[fileKey]
                        return updatedFiles
                    }, {})
            }
        })
    }

    const fileUploaderClickHandler = (purpose: FilePurpose) => {
        switch (purpose) {
            case FilePurposeEnum.rubric:
                if (rubricInputRef.current) {
                    rubricInputRef.current.value = ""
                    trackUploadedFiles(purpose, "")
                }
                break
            case FilePurposeEnum.assignment:
                if (assignmentInputRef.current) {
                    assignmentInputRef.current.value = ""
                    trackUploadedFiles(purpose, "")
                }
                break
            case FilePurposeEnum.student:
                if (studentInputRef.current) {
                    studentInputRef.current.value = ""
                    trackUploadedFiles(purpose, "")
                }
                break
        }
    }

    const onSubmitHandler = async () => {
        mixpanel.track("AI Grading Generated", {
            assessmentType,
            gradingDifficulty,
            feedbackDepth,
            personality: professorPersonality,
            hasCustomPrompt: useCustomPrompt,
            creditCost: creditsRequired
        })

        setIsLoading(true)
        setIsResponseLoading(true)
        setError(null)
        setMessages([])

        try {
            const stylePrompt = generateStylePrompt()

            const messageChunks: Partial<Record<FilePurposeEnum, string>> = {}
            const availablePurposeFiles = Object.keys(uploadedFiles)

            MESSAGE_CHUNKS_COMPONENTS.forEach((component) => {
                if (!availablePurposeFiles.includes(component)) {
                    switch (component) {
                        case FilePurposeEnum.assignment:
                            messageChunks[FilePurposeEnum.assignment] = assignmentPrompt
                            break
                        case FilePurposeEnum.rubric:
                            messageChunks[FilePurposeEnum.rubric] = rubricPrompt
                            break
                        case FilePurposeEnum.student:
                            messageChunks[FilePurposeEnum.student] = studentPost
                            break
                        case FilePurposeEnum.professor:
                            messageChunks[FilePurposeEnum.professor] = professorProfile
                            break
                    }
                }
            })

            const content = getMessageContent(messageChunks)

            const gradingRequest: GradingRequest = {
                assessmentType,
                content,
                rubric: rubricPrompt,
                professorStyle: {
                    gradingDifficulty,
                    feedbackDepth,
                    personality: professorPersonality,
                    customPromptTemplate: useCustomPrompt ? customPromptTemplate : undefined,
                    keyEvaluationCriteria
                },
                customInstructions: stylePrompt
            }

            const payload = {
                messages: [{
                    role: "system",
                    content: `You are an AI grading assistant. ${stylePrompt}`
                }, {
                    role: "user",
                    content: `Grade this ${assessmentType.toLowerCase()}: ${content}`
                }],
                gradingRequest,
                ...(Object.keys(uploadedFiles).length > 0 ? { data: uploadedFiles } : {})
            }

            const res = await fetch("/api/grading", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error ?? "Grading failed")

            setMessages([
                { role: "user", content, id: "0" },
                { role: "assistant", content: data.content || data.message || "", id: "1" }
            ])

            // Update credit balance
            setCreditBalance(prev => Math.max(0, prev - creditsRequired))

            // Track learning if enabled
            if (enableStyleLearning) {
                // Send learning data to backend
                await fetch("/api/professor-style/learn", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        gradingRequest,
                        satisfaction: "good" // This could come from user feedback
                    })
                })
            }

        } catch (e: any) {
            setError(e?.message ?? "Grading failed")
        } finally {
            setIsLoading(false)
            setIsResponseLoading(false)
        }
    }

    const newGradingHandler = () => {
        setMessages([])
        setStudentPost("")
        setRefineInstructions("")
        setUploadedFiles({ ...uploadedFiles, [FilePurposeEnum.student]: "" })
        if (studentInputRef.current) {
            studentInputRef.current.value = ""
            trackUploadedFiles(FilePurposeEnum.student, "")
        }
    }

    return (
        <section className="w-full space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Grading Panel */}
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Grading Assistant</CardTitle>
                            <CardDescription>
                                Grade {assessmentType.toLowerCase()}s with customized professor style and feedback depth
                            </CardDescription>
                            <div className="flex items-center gap-2">
                                <Badge variant={creditBalance >= creditsRequired ? "default" : "destructive"}>
                                    Credits: {creditBalance} (Required: {creditsRequired})
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Assessment Type Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="assessment-type">Assessment Type</Label>
                                <Select value={assessmentType} onValueChange={(value: AssessmentType) => setAssessmentType(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select assessment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                                        <SelectItem value="PAPER">Paper</SelectItem>
                                        <SelectItem value="DISSERTATION">Dissertation</SelectItem>
                                        <SelectItem value="EXAM">Exam</SelectItem>
                                        <SelectItem value="QUIZ">Quiz</SelectItem>
                                        <SelectItem value="PROJECT">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Content Inputs */}
                            <div className="space-y-2">
                                <Label htmlFor="assignment-prompt">Assignment Details</Label>
                                <FileUploader
                                    purpose={FilePurposeEnum.assignment}
                                    trackFile={trackUploadedFiles}
                                    onClick={fileUploaderClickHandler}
                                    fileId={uploadedFiles[FilePurposeEnum.assignment]}
                                    ref={assignmentInputRef}
                                    multiple
                                />
                                <Textarea
                                    className="min-h-[100px]"
                                    id="assignment-prompt"
                                    value={assignmentPrompt}
                                    onChange={(e) => setAssignmentPrompt(e.target.value)}
                                    placeholder="Enter the assignment instructions and requirements"
                                    disabled={!!uploadedFiles[FilePurposeEnum.assignment]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="student-submission">Student Submission</Label>
                                <FileUploader
                                    purpose={FilePurposeEnum.student}
                                    trackFile={trackUploadedFiles}
                                    onClick={fileUploaderClickHandler}
                                    fileId={uploadedFiles[FilePurposeEnum.student]}
                                    ref={studentInputRef}
                                    multiple
                                />
                                <Textarea
                                    value={studentPost}
                                    onChange={(e) => setStudentPost(e.target.value)}
                                    className="min-h-[200px]"
                                    id="student-submission"
                                    placeholder="Enter the student's submission content"
                                    disabled={!!uploadedFiles[FilePurposeEnum.student]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rubric">Grading Rubric (Optional)</Label>
                                <FileUploader
                                    purpose={FilePurposeEnum.rubric}
                                    trackFile={trackUploadedFiles}
                                    onClick={fileUploaderClickHandler}
                                    fileId={uploadedFiles[FilePurposeEnum.rubric]}
                                    ref={rubricInputRef}
                                />
                                <Textarea
                                    className="min-h-[100px]"
                                    id="rubric"
                                    value={rubricPrompt}
                                    disabled={!!uploadedFiles[FilePurposeEnum.rubric]}
                                    onChange={(e) => setRubricPrompt(e.target.value)}
                                    placeholder="Enter your grading rubric or criteria"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Professor Style Configuration Panel */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Professor Style</CardTitle>
                            <CardDescription>Customize your grading approach and feedback style</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="quick" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="quick">Quick Style</TabsTrigger>
                                    <TabsTrigger value="custom">Custom</TabsTrigger>
                                </TabsList>

                                <TabsContent value="quick" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => applyStylePreset('EASY')}
                                            className="text-sm"
                                        >
                                            Easy Going
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyStylePreset('MEDIUM')}
                                            className="text-sm"
                                        >
                                            Balanced
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyStylePreset('HARD')}
                                            className="text-sm"
                                        >
                                            Rigorous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyStylePreset('DEEP')}
                                            className="text-sm"
                                        >
                                            Deep Analysis
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="custom" className="space-y-4">
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Grading Difficulty</Label>
                                            <Select value={gradingDifficulty} onValueChange={(value: GradingDifficulty) => setGradingDifficulty(value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EASY">Easy</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                                    <SelectItem value="HARD">Hard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Feedback Depth</Label>
                                            <Select value={feedbackDepth} onValueChange={(value: FeedbackDepth) => setFeedbackDepth(value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LIGHT">Light</SelectItem>
                                                    <SelectItem value="MODERATE">Moderate</SelectItem>
                                                    <SelectItem value="DEEP">Deep</SelectItem>
                                                    <SelectItem value="COMPREHENSIVE">Comprehensive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Professor Personality</Label>
                                            <Select value={professorPersonality} onValueChange={(value: ProfessorPersonality) => setProfessorPersonality(value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ENCOURAGING">Encouraging</SelectItem>
                                                    <SelectItem value="SUPPORTIVE">Supportive</SelectItem>
                                                    <SelectItem value="ANALYTICAL">Analytical</SelectItem>
                                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                                    <SelectItem value="DETAILED">Detailed</SelectItem>
                                                    <SelectItem value="CONCISE">Concise</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="custom-prompt"
                                        checked={useCustomPrompt}
                                        onCheckedChange={setUseCustomPrompt}
                                    />
                                    <Label htmlFor="custom-prompt">Use Custom Prompt</Label>
                                </div>

                                {useCustomPrompt && (
                                    <Textarea
                                        placeholder="Enter your custom grading prompt template..."
                                        value={customPromptTemplate}
                                        onChange={(e) => setCustomPromptTemplate(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                )}

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="style-learning"
                                        checked={enableStyleLearning}
                                        onCheckedChange={setEnableStyleLearning}
                                    />
                                    <Label htmlFor="style-learning">Enable Style Learning</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={onSubmitHandler}
                    disabled={messages.length > 0 || isResponseLoading || creditBalance < creditsRequired}
                    size="lg"
                >
                    Generate Grading & Feedback
                </Button>
                <Button
                    disabled={isResponseLoading || messages.length === 0}
                    onClick={newGradingHandler}
                    variant="outline"
                >
                    New Grading
                </Button>
                <Spinner
                    loading={isResponseLoading}
                    className="self-center"
                    size="3"
                />
            </div>

            {/* Results */}
            {messages[1] && (
                <Card>
                    <CardHeader>
                        <CardTitle>Grading Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            className="min-h-[300px]"
                            value={messages[1].content}
                            onChange={(e) =>
                                setMessages([
                                    messages[0],
                                    {
                                        content: e.target.value,
                                        role: "assistant",
                                        id: "1",
                                    },
                                ])
                            }
                            readOnly={false}
                        />
                        {error && (
                            <div className="mt-2 text-sm text-red-500">{error}</div>
                        )}

                        <div className="mt-4 flex gap-2">
                            <Button
                                onClick={() => {
                                    mixpanel.track("Grading Results Copied")
                                    navigator.clipboard.writeText(messages[1].content)
                                }}
                            >
                                Copy Results
                            </Button>
                            <Button variant="outline">
                                Save to Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </section>
    )
}