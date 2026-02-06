"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    BookOpen,
    Target,
    GraduationCap,
    FileText,
    Star,
    ArrowRight,
    CheckCircle2,
    Clock,
    MessageCircle,
    Zap,
    Send,
    Layout,
    Monitor
} from "lucide-react"
import Link from "next/link"

function CourseDesignStudioContent() {
    const searchParams = useSearchParams()
    const courseIdParam = searchParams.get('courseId')
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
    const router = useRouter()

    // Load completed tools from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('completedDesignTools')
        if (saved) {
            setCompletedTools(JSON.parse(saved))
        }
    }, [])

    // Load latest course when no courseId is provided
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

    const effectiveCourseId = courseId || defaultCourseId

    const aiFeatures = [
        {
            id: "objectives",
            title: "Generate Objectives",
            description: "AI-crafted learning goals aligned with Bloom's Taxonomy",
            icon: Target,
            color: "blue",
            href: "/dashboard/generate-objectives",
            estimatedTime: "5 min"
        },
        {
            id: "curriculum",
            title: "Suggest Curriculum",
            description: "Week-by-week course structure recommendations",
            icon: BookOpen,
            color: "green",
            href: "/dashboard/suggest-curriculum",
            estimatedTime: "8 min"
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
            requiresCourse: true
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
            requiresCourse: true
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
            requiresCourse: true
        },
        {
            id: "assessments",
            title: "Design Assessments",
            description: "Smart assignment creation with rubrics",
            icon: GraduationCap,
            color: "purple",
            href: "/dashboard/design-assessments",
            estimatedTime: "10 min"
        },
        {
            id: "syllabus",
            title: "Create Syllabus",
            description: "Complete syllabus with policies and resources",
            icon: FileText,
            color: "orange",
            href: "/dashboard/create-syllabus",
            estimatedTime: "12 min"
        }
    ]

    const progress = (completedTools.length / aiFeatures.length) * 100

    const askAgent = async () => {
        if (!agentQuestion.trim()) return
        setIsAgentLoading(true)
        setAgentResponse("")

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: agentQuestion }]
                })
            })
            const data = await res.json()
            setAgentResponse(data.content || data.message || "I can help you with course design!")
        } catch (error) {
            setAgentResponse("Sorry, I'm having trouble connecting. Please try again.")
        } finally {
            setIsAgentLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-7xl flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
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
                    {!effectiveCourseId && isCourseIdLoading && (
                        <Badge variant="outline" className="mt-2">
                            Loading courses...
                        </Badge>
                    )}
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    <div className="space-y-1">
                        <label className="text-muted-foreground text-xs font-medium">Difficulty Level</label>
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

            {/* Ask Agent Panel */}
            {showAskAgent && (
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="size-5 text-purple-600" />
                            Ask Professor GENIE
                        </CardTitle>
                        <CardDescription>
                            Your AI teaching assistant for instant course design help
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Ask anything about course design... e.g., 'What's the best way to structure a 12-week programming course?' or 'How do I design assessments for Bloom's higher-order thinking?'"
                            value={agentQuestion}
                            onChange={(e) => setAgentQuestion(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <Button
                            onClick={askAgent}
                            disabled={isAgentLoading || !agentQuestion.trim()}
                            className="w-full"
                        >
                            {isAgentLoading ? (
                                <>
                                    <span className="mr-2 animate-spin">Loading...</span>
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 size-4" />
                                    Ask Agent
                                </>
                            )}
                        </Button>
                        {agentResponse && (
                            <Alert className="bg-white dark:bg-gray-900">
                                <Zap className="size-4" />
                                <AlertDescription className="mt-2">
                                    {agentResponse}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Progress Section */}
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

            {/* AI Features Grid */}
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
                        indigo: "border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:shadow-indigo-200"
                    }[feature.color]
                    const card = (
                        <Card
                            className={`border-l-4 ${colorClasses} relative h-full transition-all hover:shadow-lg ${isHovered ? 'scale-[1.02]' : ''} ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
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
                                    <Icon className={`text- size-8${feature.color}-600 ${isHovered ? 'scale-110' : ''} transition-transform`} />
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

            {/* How It Works */}
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
        </div>
    )
}

export default function CourseDesignStudioPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse">Loading course design studio...</div>
            </div>
        }>
            <CourseDesignStudioContent />
        </Suspense>
    )
}