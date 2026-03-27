"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseInformation } from "@/components/course-design-studio/course-information"
import { EvidenceKit } from "@/components/course-design-studio/evidence-kit"
import { ContentAnalysis } from "@/components/course-design-studio/content-analysis"
import { SectionBuilder } from "@/components/course-design-studio/section-builder"
import { ReadyCheck } from "@/components/course-design-studio/ready-check"
import ReactMarkdown from "react-markdown"
import {
    BookOpen,
    ClipboardList,
    Target,
    GraduationCap,
    FileText,
    ArrowRight,
    CheckCircle2,
    Clock,
    Layers,
    MessageCircle,
    Shield,
    Zap,
    Send,
    Layout,
    Monitor,
    Copy,
    Check,
    Loader2,
    Wand2,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type {
    ContentAnalysis as ContentAnalysisType,
    CourseDesignSection,
    CourseDetails,
    EvidenceKitItem,
    ReadyCheckReport,
} from "@/types/course-design-studio.types"

function CourseDesignStudioContent() {
    const searchParams = useSearchParams()
    const courseIdParam = searchParams.get("courseId")
    const courseId = courseIdParam && courseIdParam !== "undefined" && courseIdParam !== "null" ? courseIdParam : null
    const [defaultCourseId, setDefaultCourseId] = useState<string | null>(null)
    const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(null)
    const [currentCourseCode, setCurrentCourseCode] = useState<string | null>(null)
    const [isCourseIdLoading, setIsCourseIdLoading] = useState(false)
    const [completedTools, setCompletedTools] = useState<string[]>([])
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)
    const [difficultyLevel, setDifficultyLevel] = useState<string>("medium")
    const [showAskAgent, setShowAskAgent] = useState(false)
    const [agentQuestion, setAgentQuestion] = useState("")
    const [agentResponse, setAgentResponse] = useState("")
    const [isAgentLoading, setIsAgentLoading] = useState(false)
    const [agentProvider, setAgentProvider] = useState("")
    const [agentDuration, setAgentDuration] = useState(0)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState("course-info")
    const [designLoading, setDesignLoading] = useState(false)
    const [designError, setDesignError] = useState<string | null>(null)
    const [courseDesignId, setCourseDesignId] = useState<string | null>(null)
    const [courseDetails, setCourseDetails] = useState<Partial<CourseDetails> | null>(null)
    const [evidenceItems, setEvidenceItems] = useState<EvidenceKitItem[]>([])
    const [sections, setSections] = useState<CourseDesignSection[]>([])
    const [analysis, setAnalysis] = useState<ContentAnalysisType | null>(null)
    const [readyCheckReport, setReadyCheckReport] = useState<ReadyCheckReport | null>(null)
    const [publishStatus, setPublishStatus] = useState<string | null>(null)
    const router = useRouter()

    const effectiveCourseId = courseId || defaultCourseId
    const hasDesign = Boolean(courseDesignId)

    const parseJson = <T,>(value: string | null | undefined, fallback: T): T => {
        if (!value) return fallback
        try {
            return JSON.parse(value) as T
        } catch {
            return fallback
        }
    }

    const loadCourseDesign = async () => {
        if (!effectiveCourseId) return
        setDesignLoading(true)
        setDesignError(null)

        try {
            const res = await fetch(`/api/course-design-studio?courseId=${effectiveCourseId}&action=full`)
            const payload = await res.json()
            if (!res.ok) {
                throw new Error(payload?.error || "Unable to load course design")
            }

            const design = payload?.data
            if (!design) {
                setCourseDesignId(null)
                setCourseDetails(null)
                setEvidenceItems([])
                setSections([])
                return
            }

            setCourseDesignId(design.id)
            setEvidenceItems(design.evidenceItems || [])
            setSections(design.courseSections || [])
            setCourseDetails({
                courseId: design.courseId,
                title: design.course?.title || currentCourseTitle || "",
                code: design.course?.code || currentCourseCode || "",
                creditHours: design.creditHours,
                contactHours: design.contactHours,
                academicLevel: design.academicLevel,
                termLength: design.termLength,
                deliveryMode: design.deliveryMode,
                prerequisites: parseJson<string[]>(design.prerequisites, []),
                programAlignment: design.programAlignment || "",
                learningModel: design.learningModel,
                assessmentWeighting: parseJson(design.assessmentWeighting, {}),
                participationRules: design.participationRules || "",
                weeklyWorkloadHours: design.weeklyWorkloadHours,
                formattingStandard: design.formattingStandard,
                accessibilityRequired: design.accessibilityRequired,
                aiUsagePolicy: design.aiUsagePolicy,
                accreditationBody: design.accreditationBody || "",
                versionId: design.versionId,
                isLocked: design.isLocked,
            })
        } catch (err) {
            setDesignError(err instanceof Error ? err.message : "Unable to load course design")
        } finally {
            setDesignLoading(false)
        }
    }

    const handleAnalyze = async () => {
        if (!effectiveCourseId) throw new Error("Course not selected")
        const res = await fetch("/api/course-design-studio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "analyze-content",
                courseId: effectiveCourseId,
            }),
        })
        const payload = await res.json()
        if (!res.ok) {
            throw new Error(payload?.error || "Unable to analyze content")
        }
        setAnalysis(payload.data)
        return payload.data
    }

    const handleReadyCheck = async () => {
        if (!effectiveCourseId) throw new Error("Course not selected")
        const res = await fetch("/api/course-design-studio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "ready-check",
                courseId: effectiveCourseId,
            }),
        })
        const payload = await res.json()
        if (!res.ok) {
            throw new Error(payload?.error || "Ready-check failed")
        }
        setReadyCheckReport(payload.data)
        return payload.data
    }

    const handlePublish = async () => {
        if (!effectiveCourseId) return
        setPublishStatus(null)

        const res = await fetch("/api/course-design-studio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "publish",
                courseId: effectiveCourseId,
            }),
        })
        const payload = await res.json()
        if (!res.ok || payload?.data?.success === false) {
            const errorMessage = payload?.data?.error || payload?.error || "Publish failed"
            setPublishStatus(errorMessage)
            return
        }

        setPublishStatus("Course published successfully. Students will be notified.")
        await loadCourseDesign()
    }

    useEffect(() => {
        const saved = localStorage.getItem("completedDesignTools")
        if (saved) {
            setCompletedTools(JSON.parse(saved))
        }
    }, [])

    useEffect(() => {
        const loadCourses = async () => {
            setIsCourseIdLoading(true)
            try {
                const res = await fetch("/api/courses")
                const data = await res.json()
                const courses = data?.courses ?? []
                const latestCourse = courses[0] ?? null

                if (!courseId && latestCourse?.id) {
                    setDefaultCourseId(latestCourse.id)
                    setCurrentCourseTitle(latestCourse.title ?? null)
                    setCurrentCourseCode(latestCourse.code ?? null)
                }

                if (courseId) {
                    const activeCourse = courses.find((course: any) => course.id === courseId)
                    setCurrentCourseTitle(activeCourse?.title ?? null)
                    setCurrentCourseCode(activeCourse?.code ?? null)
                }
            } catch (error) {
                if (!courseId) {
                    setDefaultCourseId(null)
                }
            } finally {
                setIsCourseIdLoading(false)
            }
        }

        loadCourses()
    }, [courseId])

    useEffect(() => {
        if (effectiveCourseId) {
            loadCourseDesign()
        }
    }, [effectiveCourseId])

    const aiFeatures = [
        {
            id: "objectives",
            title: "Generate Objectives",
            description: "AI-crafted learning goals aligned with Bloom's Taxonomy",
            icon: Target,
            color: "blue",
            href: "/dashboard/generate-objectives",
            estimatedTime: "5 min",
        },
        {
            id: "curriculum",
            title: "Suggest Curriculum",
            description: "Week-by-week course structure recommendations",
            icon: BookOpen,
            color: "green",
            href: "/dashboard/suggest-curriculum",
            estimatedTime: "8 min",
        },
        {
            id: "presentations",
            title: "Create Presentations",
            description: "Generate PowerPoint slides with lecture notes for each class",
            icon: Monitor,
            color: "pink",
            href: effectiveCourseId ? `/dashboard/courses/${effectiveCourseId}/studio` : null,
            estimatedTime: "10 min",
            badge: "AI",
            requiresCourse: true,
        },
        {
            id: "lecture-notes",
            title: "Create Lecture Notes",
            description: "Build lecture notes per session with structured content",
            icon: FileText,
            color: "orange",
            href: effectiveCourseId ? `/dashboard/courses/${effectiveCourseId}/lecture-notes` : null,
            estimatedTime: "8-12 min",
            badge: "New",
            requiresCourse: true,
        },
        {
            id: "sections",
            title: "Build Course Sections",
            description: "Add sections, files, assignments, links - unlimited flexibility",
            icon: Layout,
            color: "indigo",
            href: effectiveCourseId ? `/dashboard/courses/${effectiveCourseId}/build-sections` : null,
            estimatedTime: "15-30 min",
            badge: "New",
            requiresCourse: true,
        },
        {
            id: "assessments",
            title: "Design Assessments",
            description: "Smart assignment creation with rubrics",
            icon: GraduationCap,
            color: "purple",
            href: "/dashboard/design-assessments",
            estimatedTime: "10 min",
        },
        {
            id: "syllabus",
            title: "Create Syllabus",
            description: "Complete syllabus with policies and resources",
            icon: FileText,
            color: "orange",
            href: "/dashboard/create-syllabus",
            estimatedTime: "12 min",
        },
    ]

    const progress = (completedTools.length / aiFeatures.length) * 100

    const copyResponse = () => {
        navigator.clipboard.writeText(agentResponse)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const askAgent = async () => {
        if (!agentQuestion.trim()) return
        setIsAgentLoading(true)
        setAgentResponse("")
        setAgentProvider("")
        setAgentDuration(0)

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: agentQuestion }],
                }),
            })

            const contentType = res.headers.get("content-type") || ""

            if (!res.ok) {
                if (contentType.includes("application/json")) {
                    const errData = await res.json().catch(() => null)
                    setAgentResponse(errData?.error || `Server error (${res.status}). Please try again.`)
                } else {
                    setAgentResponse(`Server error (${res.status}). Please try again.`)
                }
                return
            }

            if (!contentType.includes("application/json")) {
                setAgentResponse("Unexpected response from server. Please try again.")
                return
            }

            const data = await res.json()
            setAgentResponse(data.content || data.message || "I can help you with course design!")
            setAgentProvider(data.provider || "")
            setAgentDuration(data.durationMs || 0)
        } catch (error) {
            console.error("Ask GENIE error:", error)
            setAgentResponse("Sorry, I'm having trouble connecting. Please check your network and try again.")
        } finally {
            setIsAgentLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-7xl flex-1 space-y-6 p-8 pt-6">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex-1 space-y-1">
                    <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                        <Zap className="size-8 text-purple-600" />
                        AI Course Design Studio
                    </h2>
                    <p className="text-muted-foreground">
                        Intelligent tools to design engaging and effective courses
                    </p>
                    {effectiveCourseId && (
                        <Badge variant="secondary" className="mt-2">
                            Editing Course: {currentCourseTitle || "Selected Course"}
                            {currentCourseCode ? ` (${currentCourseCode})` : ""}
                        </Badge>
                    )}
                    {!effectiveCourseId && !isCourseIdLoading && (
                        <Badge variant="outline" className="mt-2">
                            Select a course to enable presentations
                        </Badge>
                    )}
                    {!effectiveCourseId && !isCourseIdLoading && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/courses">
                                    Choose Existing Course
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/dashboard/courses/new">
                                    Create New Course
                                </Link>
                            </Button>
                        </div>
                    )}
                    {!effectiveCourseId && isCourseIdLoading && (
                        <Badge variant="outline" className="mt-2">
                            Loading courses...
                        </Badge>
                    )}
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Difficulty Level</label>
                        <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light - Introductory</SelectItem>
                                <SelectItem value="medium">Medium - Standard</SelectItem>
                                <SelectItem value="hard">Hard - Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        className="mt-auto border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/20"
                        onClick={() => setShowAskAgent(!showAskAgent)}
                    >
                        <MessageCircle className="mr-2 size-4" />
                        Ask Professor GENIE
                    </Button>
                </div>
            </div>

            {showAskAgent && (
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="size-5 text-purple-600" />
                            Ask Professor GENIE
                        </CardTitle>
                        <CardDescription>
                            Your AI teaching assistant — get detailed, structured answers on course design, pedagogy, assessments, and more
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Suggested Prompts */}
                        {!agentResponse && !isAgentLoading && (
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Design a 15-week course schedule with assessments",
                                    "Create learning objectives using Bloom's Taxonomy",
                                    "Build a rubric for a research paper assignment",
                                    "Suggest active learning strategies for large lectures",
                                    "Create a comprehensive syllabus template",
                                    "Design a flipped classroom model for my course",
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => { setAgentQuestion(prompt); }}
                                        className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-900 dark:text-purple-300 dark:hover:bg-purple-950/30"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Ask anything about course design... e.g., 'Design a 12-week programming course with weekly topics and assessments'"
                                value={agentQuestion}
                                onChange={(e) => setAgentQuestion(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && agentQuestion.trim()) { e.preventDefault(); askAgent() } }}
                                className="min-h-[80px] flex-1 resize-none"
                            />
                        </div>
                        <Button
                            onClick={askAgent}
                            disabled={isAgentLoading || !agentQuestion.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            {isAgentLoading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Professor GENIE is thinking...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 size-4" />
                                    Ask Professor GENIE
                                </>
                            )}
                        </Button>

                        {isAgentLoading && (
                            <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="size-4 animate-spin text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Professor GENIE is generating a detailed response...</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-3/4 animate-pulse rounded bg-purple-200/50 dark:bg-purple-800/30" />
                                    <div className="h-4 w-full animate-pulse rounded bg-purple-200/50 dark:bg-purple-800/30" />
                                    <div className="h-4 w-5/6 animate-pulse rounded bg-purple-200/50 dark:bg-purple-800/30" />
                                    <div className="h-4 w-2/3 animate-pulse rounded bg-purple-200/50 dark:bg-purple-800/30" />
                                </div>
                            </div>
                        )}

                        {agentResponse && !isAgentLoading && (
                            <div className="rounded-lg border bg-white shadow-sm dark:bg-gray-950">
                                {/* Response Header */}
                                <div className="flex items-center justify-between border-b px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="size-4 text-purple-600" />
                                        <span className="text-sm font-semibold">Professor GENIE&apos;s Response</span>
                                        {agentProvider && (
                                            <Badge variant="secondary" className="text-xs">
                                                {agentProvider}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {agentDuration > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {(agentDuration / 1000).toFixed(1)}s
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={copyResponse}
                                            className="h-8 gap-1.5 text-xs"
                                        >
                                            {copied ? (
                                                <><Check className="size-3.5 text-green-600" /> Copied</>
                                            ) : (
                                                <><Copy className="size-3.5" /> Copy</>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Markdown Response Body */}
                                <ScrollArea className="max-h-[600px]">
                                    <div className="prose prose-sm dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-purple-900 prose-h2:border-b prose-h2:pb-1 prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-li:my-0.5 prose-table:w-full prose-th:border prose-th:bg-purple-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-td:border prose-td:px-3 prose-td:py-2 prose-blockquote:border-purple-300 prose-blockquote:bg-purple-50/50 prose-blockquote:py-1 prose-blockquote:not-italic prose-strong:text-purple-800 prose-hr:my-6 dark:prose-headings:text-purple-300 dark:prose-th:bg-purple-950/30 dark:prose-blockquote:border-purple-700 dark:prose-blockquote:bg-purple-950/30 dark:prose-strong:text-purple-300 max-w-none px-5 py-4">
                                        <ReactMarkdown>{agentResponse}</ReactMarkdown>
                                    </div>
                                </ScrollArea>

                                {/* Ask Another */}
                                <div className="border-t px-4 py-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setAgentResponse(""); setAgentQuestion(""); }}
                                        className="gap-1.5 text-xs"
                                    >
                                        <MessageCircle className="size-3.5" />
                                        Ask Another Question
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {designError && (
                <Alert variant="destructive">
                    <AlertDescription>{designError}</AlertDescription>
                </Alert>
            )}
            {designLoading && (
                <Alert>
                    <AlertDescription>Loading course design data...</AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap gap-2">
                    <TabsTrigger value="course-info" className="flex items-center gap-2">
                        <ClipboardList className="size-4" />
                        Course Information
                    </TabsTrigger>
                    <TabsTrigger value="evidence" className="flex items-center gap-2">
                        <BookOpen className="size-4" />
                        Evidence Kit
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                        <Layers className="size-4" />
                        Content Analysis
                    </TabsTrigger>
                    <TabsTrigger value="sections" className="flex items-center gap-2">
                        <Layout className="size-4" />
                        Course Sections
                    </TabsTrigger>
                    <TabsTrigger value="ready-check" className="flex items-center gap-2">
                        <Shield className="size-4" />
                        Ready-Check & Publish
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="flex items-center gap-2">
                        <Zap className="size-4" />
                        AI Tools
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="course-info" className="space-y-6">
                    {effectiveCourseId ? (
                        <CourseInformation
                            courseId={effectiveCourseId}
                            courseTitle={currentCourseTitle}
                            courseCode={currentCourseCode}
                            initialDetails={courseDetails}
                            hasDesign={hasDesign}
                            onSaved={(updated) => {
                                setCourseDetails(prev => ({ ...prev, ...updated }))
                                loadCourseDesign()
                            }}
                        />
                    ) : (
                        <Alert>
                            <AlertDescription>Select a course to configure details.</AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="evidence" className="space-y-6">
                    {effectiveCourseId && hasDesign ? (
                        <EvidenceKit
                            courseId={effectiveCourseId}
                            courseDesignId={courseDesignId || undefined}
                            items={evidenceItems}
                            onItemsChangeAction={setEvidenceItems}
                            isReadOnly={courseDetails?.isLocked || false}
                        />
                    ) : (
                        <Alert>
                            <AlertDescription>
                                Save course details first to unlock the Evidence Kit for textbooks, files, and links.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6">
                    {effectiveCourseId && hasDesign ? (
                        <ContentAnalysis
                            courseId={effectiveCourseId}
                            analysis={analysis}
                            onAnalyze={handleAnalyze}
                        />
                    ) : (
                        <Alert>
                            <AlertDescription>
                                Save course details before running content analysis.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="sections" className="space-y-6">
                    {/* Quick Actions for Presentation Studio and Lecture Notes */}
                    {effectiveCourseId && hasDesign && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Link href={`/dashboard/courses/${effectiveCourseId}/studio`}>
                                <Card className="border-l-4 border-pink-500 transition-all hover:bg-pink-50 hover:shadow-md dark:hover:bg-pink-950/20">
                                    <CardContent className="flex items-center gap-3 py-4">
                                        <Monitor className="size-8 text-pink-600" />
                                        <div>
                                            <p className="font-semibold">Presentation Studio</p>
                                            <p className="text-sm text-muted-foreground">Generate PowerPoint slides with AI</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href={`/dashboard/courses/${effectiveCourseId}/lecture-notes`}>
                                <Card className="border-l-4 border-orange-500 transition-all hover:bg-orange-50 hover:shadow-md dark:hover:bg-orange-950/20">
                                    <CardContent className="flex items-center gap-3 py-4">
                                        <FileText className="size-8 text-orange-600" />
                                        <div>
                                            <p className="font-semibold">Lecture Notes</p>
                                            <p className="text-sm text-muted-foreground">Build structured lecture notes</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href={`/dashboard/courses/${effectiveCourseId}/build-sections`}>
                                <Card className="border-l-4 border-indigo-500 transition-all hover:bg-indigo-50 hover:shadow-md dark:hover:bg-indigo-950/20">
                                    <CardContent className="flex items-center gap-3 py-4">
                                        <Layout className="size-8 text-indigo-600" />
                                        <div>
                                            <p className="font-semibold">Build Course Sections</p>
                                            <p className="text-sm text-muted-foreground">Advanced section editor</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    )}

                    {effectiveCourseId && hasDesign ? (
                        <SectionBuilder
                            courseId={effectiveCourseId}
                            sections={sections}
                            onSectionsChange={setSections}
                            evidenceItems={evidenceItems}
                            isReadOnly={courseDetails?.isLocked || false}
                        />
                    ) : (
                        <Alert>
                            <AlertDescription>
                                Save course details before building sections.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="ready-check" className="space-y-6">
                    {publishStatus && (
                        <Alert>
                            <AlertDescription>{publishStatus}</AlertDescription>
                        </Alert>
                    )}
                    {effectiveCourseId && hasDesign ? (
                        <ReadyCheck
                            courseId={effectiveCourseId}
                            onRunCheck={handleReadyCheck}
                            onPublish={handlePublish}
                            report={readyCheckReport}
                        />
                    ) : (
                        <Alert>
                            <AlertDescription>
                                Save course details before running Ready-Check.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="tools" className="space-y-6">
                    {completedTools.length > 0 && (
                        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:border-green-900 dark:from-green-950/20 dark:to-blue-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    Course Design Progress
                                    <Badge variant="secondary">{completedTools.length}/{aiFeatures.length} Complete</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Progress value={progress} className="h-2" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {progress === 100
                                        ? "All tools completed. Your course is ready."
                                        : `Keep going! ${aiFeatures.length - completedTools.length} tools remaining.`}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {aiFeatures.map((feature) => {
                            const Icon = feature.icon
                            const isCompleted = completedTools.includes(feature.id)
                            const isHovered = hoveredCard === feature.id
                            const isDisabled = feature.requiresCourse && !effectiveCourseId
                            const colorClasses = {
                                blue: "border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:shadow-blue-200",
                                green: "border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 hover:shadow-green-200",
                                purple: "border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:shadow-purple-200",
                                orange: "border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:shadow-orange-200",
                                indigo: "border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:shadow-indigo-200",
                            }[feature.color]
                            const card = (
                                <Card
                                    className={`border-l-4 ${colorClasses} relative h-full transition-all hover:shadow-lg ${isHovered ? "scale-[1.02]" : ""} ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                    onClick={() => {
                                        if (isDisabled) return
                                        if (feature.href) router.push(feature.href)
                                    }}
                                >
                                    {isCompleted && (
                                        <div className="absolute -right-2 -top-2 rounded-full bg-green-500 p-1 text-white">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <Icon className={`text- size-8${feature.color}-600 ${isHovered ? "scale-110" : ""} transition-transform`} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{feature.title}</span>
                                                    {feature.badge && (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                            {feature.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {isHovered && (
                                                    <div className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
                                                        <Clock className="size-3" />
                                                        <span>{feature.estimatedTime}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            {feature.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            className="w-full"
                                            variant={isCompleted ? "secondary" : "outline"}
                                            disabled={isDisabled}
                                            onClick={(event) => {
                                                if (isDisabled) {
                                                    event.preventDefault()
                                                    return
                                                }
                                                if (feature.href) {
                                                    router.push(feature.href)
                                                }
                                            }}
                                        >
                                            {isDisabled ? "Select Course First" : isCompleted ? "View Again" : "Open Tool"}
                                            <ArrowRight className="ml-2 size-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            )

                            return (
                                <div
                                    key={feature.id}
                                    onMouseEnter={() => setHoveredCard(feature.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    {card}
                                </div>
                            )
                        })}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>How It Works</CardTitle>
                            <CardDescription>
                                Use AI-powered tools to streamline your course design process
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>Each tool uses advanced AI to help you create professional course materials</p>
                                <p>Click any card above to start generating content</p>
                                <p>Save and export your work at any time</p>
                                <p>Iterate and refine with AI suggestions</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function CourseDesignStudioPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="animate-pulse">Loading course design studio...</div>
                </div>
            }
        >
            <CourseDesignStudioContent />
        </Suspense>
    )
}