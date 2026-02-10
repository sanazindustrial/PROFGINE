"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip"
import {
    Wand2,
    Send,
    Loader2,
    Lightbulb,
    BookOpen,
    Target,
    Layout,
    FileText,
    CheckSquare,
    Maximize2,
    Minimize2,
    ThumbsUp,
    ThumbsDown,
    Copy,
    RotateCcw,
} from "lucide-react"
import type {
    GenieMessage,
    CourseDesignPhase,
    CourseDetails
} from "@/types/course-design-studio.types"

// Extended local message type with additional properties for UI state
interface LocalGenieMessage extends GenieMessage {
    conversationId?: string
    metadata?: {
        suggestions?: boolean
    }
}

interface AskGenieProps {
    courseId: string
    currentPhase: CourseDesignPhase
    courseDetails?: CourseDetails | null
    phaseContext?: string
    onSuggestionApply?: (suggestion: string, type: string) => void
    buttonVariant?: "floating" | "inline" | "icon"
}

// Phase-specific quick prompts
const phaseQuickPrompts: Record<CourseDesignPhase, string[]> = {
    "context-setup": [
        "What information do I need to provide first?",
        "How do I set up course context effectively?",
        "What are the key initial parameters?",
    ],
    "course-details": [
        "Help me define clear course objectives",
        "What academic level is best for this content?",
        "Suggest a delivery mode for this course",
    ],
    "material-ingestion": [
        "What materials should I upload for a comprehensive course?",
        "How do I organize my evidence kit effectively?",
        "What file formats work best for AI analysis?",
    ],
    "content-analysis": [
        "What patterns do you see in my uploaded materials?",
        "Are there any gaps in my course content?",
        "Suggest additional topics to cover",
    ],
    "generate-objectives": [
        "Help me align objectives with Bloom's taxonomy",
        "Are my objectives measurable and specific?",
        "Generate program-aligned objectives",
    ],
    "suggest-curriculum": [
        "Suggest an effective curriculum structure",
        "How should I sequence these topics?",
        "Balance theory and practical content",
    ],
    "build-sections": [
        "Suggest an effective module structure",
        "How should I organize course sections?",
        "What sections should I include?",
    ],
    "populate-content": [
        "Generate engaging lecture notes for this topic",
        "Create discussion questions for this module",
        "Suggest activities for active learning",
    ],
    "create-content": [
        "Help me create compelling content",
        "Generate assessment items for this section",
        "Suggest multimedia resources",
    ],
    "create-syllabus": [
        "Review my syllabus for completeness",
        "Ensure policy compliance",
        "Format syllabus professionally",
    ],
    "ready-check": [
        "What is blocking my course from publishing?",
        "Check accessibility requirements",
        "Verify all sections are complete",
    ],
    "publish": [
        "Final review before publishing",
        "Generate course marketing description",
        "Summarize course for students",
    ],
}

// Phase icons for context display
const phaseIcons: Record<CourseDesignPhase, React.ReactNode> = {
    "context-setup": <BookOpen className="size-4" />,
    "course-details": <FileText className="size-4" />,
    "material-ingestion": <BookOpen className="size-4" />,
    "content-analysis": <Lightbulb className="size-4" />,
    "generate-objectives": <Target className="size-4" />,
    "suggest-curriculum": <Layout className="size-4" />,
    "build-sections": <Layout className="size-4" />,
    "populate-content": <FileText className="size-4" />,
    "create-content": <FileText className="size-4" />,
    "create-syllabus": <FileText className="size-4" />,
    "ready-check": <CheckSquare className="size-4" />,
    "publish": <Wand2 className="size-4" />,
}

export function AskGenie({
    courseId,
    currentPhase,
    courseDetails,
    phaseContext,
    onSuggestionApply,
    buttonVariant = "floating",
}: AskGenieProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [conversation, setConversation] = useState<LocalGenieMessage[]>([])
    const [conversationId, setConversationId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [conversation])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Send message to GENIE
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        const userMessage: LocalGenieMessage = {
            id: `temp-${Date.now()}`,
            conversationId: conversationId || "",
            role: "user",
            content: content.trim(),
            createdAt: new Date(),
        }

        setConversation(prev => [...prev, userMessage])
        setMessage("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/course-design-studio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ask-genie",
                    courseId,
                    question: content.trim(),
                    conversationId,
                    context: phaseContext,
                }),
            })

            if (response.ok) {
                const { data } = await response.json()

                // Update conversation ID if new
                if (!conversationId && data.conversationId) {
                    setConversationId(data.conversationId)
                }

                const assistantMessage: LocalGenieMessage = {
                    id: data.messageId || `assistant-${Date.now()}`,
                    conversationId: data.conversationId || conversationId || "",
                    role: "assistant",
                    content: data.response,
                    metadata: data.metadata,
                    createdAt: new Date(),
                }

                setConversation(prev => [...prev, assistantMessage])
            } else {
                // Add error message
                const errorMessage: LocalGenieMessage = {
                    id: `error-${Date.now()}`,
                    conversationId: conversationId || "",
                    role: "assistant",
                    content: "I apologize, but I encountered an issue. Please try again.",
                    createdAt: new Date(),
                }
                setConversation(prev => [...prev, errorMessage])
            }
        } catch (error) {
            console.error("GENIE error:", error)
            const errorMessage: LocalGenieMessage = {
                id: `error-${Date.now()}`,
                conversationId: conversationId || "",
                role: "assistant",
                content: "Connection error. Please check your network and try again.",
                createdAt: new Date(),
            }
            setConversation(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [courseId, conversationId, phaseContext, isLoading])

    // Handle quick prompt selection
    const handleQuickPrompt = (prompt: string) => {
        sendMessage(prompt)
    }

    // Copy message to clipboard
    const copyMessage = async (content: string) => {
        await navigator.clipboard.writeText(content)
    }

    // Apply suggestion (callback to parent)
    const applySuggestion = (content: string, type: string) => {
        onSuggestionApply?.(content, type)
    }

    // Reset conversation
    const resetConversation = () => {
        setConversation([])
        setConversationId(null)
    }

    // Render trigger button based on variant
    const renderTrigger = () => {
        switch (buttonVariant) {
            case "floating":
                return (
                    <Button
                        className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg transition-shadow hover:shadow-xl"
                        onClick={() => setIsOpen(true)}
                    >
                        <Wand2 className="size-6" />
                    </Button>
                )
            case "inline":
                return (
                    <Button onClick={() => setIsOpen(true)} className="gap-2">
                        <Wand2 className="size-4" />
                        Ask Professor GENIE
                    </Button>
                )
            case "icon":
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                                    <Wand2 className="size-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ask Professor GENIE</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
        }
    }

    return (
        <>
            {buttonVariant === "floating" && !isOpen && renderTrigger()}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                {buttonVariant !== "floating" && (
                    <SheetTrigger asChild>
                        {renderTrigger()}
                    </SheetTrigger>
                )}

                <SheetContent
                    side="right"
                    className={`flex flex-col p-0 ${isExpanded ? 'w-[600px] sm:max-w-[600px]' : 'w-[400px] sm:max-w-[400px]'}`}
                >
                    {/* Header */}
                    <SheetHeader className="border-b p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-10 bg-primary">
                                    <AvatarImage src="/genie-avatar.png" />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                        <Wand2 className="size-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <SheetTitle className="text-left">Professor GENIE</SheetTitle>
                                    <SheetDescription className="text-left text-xs">
                                        Your AI Course Design Advisor
                                    </SheetDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => setIsExpanded(!isExpanded)}
                                            >
                                                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{isExpanded ? "Minimize" : "Expand"}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={resetConversation}
                                            >
                                                <RotateCcw className="size-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>New Conversation</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Current Context */}
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                                {phaseIcons[currentPhase]}
                                Phase: {currentPhase}
                            </Badge>
                            {courseDetails && (
                                <Badge variant="secondary" className="max-w-[200px] truncate">
                                    {courseDetails.title || courseDetails.code}
                                </Badge>
                            )}
                        </div>
                    </SheetHeader>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {/* Welcome message if no conversation */}
                            {conversation.length === 0 && (
                                <div className="py-8 text-center">
                                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                                        <Wand2 className="size-8 text-white" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold">
                                        Hello, Professor!
                                    </h3>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        I&apos;m here to help you design an exceptional course.
                                        Ask me anything about curriculum design, learning objectives,
                                        or best practices.
                                    </p>

                                    {/* Quick prompts for current phase */}
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                            Suggestions for {currentPhase} phase:
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {phaseQuickPrompts[currentPhase].map((prompt, i) => (
                                                <Button
                                                    key={i}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-auto justify-start px-3 py-2 text-left"
                                                    onClick={() => handleQuickPrompt(prompt)}
                                                >
                                                    <Lightbulb className="mr-2 size-3 shrink-0" />
                                                    <span className="text-xs">{prompt}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Conversation messages */}
                            {conversation.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-xs text-white">
                                                <Wand2 className="size-3" />
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div
                                        className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

                                        {/* Message actions for assistant messages */}
                                        {msg.role === 'assistant' && (
                                            <div className="mt-2 flex items-center gap-1 border-t border-border/50 pt-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-6"
                                                                onClick={() => copyMessage(msg.content)}
                                                            >
                                                                <Copy className="size-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Copy</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {msg.metadata?.suggestions && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        onClick={() => applySuggestion(msg.content, "objective")}
                                                    >
                                                        Apply
                                                    </Button>
                                                )}

                                                <div className="flex-1" />

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-6">
                                                                <ThumbsUp className="size-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Helpful</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-6">
                                                                <ThumbsDown className="size-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Not helpful</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarFallback className="bg-secondary text-xs">
                                                You
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex justify-start gap-3">
                                    <Avatar className="size-8 shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-xs text-white">
                                            <Wand2 className="size-3" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg bg-muted p-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input area */}
                    <div className="border-t p-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                sendMessage(message)
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                ref={inputRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask Professor GENIE..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!message.trim() || isLoading}>
                                <Send className="size-4" />
                            </Button>
                        </form>

                        {/* Quick actions */}
                        {conversation.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {phaseQuickPrompts[currentPhase].slice(0, 2).map((prompt, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => handleQuickPrompt(prompt)}
                                    >
                                        {prompt.slice(0, 30)}...
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

// Floating button for use in layouts
export function GenieFloatingButton(props: AskGenieProps) {
    return <AskGenie {...props} buttonVariant="floating" />
}

// Inline button for use in toolbars
export function GenieInlineButton(props: AskGenieProps) {
    return <AskGenie {...props} buttonVariant="inline" />
}

// Icon button for compact spaces
export function GenieIconButton(props: AskGenieProps) {
    return <AskGenie {...props} buttonVariant="icon" />
}
