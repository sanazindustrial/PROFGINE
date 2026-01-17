"use client"

import { useEffect, useState, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
// @ts-ignore
import mixpanel from "mixpanel-browser"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Copy, RefreshCw, Star, User, FileText, MessageSquare, Wand2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export function DiscussionResponse() {
  const [input, setInput] = useState("")
  const [isResponseLoading, setIsResponseLoading] = useState(false)

  // Use the no-risk patch approach since the SDK version has limited props
  const chat = useChat({
    onFinish: () => {
      setInput("")
      setIsResponseLoading(false)
    },
  })

  const {
    messages,
    setMessages,
    stop,
  } = chat

  // Try to access properties with fallback - wrapped in useCallback to fix dependency issue
  const handleSubmit = useCallback((event?: React.FormEvent) => {
    const submitFn = (chat as any).handleSubmit;
    if (submitFn) {
      return submitFn(event);
    }
  }, [chat])
  const [professorProfile, setProfessorProfile] = useState("")
  const [discussionPrompt, setDiscussionPrompt] = useState("")
  const [studentPost, setStudentPost] = useState("")
  const [refineInstructions, setRefineInstructions] = useState("")
  const [showRefinement, setShowRefinement] = useState(false)

  mixpanel.init("2cd410fcd850fc63e1d196976acaff87", {
    debug: process.env.NODE_ENV !== "production",
    track_pageview: true,
    persistence: "localStorage",
  })

  // Load saved data from localStorage when component mounts
  useEffect(() => {
    const storedProfile = localStorage.getItem("professorProfile")
    const storedPrompt = localStorage.getItem("discussionPrompt")
    if (storedProfile) {
      setProfessorProfile(storedProfile)
    }
    if (storedPrompt) {
      setDiscussionPrompt(storedPrompt)
    }
  }, [])

  // Save professor profile to localStorage
  useEffect(() => {
    if (!professorProfile) return
    localStorage.setItem("professorProfile", professorProfile)
  }, [professorProfile])

  // Save discussion prompt to localStorage  
  useEffect(() => {
    if (!discussionPrompt) return
    localStorage.setItem("discussionPrompt", discussionPrompt)
  }, [discussionPrompt])

  useEffect(() => {
    if (input) {
      setIsResponseLoading(true)
      handleSubmit({
        preventDefault: () => { },
      } as React.FormEvent)
    }
  }, [input, handleSubmit])

  const generateResponse = () => {
    if (!professorProfile.trim() || !discussionPrompt.trim() || !studentPost.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before generating a response.",
        variant: "destructive",
      })
      return
    }

    mixpanel.track("Response Generated")
    stop()
    setMessages([])
    setShowRefinement(false)
    setInput(
      "Professor Writing Style and Background: \n" +
      professorProfile +
      "\n" +
      "Discussion Topic: \n" +
      discussionPrompt +
      "\n" +
      "Student's Response to the Discussion Topic: \n" +
      studentPost +
      "\n" +
      "Professor's Response to Above Student:"
    )
  }

  const refineResponse = () => {
    if (!messages[1] || !refineInstructions.trim()) {
      toast({
        title: "Cannot Refine",
        description: "Please generate a response first and provide refinement instructions.",
        variant: "destructive",
      })
      return
    }

    mixpanel.track("Response Refined")
    stop()
    setMessages([])
    setInput(
      "Professor Writing Style and Background: \n" +
      professorProfile +
      "\n" +
      "Discussion Topic: \n" +
      discussionPrompt +
      "\n" +
      "Student's Response to the Discussion Topic: \n" +
      studentPost +
      "\n" +
      "Proposed Professor's Response to Above Student: \n" +
      (messages[1] as any).content +
      "\n" +
      "Instructions for Refinement: \n" +
      refineInstructions +
      "\n" +
      "Refined Professor's Response to Above Student:"
    )
  }

  const copyResponse = async () => {
    if (!(messages[1] as any)?.content) {
      toast({
        title: "No Response to Copy",
        description: "Please generate a response first.",
        variant: "destructive",
      })
      return
    }

    try {
      await navigator.clipboard.writeText((messages[1] as any).content)
      mixpanel.track("Response Copied")
      toast({
        title: "Copied!",
        description: "Response has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy response to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Professor Profile */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="size-5 text-blue-600" />
              <CardTitle className="text-base">Professor Profile</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Your teaching style and background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[120px] resize-none transition-colors duration-200 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter your response style + paste examples of your previous responses..."
              value={professorProfile}
              onChange={(e) => setProfessorProfile(e.target.value)}
            />
            <Badge variant="secondary" className="text-xs">
              {professorProfile.length}/1000 characters
            </Badge>
          </CardContent>
        </Card>

        {/* Discussion Topic */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-green-600" />
              <CardTitle className="text-base">Discussion Topic</CardTitle>
            </div>
            <CardDescription className="text-sm">
              The original discussion prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[120px] resize-none transition-colors duration-200 focus:ring-2 focus:ring-green-500/20"
              value={discussionPrompt}
              onChange={(e) => setDiscussionPrompt(e.target.value)}
              placeholder="Enter the discussion prompt or question..."
            />
            <Badge variant="secondary" className="text-xs">
              {discussionPrompt.length}/500 characters
            </Badge>
          </CardContent>
        </Card>

        {/* Student Post */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-purple-600" />
              <CardTitle className="text-base">Student&apos;s Post</CardTitle>
            </div>
            <CardDescription className="text-sm">
              The student&apos;s response to grade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={studentPost}
              onChange={(e) => setStudentPost(e.target.value)}
              className="min-h-[120px] resize-none transition-colors duration-200 focus:ring-2 focus:ring-purple-500/20"
              placeholder="Paste the student's discussion post here..."
            />
            <Badge variant="secondary" className="text-xs">
              {studentPost.length}/2000 characters
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={generateResponse}
          size="lg"
          disabled={isResponseLoading || !professorProfile.trim() || !discussionPrompt.trim() || !studentPost.trim()}
          className="px-8 py-3 text-base transition-all duration-200 hover:scale-105"
        >
          {isResponseLoading ? (
            <>
              <RefreshCw className="mr-2 size-5 animate-spin" />
              Generating Response...
            </>
          ) : (
            <>
              <Star className="mr-2 size-5" />
              Generate AI Response
            </>
          )}
        </Button>
      </div>

      {/* Response Section */}
      {(messages[1] || isResponseLoading) && (
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-blue-600" />
                <CardTitle>AI Generated Response</CardTitle>
              </div>
              {messages[1] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyResponse}
                  className="shrink-0"
                >
                  <Copy className="mr-2 size-4" />
                  Copy
                </Button>
              )}
            </div>
            <CardDescription>
              Generated using multi-AI provider system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isResponseLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted"></div>
                  <div className="h-4 w-full rounded bg-muted"></div>
                  <div className="h-4 w-5/6 rounded bg-muted"></div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="size-4 animate-spin" />
                  AI is crafting your response...
                </div>
              </div>
            ) : (
              <Textarea
                className="min-h-[150px] resize-none border-dashed"
                value={(messages[1] as any)?.content || ""}
                onChange={(e) =>
                  setMessages([
                    messages[0],
                    {
                      ...(messages[1] as any),
                      content: e.target.value,
                      role: "assistant",
                      id: "1",
                    } as any,
                  ])
                }
                placeholder="AI response will appear here..."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Refinement Section */}
      {messages[1] && !isResponseLoading && (
        <Card className="border-dashed transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="size-5 text-purple-600" />
                <CardTitle className="text-base">Refine Response</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRefinement(!showRefinement)}
              >
                {showRefinement ? "Hide" : "Show"}
              </Button>
            </div>
            <CardDescription>
              Improve the generated response with specific instructions
            </CardDescription>
          </CardHeader>
          {(showRefinement || refineInstructions) && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refine-instructions">Refinement Instructions</Label>
                <Input
                  id="refine-instructions"
                  placeholder="e.g., make it shorter, more encouraging, stricter..."
                  value={refineInstructions}
                  onChange={(e) => setRefineInstructions(e.target.value)}
                  className="transition-colors duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <Button
                onClick={refineResponse}
                disabled={!refineInstructions.trim() || isResponseLoading}
                className="w-full"
              >
                <Wand2 className="mr-2 size-4" />
                Refine Response
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
