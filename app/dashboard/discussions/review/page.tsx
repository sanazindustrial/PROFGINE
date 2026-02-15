"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
    Zap,
    CheckCircle,
    Clock,
    Edit,
    ThumbsUp,
    RefreshCw,
    ArrowLeft,
    MessageSquare,
    User,
    Star,
    ChevronDown,
    ChevronUp,
    Save,
    Send
} from "lucide-react"
import Link from "next/link"

interface FeedbackItem {
    id: string;
    postId: string;
    studentName: string;
    studentEmail: string;
    studentPost: string;
    aiFeedback: string;
    aiScore: number | null;
    aiStrengths: string[];
    aiImprovements: string[];
    professorEdits: string | null;
    finalFeedback: string | null;
    finalScore: number | null;
    isApproved: boolean;
    createdAt: string;
}

interface ThreadWithFeedback {
    thread: {
        id: string;
        title: string;
        prompt: string | null;
        course: {
            id: string;
            title: string;
            code: string | null;
        };
    };
    feedbackItems: FeedbackItem[];
    stats: {
        total: number;
        reviewed: number;
        approved: number;
        pending: number;
    };
}

interface PostsToReview {
    postId: string;
    studentName: string;
    studentPost: string;
}

export default function BulkReviewPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preselectedThread = searchParams.get("thread")

    const [threads, setThreads] = useState<ThreadWithFeedback[]>([])
    const [selectedThread, setSelectedThread] = useState<string | null>(preselectedThread)
    const [selectedPosts, setSelectedPosts] = useState<string[]>([])
    const [postsToReview, setPostsToReview] = useState<PostsToReview[]>([])
    const [feedbackResults, setFeedbackResults] = useState<FeedbackItem[]>([])
    const [expandedFeedback, setExpandedFeedback] = useState<string[]>([])
    const [editedFeedback, setEditedFeedback] = useState<Record<string, { text: string, score: number }>>({})

    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isApproving, setIsApproving] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [activeTab, setActiveTab] = useState("select")

    // Load threads with review stats
    const loadThreads = useCallback(async () => {
        try {
            const res = await fetch("/api/discussions/bulk-review")
            if (!res.ok) throw new Error("Failed to load threads")
            const data = await res.json()
            setThreads(data.threads || [])
        } catch (error) {
            console.error("Load threads error:", error)
            toast({
                title: "Error",
                description: "Failed to load discussion threads",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadThreads()
    }, [loadThreads])

    // Load posts when thread is selected
    useEffect(() => {
        if (selectedThread) {
            const thread = threads.find(t => t.thread.id === selectedThread)
            if (thread && thread.feedbackItems.length > 0) {
                // Show existing feedback results
                setFeedbackResults(thread.feedbackItems)
                setActiveTab("review")
            }
        }
    }, [selectedThread, threads])

    // Generate AI feedback for selected posts
    const generateFeedback = async () => {
        if (!selectedThread || selectedPosts.length === 0) {
            toast({
                title: "Select Posts",
                description: "Please select at least one post to review",
                variant: "destructive"
            })
            return
        }

        setIsGenerating(true)
        setGenerationProgress(0)

        try {
            const res = await fetch("/api/discussions/bulk-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId: selectedThread,
                    postIds: selectedPosts
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to generate feedback")
            }

            const data = await res.json()
            setFeedbackResults(data.results)
            setGenerationProgress(100)
            setActiveTab("review")

            toast({
                title: "Feedback Generated",
                description: `AI feedback generated for ${data.results.length} posts`
            })

            // Refresh threads to update stats
            await loadThreads()

        } catch (error: any) {
            console.error("Generate feedback error:", error)
            toast({
                title: "Generation Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsGenerating(false)
        }
    }

    // Approve selected feedback
    const approveFeedback = async (feedbackIds: string[]) => {
        if (feedbackIds.length === 0) return

        setIsApproving(true)

        try {
            // Apply any pending edits first
            for (const id of feedbackIds) {
                if (editedFeedback[id]) {
                    await fetch(`/api/discussions/feedback/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            professorEdits: editedFeedback[id].text,
                            finalFeedback: editedFeedback[id].text,
                            finalScore: editedFeedback[id].score,
                            isApproved: true
                        })
                    })
                }
            }

            // Bulk approve
            const res = await fetch("/api/discussions/feedback/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedbackIds, action: "approve" })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to approve feedback")
            }

            const data = await res.json()

            toast({
                title: "Feedback Approved",
                description: data.message
            })

            // Update local state
            setFeedbackResults(prev => prev.map(f =>
                feedbackIds.includes(f.id) ? { ...f, isApproved: true } : f
            ))

            // Clear edited feedback for approved items
            const newEdited = { ...editedFeedback }
            feedbackIds.forEach(id => delete newEdited[id])
            setEditedFeedback(newEdited)

            // Refresh threads
            await loadThreads()

        } catch (error: any) {
            console.error("Approve error:", error)
            toast({
                title: "Approval Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsApproving(false)
        }
    }

    // Toggle feedback expansion
    const toggleExpanded = (id: string) => {
        setExpandedFeedback(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Handle editing feedback
    const handleEditFeedback = (id: string, text: string, score: number) => {
        setEditedFeedback(prev => ({
            ...prev,
            [id]: { text, score }
        }))
    }

    // Get current thread data
    const currentThread = selectedThread
        ? threads.find(t => t.thread.id === selectedThread)
        : null

    // Pending feedback (not yet approved)
    const pendingFeedback = feedbackResults.filter(f => !f.isApproved)
    const approvedFeedback = feedbackResults.filter(f => f.isApproved)

    if (isLoading) {
        return (
            <div className="container mx-auto py-12 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/discussions">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Bulk AI Review</h1>
                        <p className="text-muted-foreground">
                            Generate and review AI feedback for student discussion posts
                        </p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="select">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Select Posts
                    </TabsTrigger>
                    <TabsTrigger value="review">
                        <Star className="mr-2 h-4 w-4" />
                        Review Feedback
                        {pendingFeedback.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {pendingFeedback.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approved
                        {approvedFeedback.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {approvedFeedback.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Select Posts Tab */}
                <TabsContent value="select" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Discussion Thread</CardTitle>
                            <CardDescription>
                                Choose a discussion thread to review student posts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select
                                value={selectedThread || ""}
                                onValueChange={setSelectedThread}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a discussion thread" />
                                </SelectTrigger>
                                <SelectContent>
                                    {threads.map(t => (
                                        <SelectItem key={t.thread.id} value={t.thread.id}>
                                            {t.thread.course.code && `${t.thread.course.code} - `}
                                            {t.thread.title}
                                            <span className="ml-2 text-muted-foreground">
                                                ({t.stats.pending} pending)
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {currentThread && (
                                <div className="space-y-4">
                                    <Alert>
                                        <AlertDescription>
                                            <strong>{currentThread.thread.title}</strong>
                                            <p className="mt-2 text-sm">{currentThread.thread.prompt}</p>
                                            <div className="mt-2 flex gap-4 text-sm">
                                                <span>Total: {currentThread.stats.total}</span>
                                                <span className="text-amber-600">Pending: {currentThread.stats.pending}</span>
                                                <span className="text-green-600">Approved: {currentThread.stats.approved}</span>
                                            </div>
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Select Posts to Review</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const pendingIds = currentThread.feedbackItems
                                                        .filter(f => !f.isApproved)
                                                        .map(f => f.postId)
                                                    setSelectedPosts(pendingIds)
                                                }}
                                            >
                                                Select All Pending
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedPosts([])}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>

                                    {currentThread.feedbackItems.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-8 text-center text-muted-foreground">
                                                No student posts in this thread yet.
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {currentThread.feedbackItems.map(item => (
                                                <div
                                                    key={item.postId}
                                                    className={`p-4 border rounded-lg ${selectedPosts.includes(item.postId)
                                                        ? 'border-primary bg-primary/5'
                                                        : ''
                                                        }`}
                                                >
                                                    <label className="flex items-start gap-3 cursor-pointer">
                                                        <Checkbox
                                                            checked={selectedPosts.includes(item.postId)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedPosts([...selectedPosts, item.postId])
                                                                } else {
                                                                    setSelectedPosts(selectedPosts.filter(id => id !== item.postId))
                                                                }
                                                            }}
                                                            disabled={item.isApproved}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4" />
                                                                <span className="font-medium">{item.studentName}</span>
                                                                {item.isApproved && (
                                                                    <Badge variant="default" className="text-xs">
                                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                                        Approved
                                                                    </Badge>
                                                                )}
                                                                {item.aiFeedback && !item.isApproved && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        <Star className="mr-1 h-3 w-3" />
                                                                        AI Reviewed
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                {item.studentPost}
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedPosts.length > 0 && (
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <span className="text-sm text-muted-foreground">
                                                {selectedPosts.length} post(s) selected
                                            </span>
                                            <Button
                                                onClick={generateFeedback}
                                                disabled={isGenerating}
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="mr-2 h-4 w-4" />
                                                        Generate AI Feedback
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {isGenerating && (
                                        <div className="space-y-2">
                                            <Progress value={generationProgress} />
                                            <p className="text-sm text-center text-muted-foreground">
                                                Generating feedback...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Review Feedback Tab */}
                <TabsContent value="review" className="space-y-4">
                    {pendingFeedback.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No Pending Feedback</h3>
                                <p className="text-muted-foreground mt-2">
                                    Generate AI feedback for posts or all feedback has been approved.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">
                                    {pendingFeedback.length} pending review(s)
                                </h3>
                                <Button
                                    onClick={() => approveFeedback(pendingFeedback.map(f => f.id))}
                                    disabled={isApproving}
                                >
                                    {isApproving ? (
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                    )}
                                    Approve All
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {pendingFeedback.map(feedback => {
                                    const isExpanded = expandedFeedback.includes(feedback.id)
                                    const edited = editedFeedback[feedback.id]
                                    const currentFeedbackText = edited?.text || feedback.professorEdits || feedback.aiFeedback
                                    const currentScore = edited?.score || feedback.finalScore || feedback.aiScore || 0

                                    return (
                                        <Card key={feedback.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <CardTitle className="text-base">
                                                            {feedback.studentName}
                                                        </CardTitle>
                                                        {feedback.aiScore && (
                                                            <Badge variant="outline">
                                                                Score: {currentScore}/100
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpanded(feedback.id)}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Student Post */}
                                                <div className="p-3 bg-muted rounded-lg">
                                                    <p className="text-sm font-medium mb-1">Student Post:</p>
                                                    <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                        {feedback.studentPost}
                                                    </p>
                                                </div>

                                                {/* AI Feedback */}
                                                {isExpanded ? (
                                                    <div className="space-y-4">
                                                        {/* Strengths & Improvements */}
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            {feedback.aiStrengths?.length > 0 && (
                                                                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                                                    <p className="text-sm font-medium mb-1 text-green-700 dark:text-green-300">
                                                                        Strengths:
                                                                    </p>
                                                                    <ul className="list-disc list-inside text-sm">
                                                                        {feedback.aiStrengths.map((s, i) => (
                                                                            <li key={i}>{s}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {feedback.aiImprovements?.length > 0 && (
                                                                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                                                                    <p className="text-sm font-medium mb-1 text-amber-700 dark:text-amber-300">
                                                                        Areas for Improvement:
                                                                    </p>
                                                                    <ul className="list-disc list-inside text-sm">
                                                                        {feedback.aiImprovements.map((s, i) => (
                                                                            <li key={i}>{s}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Editable Feedback */}
                                                        <div>
                                                            <label className="text-sm font-medium flex items-center gap-2 mb-2">
                                                                <Edit className="h-4 w-4" />
                                                                Feedback (editable)
                                                            </label>
                                                            <Textarea
                                                                value={currentFeedbackText}
                                                                onChange={(e) => handleEditFeedback(
                                                                    feedback.id,
                                                                    e.target.value,
                                                                    currentScore
                                                                )}
                                                                rows={4}
                                                                className="text-sm"
                                                            />
                                                        </div>

                                                        {/* Score */}
                                                        <div className="flex items-center gap-4">
                                                            <label className="text-sm font-medium">Score:</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={currentScore}
                                                                onChange={(e) => handleEditFeedback(
                                                                    feedback.id,
                                                                    currentFeedbackText,
                                                                    parseInt(e.target.value) || 0
                                                                )}
                                                                className="w-20 px-2 py-1 border rounded text-sm"
                                                            />
                                                            <span className="text-sm text-muted-foreground">/ 100</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm line-clamp-2">
                                                        <strong>AI Feedback:</strong> {currentFeedbackText}
                                                    </p>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                                    {edited && (
                                                        <Badge variant="secondary" className="mr-auto">
                                                            <Edit className="mr-1 h-3 w-3" />
                                                            Edited
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => approveFeedback([feedback.id])}
                                                        disabled={isApproving}
                                                    >
                                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                                        Approve & Send
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* Approved Tab */}
                <TabsContent value="approved" className="space-y-4">
                    {approvedFeedback.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No Approved Feedback Yet</h3>
                                <p className="text-muted-foreground mt-2">
                                    Approved feedback will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {approvedFeedback.map(feedback => (
                                <Card key={feedback.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <CardTitle className="text-base">
                                                    {feedback.studentName}
                                                </CardTitle>
                                                <Badge variant="default">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Sent
                                                </Badge>
                                                {feedback.finalScore && (
                                                    <Badge variant="outline">
                                                        Score: {feedback.finalScore}/100
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="text-sm">
                                                {feedback.finalFeedback || feedback.aiFeedback}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
