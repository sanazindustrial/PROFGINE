"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
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
import remarkGfm from "remark-gfm"
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
    ImageIcon,
    ZoomIn,
    ZoomOut,
    X,
    Download,
    Palette,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type {
    ContentAnalysis as ContentAnalysisType,
    CourseDesignSection,
    CourseDetails,
    EvidenceKitItem,
    ReadyCheckReport,
} from "@/types/course-design-studio.types"

function ChatImage({ src, alt, onZoom }: { src?: string; alt?: string; onZoom: (img: { src: string; alt: string; type: "url" | "svg" }) => void }) {
    const [imgError, setImgError] = useState(false)
    if (imgError || !src) {
        return (
            <figure className="my-4">
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800">
                    <div>
                        <ImageIcon className="mx-auto size-10 text-gray-400" />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{alt || "Image unavailable"}</p>
                    </div>
                </div>
                {alt && <figcaption className="mt-1.5 text-center text-xs text-gray-500 dark:text-gray-400">{alt}</figcaption>}
            </figure>
        )
    }
    return (
        <figure className="my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt || ""}
                className="max-h-80 cursor-pointer rounded-lg border border-gray-200 shadow-sm transition-transform hover:scale-[1.02] hover:shadow-md dark:border-gray-700"
                loading="lazy"
                onClick={() => onZoom({ src, alt: alt || "", type: "url" })}
                onError={() => setImgError(true)}
            />
            {alt && (
                <figcaption className="mt-1.5 flex items-center justify-center gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
                    <ZoomIn className="size-3" /> Click to zoom &middot; {alt}
                </figcaption>
            )}
        </figure>
    )
}

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
    const [chatImages, setChatImages] = useState<Array<{ svg: string; altText: string; refinedPrompt: string; palette: string[] }>>([])
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; type: "url" | "svg" } | null>(null)
    const [lightboxZoom, setLightboxZoom] = useState(1)
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

    const loadCourseDesign = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveCourseId])

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
    }, [effectiveCourseId, loadCourseDesign])

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

    const isImageRequest = (text: string) => {
        const lower = text.toLowerCase()
        return /\b(create|generate|make|draw|design|show me)\b.{0,20}\b(image|picture|visual|diagram|flowchart|chart|infographic|illustration|svg)\b/i.test(lower)
            || /\b(image|picture|visual|diagram|flowchart|chart|infographic|illustration)\b.{0,20}\b(of|for|about|showing)\b/i.test(lower)
    }

    const detectImageStyle = (text: string): string => {
        const lower = text.toLowerCase()
        if (lower.includes("diagram") || lower.includes("flowchart") || lower.includes("flow chart")) return "diagram"
        if (lower.includes("infographic")) return "infographic"
        if (lower.includes("realistic") || lower.includes("photo")) return "photo-realistic"
        if (lower.includes("illustration") || lower.includes("cartoon")) return "illustration"
        return "academic"
    }

    const askAgent = async () => {
        if (!agentQuestion.trim()) return
        setIsAgentLoading(true)
        setAgentResponse("")
        setAgentProvider("")
        setAgentDuration(0)
        setChatImages([])

        const wantsImage = isImageRequest(agentQuestion)

        try {
            // If image request, generate image AND get text response in parallel
            const imagePromise = wantsImage
                ? fetch("/api/ai/generate-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        description: agentQuestion,
                        style: detectImageStyle(agentQuestion),
                    }),
                }).then(r => r.ok ? r.json() : null).catch(() => null)
                : Promise.resolve(null)

            const chatPromise = fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: agentQuestion }],
                }),
            })

            const [imageResult, chatRes] = await Promise.all([imagePromise, chatPromise])

            // Handle image result
            if (imageResult?.image) {
                setChatImages([imageResult.image])
            }

            // Handle chat response
            const contentType = chatRes.headers.get("content-type") || ""

            if (!chatRes.ok) {
                if (contentType.includes("application/json")) {
                    const errData = await chatRes.json().catch(() => null)
                    setAgentResponse(errData?.error || `Server error (${chatRes.status}). Please try again.`)
                } else {
                    setAgentResponse(`Server error (${chatRes.status}). Please try again.`)
                }
                return
            }

            if (!contentType.includes("application/json")) {
                setAgentResponse("Unexpected response from server. Please try again.")
                return
            }

            const data = await chatRes.json()
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
                                {/* Image generation prompts */}
                                {[
                                    "Create a diagram of Bloom's Taxonomy levels",
                                    "Generate a flowchart for flipped classroom model",
                                    "Design an infographic about active learning strategies",
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => { setAgentQuestion(prompt); }}
                                        className="flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs text-pink-700 transition-colors hover:border-pink-400 hover:bg-pink-100 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-300 dark:hover:bg-pink-950/50"
                                    >
                                        <ImageIcon className="size-3" />
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

                                {/* AI Generated Images */}
                                {chatImages.length > 0 && (
                                    <div className="border-b border-purple-100 px-5 py-4 dark:border-purple-900">
                                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-800 dark:text-purple-300">
                                            <Palette className="size-4" />
                                            Generated Images
                                        </h4>
                                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                                            {chatImages.map((img, idx) => (
                                                <div key={idx} className="group relative overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-purple-800 dark:bg-gray-900">
                                                    <div
                                                        className="flex cursor-pointer items-center justify-center bg-gray-50 p-4 dark:bg-gray-800"
                                                        onClick={() => setLightboxImage({ src: img.svg, alt: img.altText || "Generated image", type: "svg" })}
                                                        dangerouslySetInnerHTML={{ __html: img.svg }}
                                                    />
                                                    <div className="space-y-2 p-3">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{img.altText}</p>
                                                        {img.refinedPrompt && (
                                                            <p className="text-xs italic text-gray-500 dark:text-gray-400">&ldquo;{img.refinedPrompt}&rdquo;</p>
                                                        )}
                                                        {img.palette && img.palette.length > 0 && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs text-gray-400">Palette:</span>
                                                                {img.palette.map((color: string, ci: number) => (
                                                                    <div key={ci} className="size-4 rounded-full border border-gray-200 dark:border-gray-700" style={{ backgroundColor: color }} title={color} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className="flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                                                                onClick={() => setLightboxImage({ src: img.svg, alt: img.altText || "Generated image", type: "svg" })}
                                                            >
                                                                <ZoomIn className="size-3" /> View
                                                            </button>
                                                            <button
                                                                className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                                onClick={() => {
                                                                    const blob = new Blob([img.svg], { type: "image/svg+xml" })
                                                                    const url = URL.createObjectURL(blob)
                                                                    const a = document.createElement("a")
                                                                    a.href = url
                                                                    a.download = `genie-image-${idx + 1}.svg`
                                                                    a.click()
                                                                    URL.revokeObjectURL(url)
                                                                }}
                                                            >
                                                                <Download className="size-3" /> Download SVG
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Markdown Response Body */}
                                <ScrollArea className="max-h-[600px]">
                                    <div className="px-5 py-4 text-[13px] leading-relaxed text-gray-800 dark:text-gray-200">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ children }) => (
                                                    <h1 className="mb-3 mt-5 border-b border-purple-200 pb-2 text-xl font-bold text-purple-900 first:mt-0 dark:border-purple-800 dark:text-purple-300">{children}</h1>
                                                ),
                                                h2: ({ children }) => (
                                                    <h2 className="mb-2 mt-5 border-b border-purple-100 pb-1.5 text-base font-bold text-purple-900 first:mt-0 dark:border-purple-800 dark:text-purple-300">{children}</h2>
                                                ),
                                                h3: ({ children }) => (
                                                    <h3 className="mb-1.5 mt-4 text-sm font-semibold text-purple-800 dark:text-purple-300">{children}</h3>
                                                ),
                                                h4: ({ children }) => (
                                                    <h4 className="mb-1 mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200">{children}</h4>
                                                ),
                                                p: ({ children }) => (
                                                    <p className="my-2 text-[13px] leading-relaxed">{children}</p>
                                                ),
                                                strong: ({ children }) => (
                                                    <strong className="font-semibold text-purple-800 dark:text-purple-300">{children}</strong>
                                                ),
                                                em: ({ children }) => (
                                                    <em className="text-gray-600 dark:text-gray-400">{children}</em>
                                                ),
                                                ul: ({ children }) => (
                                                    <ul className="my-2 ml-4 list-disc space-y-0.5 text-[13px]">{children}</ul>
                                                ),
                                                ol: ({ children }) => (
                                                    <ol className="my-2 ml-4 list-decimal space-y-0.5 text-[13px]">{children}</ol>
                                                ),
                                                li: ({ children }) => (
                                                    <li className="text-[13px] leading-relaxed">{children}</li>
                                                ),
                                                blockquote: ({ children }) => (
                                                    <blockquote className="border-l-3 my-3 rounded-r-md border-purple-400 bg-purple-50/60 py-2 pl-4 pr-3 text-[13px] italic text-purple-800 dark:border-purple-600 dark:bg-purple-950/30 dark:text-purple-200">
                                                        {children}
                                                    </blockquote>
                                                ),
                                                code: ({ className, children }) => {
                                                    const isBlock = className?.includes("language-")
                                                    if (isBlock) {
                                                        return (
                                                            <pre className="my-3 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-900">
                                                                <code className="text-xs">{children}</code>
                                                            </pre>
                                                        )
                                                    }
                                                    return (
                                                        <code className="rounded bg-purple-100/60 px-1.5 py-0.5 font-mono text-xs text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                                            {children}
                                                        </code>
                                                    )
                                                },
                                                pre: ({ children }) => <>{children}</>,
                                                table: ({ children }) => (
                                                    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <table className="w-full border-collapse text-[12px]">{children}</table>
                                                    </div>
                                                ),
                                                thead: ({ children }) => (
                                                    <thead className="bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200">{children}</thead>
                                                ),
                                                tbody: ({ children }) => (
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>
                                                ),
                                                tr: ({ children }) => (
                                                    <tr className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">{children}</tr>
                                                ),
                                                th: ({ children }) => (
                                                    <th className="border-b border-purple-200 px-3 py-2 text-left text-xs font-semibold dark:border-purple-800">{children}</th>
                                                ),
                                                td: ({ children }) => (
                                                    <td className="px-3 py-2 text-[12px]">{children}</td>
                                                ),
                                                img: (props) => <ChatImage src={props.src} alt={props.alt} onZoom={(img) => setLightboxImage(img)} />,
                                                a: ({ href, children }) => (
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline decoration-purple-300 underline-offset-2 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                                                        {children}
                                                    </a>
                                                ),
                                                hr: () => <hr className="my-5 border-gray-200 dark:border-gray-700" />,
                                            }}
                                        >
                                            {agentResponse}
                                        </ReactMarkdown>
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

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => { setLightboxImage(null); setLightboxZoom(1) }}>
                    <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        {/* Controls */}
                        <div className="absolute -top-12 right-0 flex items-center gap-2">
                            <button
                                className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                                onClick={() => setLightboxZoom((z) => Math.max(0.25, z - 0.25))}
                                title="Zoom out"
                            >
                                <ZoomOut className="size-5" />
                            </button>
                            <span className="min-w-12 text-center text-sm text-white">{Math.round(lightboxZoom * 100)}%</span>
                            <button
                                className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                                onClick={() => setLightboxZoom((z) => Math.min(4, z + 0.25))}
                                title="Zoom in"
                            >
                                <ZoomIn className="size-5" />
                            </button>
                            <button
                                className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                                onClick={() => {
                                    if (lightboxImage.type === "svg") {
                                        const blob = new Blob([lightboxImage.src], { type: "image/svg+xml" })
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement("a")
                                        a.href = url
                                        a.download = "genie-image.svg"
                                        a.click()
                                        URL.revokeObjectURL(url)
                                    } else {
                                        const a = document.createElement("a")
                                        a.href = lightboxImage.src
                                        a.download = "genie-image.png"
                                        a.target = "_blank"
                                        a.click()
                                    }
                                }}
                                title="Download"
                            >
                                <Download className="size-5" />
                            </button>
                            <button
                                className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                                onClick={() => { setLightboxImage(null); setLightboxZoom(1) }}
                                title="Close"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        {/* Image */}
                        <div className="overflow-auto rounded-lg bg-white p-2 shadow-2xl dark:bg-gray-900" style={{ maxHeight: "85vh", maxWidth: "85vw" }}>
                            <div style={{ transform: `scale(${lightboxZoom})`, transformOrigin: "top left", transition: "transform 0.2s ease" }}>
                                {lightboxImage.type === "svg" ? (
                                    <div dangerouslySetInnerHTML={{ __html: lightboxImage.src }} />
                                ) : (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={lightboxImage.src} alt={lightboxImage.alt} className="max-w-none" />
                                )}
                            </div>
                        </div>
                        {lightboxImage.alt && (
                            <p className="mt-2 text-center text-sm text-white/70">{lightboxImage.alt}</p>
                        )}
                    </div>
                </div>
            )}
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