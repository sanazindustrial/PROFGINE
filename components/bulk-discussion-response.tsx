"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Copy,
    RefreshCw,
    Globe,
    Users,
    Download,
    CheckCircle,
    XCircle,
    Loader2,
    FileText,
    Zap,
    LogIn,
    Settings2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { getChatEndpoint } from "@/hooks/use-user-ai"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface StudentPost {
    id: string
    studentName: string
    content: string
    timestamp?: string
}

interface ResponseResult {
    studentId: string
    studentName: string
    originalPost: string
    aiResponse: string
    provider: string
    status: "pending" | "generating" | "completed" | "error"
    error?: string
}

interface BulkDiscussionResponseProps {
    initialContent?: string | null
}

export function BulkDiscussionResponse({ initialContent }: BulkDiscussionResponseProps) {
    const [webUrl, setWebUrl] = useState("")
    const [rawContent, setRawContent] = useState(initialContent || "")
    const [professorProfile, setProfessorProfile] = useState("")
    const [discussionTopic, setDiscussionTopic] = useState("")
    const [studentPosts, setStudentPosts] = useState<StudentPost[]>([])
    const [responses, setResponses] = useState<ResponseResult[]>([])
    const [isScanning, setIsScanning] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [scanMode, setScanMode] = useState<"url" | "paste">("paste")
    const [scanError, setScanError] = useState<string | null>(null)
    const [showCustomization, setShowCustomization] = useState(false)

    // Customization options
    const [responseTone, setResponseTone] = useState("professional")
    const [responseLength, setResponseLength] = useState("moderate")
    const [includeFollowUp, setIncludeFollowUp] = useState(true)
    const [includeEncouragement, setIncludeEncouragement] = useState(true)
    const [includeQuestions, setIncludeQuestions] = useState(false)
    const [formalityLevel, setFormalityLevel] = useState("formal")

    // Load professor profile from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("professorProfile")
        if (stored) setProfessorProfile(stored)
    }, [])

    // Handle initialContent from bookmarklet
    useEffect(() => {
        if (initialContent) {
            setRawContent(initialContent)
            setScanMode("paste")
        }
    }, [initialContent])

    const scanWebPage = useCallback(async () => {
        if (scanMode === "url" && !webUrl.trim()) {
            toast({ title: "Enter URL", description: "Please enter a URL to scan", variant: "destructive" })
            return
        }
        if (scanMode === "paste" && !rawContent.trim()) {
            toast({ title: "Enter Content", description: "Please paste discussion content", variant: "destructive" })
            return
        }

        setIsScanning(true)
        setStudentPosts([])
        setResponses([])
        setScanError(null)

        try {
            const res = await fetch("/api/discussion/scan-web", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    scanMode === "url" ? { url: webUrl } : { rawContent }
                ),
            })

            // Check for redirect (authentication required)
            if (res.redirected || res.status === 307 || res.status === 302) {
                throw new Error("Please sign in to scan content. Your session may have expired.")
            }

            // Check content type
            const contentType = res.headers.get("content-type") || ""
            if (!contentType.includes("application/json")) {
                throw new Error("Please sign in to use this feature. Click 'Sign In' in the navigation.")
            }

            const data = await res.json()

            // Handle login required / auth errors with helpful messaging
            if (data.requiresAuth || data.error === 'Login required') {
                setScanError(null)
                toast({
                    title: `${data.lmsName || 'LMS'} Login Required`,
                    description: data.suggestion || "Please paste the discussion content manually instead.",
                    variant: "destructive",
                })
                // Switch to paste mode automatically
                setScanMode("paste")
                return
            }

            if (!res.ok) throw new Error(data.message || data.error || "Failed to scan")

            // Check if no posts found with suggestion
            if (data.posts?.length === 0 && data.suggestion) {
                toast({
                    title: "No Posts Found",
                    description: data.suggestion,
                    variant: "destructive",
                })
                setScanMode("paste")
                return
            }

            setStudentPosts(data.posts || [])
            toast({
                title: "Scan Complete",
                description: `Found ${data.posts?.length || 0} student posts`,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Failed to scan content"
            setScanError(errMsg)
            toast({
                title: "Scan Failed",
                description: errMsg,
                variant: "destructive",
            })
        } finally {
            setIsScanning(false)
        }
    }, [webUrl, rawContent, scanMode])

    const generateAllResponses = useCallback(async () => {
        if (!professorProfile.trim() || !discussionTopic.trim()) {
            toast({
                title: "Missing Information",
                description: "Please fill in professor profile and discussion topic",
                variant: "destructive",
            })
            return
        }

        if (studentPosts.length === 0) {
            toast({
                title: "No Students",
                description: "Please scan for student posts first",
                variant: "destructive",
            })
            return
        }

        setIsGenerating(true)
        setProgress(0)

        // Initialize responses
        const initialResponses: ResponseResult[] = studentPosts.map((post) => ({
            studentId: post.id,
            studentName: post.studentName,
            originalPost: post.content,
            aiResponse: "",
            provider: "",
            status: "pending",
        }))
        setResponses(initialResponses)

        // Generate responses one by one
        for (let i = 0; i < studentPosts.length; i++) {
            const post = studentPosts[i]

            // Update status to generating
            setResponses((prev) =>
                prev.map((r) =>
                    r.studentId === post.id ? { ...r, status: "generating" } : r
                )
            )

            try {
                // Build customization instructions
                const toneMap: Record<string, string> = {
                    professional: "Use a professional and academic tone",
                    friendly: "Use a warm, friendly, and approachable tone",
                    encouraging: "Use an encouraging and supportive tone that motivates the student",
                    strict: "Use a firm and direct tone that emphasizes academic standards",
                    conversational: "Use a conversational and casual academic tone"
                }

                const lengthMap: Record<string, string> = {
                    brief: "Keep the response brief and concise (2-3 sentences)",
                    moderate: "Provide a moderate length response (4-6 sentences)",
                    detailed: "Provide a detailed and comprehensive response (7+ sentences)"
                }

                const formalityMap: Record<string, string> = {
                    formal: "Maintain formal academic language",
                    semiformal: "Use semi-formal language that balances professionalism with accessibility",
                    casual: "Use casual but respectful language"
                }

                const customizationInstructions = [
                    toneMap[responseTone],
                    lengthMap[responseLength],
                    formalityMap[formalityLevel],
                    includeEncouragement ? "Include words of encouragement and positive feedback" : "",
                    includeFollowUp ? "Include a follow-up comment or suggestion for further thought" : "",
                    includeQuestions ? "Include a thought-provoking question to extend the discussion" : ""
                ].filter(Boolean).join(". ")

                const content = `Professor Writing Style and Background:
${professorProfile}

Discussion Topic:
${discussionTopic}

Student's Post (${post.studentName}):
${post.content}

Response Guidelines: ${customizationInstructions}

Professor's Response to this student:`

                const res = await fetch(getChatEndpoint(false), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: [{ role: "user", content }] }),
                })

                // Check for redirect (authentication required)
                if (res.redirected || res.status === 307 || res.status === 302) {
                    throw new Error("Please sign in to generate AI responses.")
                }

                // Check content type
                const contentType = res.headers.get("content-type") || ""
                if (!contentType.includes("application/json")) {
                    throw new Error("Authentication required. Please sign in.")
                }

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Failed to generate")

                // Update with successful response
                setResponses((prev) =>
                    prev.map((r) =>
                        r.studentId === post.id
                            ? {
                                ...r,
                                aiResponse: data.content || data.message || "",
                                provider: data.provider || "",
                                status: "completed",
                            }
                            : r
                    )
                )
            } catch (error) {
                setResponses((prev) =>
                    prev.map((r) =>
                        r.studentId === post.id
                            ? {
                                ...r,
                                status: "error",
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Generation failed",
                            }
                            : r
                    )
                )
            }

            setProgress(((i + 1) / studentPosts.length) * 100)
        }

        setIsGenerating(false)
        toast({
            title: "Generation Complete",
            description: `Generated responses for ${studentPosts.length} students`,
        })
    }, [professorProfile, discussionTopic, studentPosts, responseTone, responseLength, formalityLevel, includeEncouragement, includeFollowUp, includeQuestions])

    const copyAllResponses = useCallback(() => {
        const completedResponses = responses.filter((r) => r.status === "completed")
        if (completedResponses.length === 0) {
            toast({ title: "No responses to copy", variant: "destructive" })
            return
        }

        const text = completedResponses
            .map(
                (r) =>
                    `--- Response to ${r.studentName} ---\n\n${r.aiResponse}\n\n`
            )
            .join("\n")

        navigator.clipboard.writeText(text)
        toast({ title: "Copied!", description: `${completedResponses.length} responses copied to clipboard` })
    }, [responses])

    const exportAsCSV = useCallback(() => {
        const completedResponses = responses.filter((r) => r.status === "completed")
        if (completedResponses.length === 0) {
            toast({ title: "No responses to export", variant: "destructive" })
            return
        }

        const headers = ["Student Name", "Original Post", "AI Response"]
        const rows = completedResponses.map((r) => [
            r.studentName,
            `"${r.originalPost.replace(/"/g, '""')}"`,
            `"${r.aiResponse.replace(/"/g, '""')}"`,
        ])

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `discussion-responses-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)

        toast({ title: "Exported!", description: "Responses downloaded as CSV" })
    }, [responses])

    const completedCount = responses.filter((r) => r.status === "completed").length
    const errorCount = responses.filter((r) => r.status === "error").length

    return (
        <div className="space-y-6">
            {/* Scan Mode Toggle */}
            <div className="flex gap-2">
                <Button
                    variant={scanMode === "paste" ? "default" : "outline"}
                    onClick={() => setScanMode("paste")}
                    size="sm"
                >
                    <FileText className="mr-2 size-4" />
                    Paste Content
                </Button>
                <Button
                    variant={scanMode === "url" ? "default" : "outline"}
                    onClick={() => setScanMode("url")}
                    size="sm"
                >
                    <Globe className="mr-2 size-4" />
                    Scan URL
                </Button>
            </div>

            {/* Scan Error Display */}
            {scanError && (
                <Alert variant="destructive" className="border-red-300 dark:border-red-800">
                    <XCircle className="size-4" />
                    <AlertTitle>Scan Failed</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{scanError}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScanError(null)}
                            className="ml-4 shrink-0"
                        >
                            Dismiss
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Input Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Professor Profile + Topic */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Professor Profile</CardTitle>
                            <CardDescription>Your teaching style for responses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[100px]"
                                placeholder="Describe your teaching style, response preferences..."
                                value={professorProfile}
                                onChange={(e) => setProfessorProfile(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Discussion Topic</CardTitle>
                            <CardDescription>The original discussion prompt</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[80px]"
                                placeholder="Enter the discussion topic or question..."
                                value={discussionTopic}
                                onChange={(e) => setDiscussionTopic(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: URL/Content Scanner */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {scanMode === "url" ? (
                                <Globe className="size-5 text-blue-600" />
                            ) : (
                                <FileText className="size-5 text-green-600" />
                            )}
                            {scanMode === "url" ? "Web Scanner" : "Paste Discussion Content"}
                        </CardTitle>
                        <CardDescription>
                            {scanMode === "url"
                                ? "Enter the URL of the discussion page to scan"
                                : "Paste multiple student discussions (separated by Student names or 'Re:')"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {scanMode === "url" ? (
                            <>
                                <Input
                                    placeholder="https://your-lms.com/discussion/..."
                                    value={webUrl}
                                    onChange={(e) => setWebUrl(e.target.value)}
                                />
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                                    <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                                        📌 URL scanning only works for public pages
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Protected LMS pages (Moodle, Canvas, Blackboard) require your browser session.
                                        Since our server cannot access your login cookies, use one of these methods:
                                    </p>
                                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-700 dark:text-amber-300">
                                        <li><strong>Quick:</strong> Open discussion in browser → Select all (Ctrl+A) → Copy (Ctrl+C) → Use &quot;Paste Content&quot; tab</li>
                                        <li><strong>Bookmarklet:</strong> Drag this to your bookmarks bar: <a
                                            href="javascript:(function(){var t=document.body.innerText;var w=window.open('https://profgenie.ai/discussion?content='+encodeURIComponent(t.substring(0,50000)),'_blank');})();"
                                            className="inline-block rounded bg-amber-600 px-2 py-0.5 text-white hover:bg-amber-700"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toast({
                                                    title: "Drag to Bookmark Bar",
                                                    description: "Drag this link to your bookmarks bar, then click it while on your LMS discussion page",
                                                });
                                            }}
                                            draggable="true"
                                        >📋 Grab Posts</a></li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <Textarea
                                className="min-h-[150px]"
                                placeholder="Paste all student discussion posts here...

Example format:
Student 1: John Smith
This is my response to the discussion topic...

Student 2: Jane Doe
Here is my analysis of the topic..."
                                value={rawContent}
                                onChange={(e) => setRawContent(e.target.value)}
                            />
                        )}
                        <Button
                            onClick={scanWebPage}
                            disabled={isScanning}
                            className="w-full"
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <Users className="mr-2 size-4" />
                                    Find Student Posts
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Response Customization */}
            <Card className="border-dashed transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings2 className="size-5 text-indigo-600" />
                            <CardTitle className="text-base">Response Customization</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCustomization(!showCustomization)}
                        >
                            {showCustomization ? "Hide Options" : "Customize"}
                        </Button>
                    </div>
                    <CardDescription className="text-sm">
                        Adjust tone, length, and style for all generated responses
                    </CardDescription>
                </CardHeader>
                {showCustomization && (
                    <CardContent className="space-y-6 pt-4">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Response Tone */}
                            <div className="space-y-2">
                                <Label htmlFor="bulk-tone">Response Tone</Label>
                                <Select value={responseTone} onValueChange={setResponseTone}>
                                    <SelectTrigger id="bulk-tone">
                                        <SelectValue placeholder="Select tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="friendly">Friendly</SelectItem>
                                        <SelectItem value="encouraging">Encouraging</SelectItem>
                                        <SelectItem value="strict">Strict</SelectItem>
                                        <SelectItem value="conversational">Conversational</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Response Length */}
                            <div className="space-y-2">
                                <Label htmlFor="bulk-length">Response Length</Label>
                                <Select value={responseLength} onValueChange={setResponseLength}>
                                    <SelectTrigger id="bulk-length">
                                        <SelectValue placeholder="Select length" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="brief">Brief (2-3 sentences)</SelectItem>
                                        <SelectItem value="moderate">Moderate (4-6 sentences)</SelectItem>
                                        <SelectItem value="detailed">Detailed (7+ sentences)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Formality Level */}
                            <div className="space-y-2">
                                <Label htmlFor="bulk-formality">Formality Level</Label>
                                <Select value={formalityLevel} onValueChange={setFormalityLevel}>
                                    <SelectTrigger id="bulk-formality">
                                        <SelectValue placeholder="Select formality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="formal">Formal Academic</SelectItem>
                                        <SelectItem value="semiformal">Semi-formal</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Toggle Options */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="bulk-encouragement" className="text-sm font-medium">Include Encouragement</Label>
                                    <p className="text-xs text-muted-foreground">Add positive feedback</p>
                                </div>
                                <Switch
                                    id="bulk-encouragement"
                                    checked={includeEncouragement}
                                    onCheckedChange={setIncludeEncouragement}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="bulk-followup" className="text-sm font-medium">Include Follow-up</Label>
                                    <p className="text-xs text-muted-foreground">Add suggestions for improvement</p>
                                </div>
                                <Switch
                                    id="bulk-followup"
                                    checked={includeFollowUp}
                                    onCheckedChange={setIncludeFollowUp}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="bulk-questions" className="text-sm font-medium">Ask Questions</Label>
                                    <p className="text-xs text-muted-foreground">Include discussion questions</p>
                                </div>
                                <Switch
                                    id="bulk-questions"
                                    checked={includeQuestions}
                                    onCheckedChange={setIncludeQuestions}
                                />
                            </div>
                        </div>

                        {/* Current Settings Summary */}
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{responseTone}</Badge>
                            <Badge variant="secondary">{responseLength}</Badge>
                            <Badge variant="secondary">{formalityLevel}</Badge>
                            {includeEncouragement && <Badge variant="outline">+ encouragement</Badge>}
                            {includeFollowUp && <Badge variant="outline">+ follow-up</Badge>}
                            {includeQuestions && <Badge variant="outline">+ questions</Badge>}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Found Students */}
            {studentPosts.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="size-5 text-purple-600" />
                                    Found {studentPosts.length} Student Posts
                                </CardTitle>
                                <CardDescription>
                                    Review and generate AI responses for all students
                                </CardDescription>
                            </div>
                            <Button
                                onClick={generateAllResponses}
                                disabled={isGenerating || !professorProfile.trim() || !discussionTopic.trim()}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 size-4" />
                                        Generate All Responses
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {studentPosts.map((post, idx) => {
                                const response = responses.find(
                                    (r) => r.studentId === post.id
                                )
                                return (
                                    <div
                                        key={post.id}
                                        className="rounded-lg border p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                {idx + 1}. {post.studentName}
                                            </span>
                                            {response && (
                                                <Badge
                                                    variant={
                                                        response.status === "completed"
                                                            ? "default"
                                                            : response.status === "error"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                >
                                                    {response.status === "completed" && (
                                                        <CheckCircle className="mr-1 size-3" />
                                                    )}
                                                    {response.status === "error" && (
                                                        <XCircle className="mr-1 size-3" />
                                                    )}
                                                    {response.status === "generating" && (
                                                        <Loader2 className="mr-1 size-3 animate-spin" />
                                                    )}
                                                    {response.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                            {post.content.substring(0, 150)}...
                                        </p>
                                        {response?.status === "error" && response.error && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                Error: {response.error}
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Progress & Results */}
            {isGenerating && (
                <Card>
                    <CardContent className="py-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Generating responses...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generated Responses */}
            {responses.filter((r) => r.status === "completed" || r.status === "error").length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="size-5 text-yellow-500" />
                                    Generated Responses
                                    <Badge variant="outline" className="ml-2">
                                        {completedCount} completed
                                        {errorCount > 0 && `, ${errorCount} failed`}
                                    </Badge>
                                </CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={copyAllResponses}>
                                    <Copy className="mr-2 size-4" />
                                    Copy All
                                </Button>
                                <Button variant="outline" size="sm" onClick={exportAsCSV}>
                                    <Download className="mr-2 size-4" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {responses
                            .filter((r) => r.status === "error")
                            .map((response) => (
                                <Card key={response.studentId} className="border-dashed border-red-300 dark:border-red-700">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                                                Failed: {response.studentName}
                                            </CardTitle>
                                            <Badge variant="destructive" className="text-xs">
                                                Error
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {response.error || "Generation failed"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        {responses
                            .filter((r) => r.status === "completed")
                            .map((response) => (
                                <Card key={response.studentId} className="border-dashed">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">
                                                Response to {response.studentName}
                                            </CardTitle>
                                            <Badge variant="secondary" className="text-xs">
                                                {response.provider}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            className="min-h-[100px] resize-none"
                                            value={response.aiResponse}
                                            onChange={(e) =>
                                                setResponses((prev) =>
                                                    prev.map((r) =>
                                                        r.studentId === response.studentId
                                                            ? { ...r, aiResponse: e.target.value }
                                                            : r
                                                    )
                                                )
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
