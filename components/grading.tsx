"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import { FileUploader } from "@/components/file-uploader.component"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function Grading() {
  // Replace useChat with simple fetch-based approach
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string; id: string }>>([])
  const [isResponseLoading, setIsResponseLoading] = useState(false)
  const [professorProfile, setProfessorProfile] = useState("")
  const [rubricPrompt, setRubricPrompt] = useState("")
  const [assignmentPrompt, setAssignmentPrompt] = useState("")
  const [studentPost, setStudentPost] = useState("")
  const [refineInstructions, setRefineInstructions] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<FilePurposeInterface>({})
  const [gradingLevel, setGradingLevel] = useState<string>("medium")
  const [assignmentType, setAssignmentType] = useState<string>("essay")
  const [customGradingPrompt, setCustomGradingPrompt] = useState("")

  const rubricInputRef = useRef<HTMLInputElement>(null)
  const assignmentInputRef = useRef<HTMLInputElement>(null)
  const studentInputRef = useRef<HTMLInputElement>(null)
  const professorInputRef = useRef<HTMLInputElement>(null)

  // Load the professor profile from localStorage when the component mounts
  useEffect(() => {
    const storedProfile = localStorage.getItem("professorProfile")
    const storedPrompt = localStorage.getItem("rubricPrompt")
    const storedAssignmentPrompt = localStorage.getItem("assignmentPrompt")

    if (storedProfile) {
      setProfessorProfile(storedProfile)
    }
    if (storedPrompt) {
      setRubricPrompt(storedPrompt)
    }

    if (storedAssignmentPrompt) {
      setAssignmentPrompt(storedAssignmentPrompt)
    }
  }, [])
  // Save the professor profile to localStorage when it changes
  useEffect(() => {
    if (!professorProfile) {
      return
    }
    localStorage.setItem("professorProfile", professorProfile)
  }, [professorProfile])

  // Save the discussion prompt to localStorage when it changes
  useEffect(() => {
    if (!rubricPrompt) {
      return
    }
    localStorage.setItem("rubricPrompt", rubricPrompt)
  }, [rubricPrompt])

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

  const onSubmitHandler = useCallback(async () => {
    mixpanel.track("Response Generated")
    setIsLoading(true)
    setIsResponseLoading(true)
    setError(null)
    setMessages([])

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

    let content = getMessageContent(messageChunks)
    
    // Add grading context
    const gradingContext = `\n\n[GRADING SETTINGS]\nAssignment Type: ${assignmentType}\nStrictness Level: ${gradingLevel}\n${customGradingPrompt ? `Custom Instructions: ${customGradingPrompt}\n` : ''}\nPlease adjust your feedback tone and depth according to these settings.`
    content += gradingContext

    try {
      const payload = {
        messages: [{ role: "user", content }],
        ...(Object.keys(uploadedFiles).length > 0 ? { data: uploadedFiles } : {})
      }

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Grading failed")

      // Update messages with user message and assistant response
      setMessages([
        { role: "user", content, id: "0" },
        { role: "assistant", content: data.content || data.message || "", id: "1" }
      ])
    } catch (e: any) {
      setError(e?.message ?? "Grading failed")
    } finally {
      setIsLoading(false)
      setIsResponseLoading(false)
    }
  }, [assignmentPrompt, assignmentType, customGradingPrompt, gradingLevel, professorProfile, rubricPrompt, studentPost, uploadedFiles])

  const onSubmitRefinementHandler = async () => {
    if (!messages[1]) {
      alert("Please generate a response first!")
      return
    }

    mixpanel.track("Response Refined")
    setIsLoading(true)
    setIsResponseLoading(true)
    setError(null)

    try {
      const payload = {
        messages: [
          ...messages,
          { role: "user", content: refineInstructions }
        ]
      }

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Refinement failed")

      // Update messages with refinement request and new response
      setMessages([
        ...messages,
        { role: "user", content: refineInstructions, id: String(messages.length) },
        { role: "assistant", content: data.content || data.message || "", id: String(messages.length + 1) }
      ])
    } catch (e: any) {
      setError(e?.message ?? "Refinement failed")
    } finally {
      setIsLoading(false)
      setIsResponseLoading(false)
    }
  }

  const newGradingHandler = () => {
    // Clear messages instead of threadId
    setMessages([])
    setStudentPost("")
    setRefineInstructions("")
    setUploadedFiles({ ...uploadedFiles, [FilePurposeEnum.student]: "" })
    if (studentInputRef.current) {
      studentInputRef.current.value = ""
      trackUploadedFiles(FilePurposeEnum.student, "")
    }
  }

  const loadSampleData = () => {
    setProfessorProfile("I prefer constructive feedback with specific examples. My tone is encouraging yet direct. I focus on helping students improve their critical thinking skills.")
    setRubricPrompt("Grade based on: Thesis clarity (30%), Evidence quality (40%), Organization (20%), Grammar (10%)")
    setAssignmentPrompt("Essay analyzing the impact of social media on modern communication. 500-750 words.")
    setStudentPost("Social media has changed how we communicate. People now use emojis and short messages instead of long conversations. This affects our relationships and attention spans.")
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && !isResponseLoading && studentPost.trim() && messages.length === 0) {
        e.preventDefault()
        onSubmitHandler()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isResponseLoading, studentPost, messages, onSubmitHandler])

  mixpanel.init("2cd410fcd850fc63e1d196976acaff87", {
    debug: process.env.NODE_ENV !== "production",
    track_pageview: true,
    persistence: "localStorage",
  })

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      {/* Quick Start Guide */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              Quick Start Guide
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Load sample data to test the grading assistant or press <kbd className="rounded border bg-white px-2 py-0.5 text-xs dark:bg-gray-800">Ctrl+Enter</kbd> to submit
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSampleData} className="hover:bg-white dark:hover:bg-gray-800">
            Load Sample Data
          </Button>
        </CardContent>
      </Card>

      {/* Grading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Grading Settings
          </CardTitle>
          <CardDescription>
            Configure how strict the grading should be and what type of assignment you&apos;re grading
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">Assignment Type</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
                <SelectItem value="discussion">Discussion Post</SelectItem>
                <SelectItem value="dissertation">Dissertation</SelectItem>
                <SelectItem value="lab-report">Lab Report</SelectItem>
                <SelectItem value="case-study">Case Study</SelectItem>
                <SelectItem value="presentation">Presentation</SelectItem>
                <SelectItem value="code">Code Assignment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Grading Strictness</Label>
            <Select value={gradingLevel} onValueChange={setGradingLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light - Encouraging</SelectItem>
                <SelectItem value="medium">Medium - Balanced</SelectItem>
                <SelectItem value="hard">Hard - Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 space-y-2 md:col-span-2">
            <Label className="text-sm">Custom Grading Instructions (Optional)</Label>
            <Textarea
              placeholder="Add any specific instructions for this grading session... e.g., 'Focus on argument strength' or 'Pay special attention to methodology'"
              value={customGradingPrompt}
              onChange={(e) => setCustomGradingPrompt(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              This will be added to your grading context to provide more personalized feedback
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="professor-profile" className="text-base font-semibold">
            Professor Background & Style
          </Label>
          <p className="text-sm text-muted-foreground">
            Describe your grading style, tone, and preferences. Include examples of previous feedback you&apos;ve given.
          </p>
          <FileUploader
            purpose={FilePurposeEnum.professor}
            trackFile={trackUploadedFiles}
            onClick={fileUploaderClickHandler}
            fileId={uploadedFiles[FilePurposeEnum.professor]}
            ref={professorInputRef}
          />
          <Textarea
            className="min-h-[120px]"
            id="professor-profile"
            placeholder="Example: I prefer constructive feedback with specific suggestions. My tone is encouraging but direct. Here's an example of my feedback style: 'Your analysis shows good understanding of the core concepts. To improve, consider adding more concrete examples from the readings...'"
            value={professorProfile}
            disabled={!!uploadedFiles[FilePurposeEnum.professor]}
            onChange={(e) => setProfessorProfile(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rubric-prompt" className="text-base font-semibold">
            Grading Rubric
          </Label>
          <p className="text-sm text-muted-foreground">
            Type your grading criteria or upload a rubric file.
            <br />
            <span className="text-xs italic">
              Accepted files: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
            </span>
          </p>
          <div className="mb-4">
            <FileUploader
              purpose={FilePurposeEnum.rubric}
              trackFile={trackUploadedFiles}
              onClick={fileUploaderClickHandler}
              fileId={uploadedFiles[FilePurposeEnum.rubric]}
              ref={rubricInputRef}
            />
          </div>
          <Textarea
            className="min-h-[120px]"
            id="rubric-topic"
            value={rubricPrompt}
            disabled={!!uploadedFiles[FilePurposeEnum.rubric]}
            onChange={(e) => setRubricPrompt(e.target.value)}
            placeholder="Example: Content Understanding (40%): Demonstrates clear grasp of concepts&#10;Critical Analysis (30%): Provides thoughtful evaluation&#10;Writing Quality (20%): Clear, organized, proper grammar&#10;Citations (10%): Proper attribution of sources"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignment-prompt" className="text-base font-semibold">
            Assignment Instructions
          </Label>
          <p className="text-sm text-muted-foreground">
            Provide the assignment details that students were asked to complete.
          </p>
          <FileUploader
            purpose={FilePurposeEnum.assignment}
            trackFile={trackUploadedFiles}
            onClick={fileUploaderClickHandler}
            fileId={uploadedFiles[FilePurposeEnum.assignment]}
            ref={assignmentInputRef}
            multiple
          />
          <Textarea
            className="min-h-[120px]"
            id="assignment-topic"
            value={assignmentPrompt}
            onChange={(e) => setAssignmentPrompt(e.target.value)}
            placeholder="Example: Write a 500-word essay analyzing the impact of climate change on coastal ecosystems. Include at least 3 peer-reviewed sources and discuss both environmental and economic impacts."
            disabled={!!uploadedFiles[FilePurposeEnum.assignment]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-post" className="text-base font-semibold">
            Student Submission
          </Label>
          <p className="text-sm text-muted-foreground">
            Paste the student&apos;s work or upload their submission file(s).
          </p>
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
            className="min-h-[150px]"
            id="student-post"
            placeholder="Paste the student's assignment submission here..."
            disabled={!!uploadedFiles[FilePurposeEnum.student]}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onSubmitHandler}
          disabled={messages.length > 0 || isResponseLoading || !studentPost.trim()}
          size="lg"
          className="group relative min-w-[200px]"
        >
          {isResponseLoading ? "Generating..." : "Generate Feedback"}
          {!isResponseLoading && messages.length === 0 && studentPost.trim() && (
            <span className="ml-2 text-xs opacity-0 transition-opacity group-hover:opacity-70">
              (Ctrl+Enter)
            </span>
          )}
        </Button>
        <Button
          disabled={isResponseLoading || messages.length === 0}
          onClick={newGradingHandler}
          variant="outline"
          size="lg"
        >
          New Grading
        </Button>
        <Spinner
          loading={isResponseLoading}
          className="ml-2 self-center"
          size="3"
        ></Spinner>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="professor-response" className="text-base font-semibold">
            AI-Generated Feedback
          </Label>
          <p className="text-sm text-muted-foreground">
            Review and edit the generated feedback before sharing with students.
          </p>
          <Textarea
            className="min-h-[200px] font-mono text-sm"
            style={{ overflowAnchor: "auto" }}
            id="professor-response"
            value={messages[1] ? (messages[1] as any).content : ""}
            onChange={(e) =>
              setMessages([
                messages[0],
                {
                  content: e.target.value,
                  role: "assistant",
                  id: "1",
                } as any,
              ])
            }
            placeholder="Your AI-generated feedback will appear here after clicking 'Generate Feedback'...&#10;&#10;The feedback will include:&#10;• Specific strengths in the student's work&#10;• Areas for improvement&#10;• Constructive suggestions&#10;• Grade or score based on your rubric"
          />
          {error && (
            <span className="flex items-center gap-2 text-sm text-red-500">
              {error}
            </span>
          )}
        </div>
      </div>
      {/* Text Input with Refine Response label, button that says Refine Response */}
      <Button
        onClick={() => {
          mixpanel.track("Response Copied")
          if (messages[1] && (messages[1] as any).content) {
            navigator.clipboard.writeText((messages[1] as any).content)
          }
        }}
        disabled={!messages[1] || !(messages[1] as any).content}
      >
        Copy Response
      </Button>
      {messages[1] && !isResponseLoading && (
        <div>
          <div className="w-full">
            <Label htmlFor="refine-response">Refine Response</Label>
            <Textarea
              id="refine-response"
              className="min-h-[100px]"
              placeholder="Refine the professor's response - ex. make it shorter, stricter"
              value={refineInstructions}
              onChange={(e) => setRefineInstructions(e.target.value)}
            />
          </div>
          <Button className="mt-4" onClick={onSubmitRefinementHandler}>
            Refine
          </Button>
        </div>
      )}
    </section>
  )
}
