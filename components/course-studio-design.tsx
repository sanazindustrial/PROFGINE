"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, FileText, Monitor, Download, CheckCircle2 } from "lucide-react"

interface CourseStudioDesignProps {
    courseId: string
    headerTitle?: string
    headerDescription?: string
    enableSectionNumber?: boolean
    includeSectionInTitle?: boolean
    sectionLabel?: string
}

export function CourseStudioDesign({
    courseId,
    headerTitle = "Professor GENIE Studio",
    headerDescription = "Upload lecture notes and materials, then generate slide decks with speaker notes for each class session",
    enableSectionNumber = false,
    includeSectionInTitle = false,
    sectionLabel = "Section / Week Number"
}: CourseStudioDesignProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [templateStyle, setTemplateStyle] = useState("modern-minimalist")
    const [targetSlides, setTargetSlides] = useState("25")
    const [targetDuration, setTargetDuration] = useState("50")
    const [difficultyLevel, setDifficultyLevel] = useState("intermediate")
    const [includeQuizzes, setIncludeQuizzes] = useState(true)
    const [includeDiscussions, setIncludeDiscussions] = useState(true)
    const [sectionNumber, setSectionNumber] = useState("1")
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError("Please enter a presentation title")
            return
        }

        setIsGenerating(true)
        setError("")
        setResult(null)

        const finalTitle = includeSectionInTitle && sectionNumber
            ? `Week ${sectionNumber}: ${title.trim()}`
            : title.trim()

        try {
            // Upload files first if any
            const uploadedFileUrls: string[] = []
            if (uploadedFiles.length > 0) {
                setIsUploading(true)
                for (const file of uploadedFiles) {
                    const formData = new FormData()
                    formData.append("file", file)

                    const uploadResponse = await fetch("/api/uploads", {
                        method: "POST",
                        body: formData,
                    })

                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json()
                        uploadedFileUrls.push(uploadData.fileUrl)
                    } else {
                        console.error(`Failed to upload ${file.name}`)
                    }
                }
                setIsUploading(false)
            }

            const response = await fetch("/api/course-studio/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    courseId,
                    title: finalTitle,
                    sources: uploadedFileUrls,
                    settings: {
                        description,
                        templateStyle,
                        targetSlides: parseInt(targetSlides),
                        targetDuration: parseInt(targetDuration),
                        difficultyLevel,
                        includeQuizzes,
                        includeDiscussions,
                        sourceType: "MIXED",
                        sectionNumber: enableSectionNumber ? parseInt(sectionNumber) : undefined,
                    },
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate presentation")
            }

            setResult(data)

            // Clear uploaded files after successful generation
            setUploadedFiles([])

            // Smooth redirect to results page with appropriate delay for user to see success message
            setTimeout(() => {
                window.location.href = `/dashboard/courses/${courseId}/studio/results/${data.presentationId}`
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsGenerating(false)
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{headerTitle}</CardTitle>
                    <CardDescription>
                        {headerDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Lecture Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Introduction to Data Structures"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the lecture content..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {enableSectionNumber && (
                        <div className="space-y-2">
                            <Label htmlFor="sectionNumber">{sectionLabel}</Label>
                            <Select value={sectionNumber} onValueChange={setSectionNumber}>
                                <SelectTrigger id="sectionNumber">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                                        <SelectItem key={week} value={week.toString()}>
                                            {week}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Template Style */}
                    <div className="space-y-2">
                        <Label htmlFor="template">Presentation Template</Label>
                        <Select value={templateStyle} onValueChange={setTemplateStyle}>
                            <SelectTrigger id="template">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="modern-minimalist">Modern Minimalist</SelectItem>
                                <SelectItem value="academic-classic">Academic Classic</SelectItem>
                                <SelectItem value="corporate-professional">Corporate Professional</SelectItem>
                                <SelectItem value="creative-dynamic">Creative Dynamic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="slides">Target Slides</Label>
                            <Input
                                id="slides"
                                type="number"
                                min="10"
                                max="50"
                                value={targetSlides}
                                onChange={(e) => setTargetSlides(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="30"
                                max="120"
                                value={targetDuration}
                                onChange={(e) => setTargetDuration(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty Level</Label>
                            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                                <SelectTrigger id="difficulty">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Interactive Elements */}
                    <div className="space-y-3">
                        <Label>Interactive Elements</Label>
                        <div className="flex gap-4">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={includeQuizzes}
                                    onChange={(e) => setIncludeQuizzes(e.target.checked)}
                                    className="size-4"
                                />
                                <span className="text-sm">Include Quiz Questions</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={includeDiscussions}
                                    onChange={(e) => setIncludeDiscussions(e.target.checked)}
                                    className="size-4"
                                />
                                <span className="text-sm">Include Discussion Prompts</span>
                            </label>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                        <Label>Upload Course Materials</Label>
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-purple-400">
                            <Upload className="mx-auto mb-3 size-12 text-gray-400" />
                            <p className="mb-2 text-sm font-semibold text-gray-800">
                                Upload lecture notes, readings, and outlines
                            </p>
                            <p className="mb-1 text-xs text-gray-700">
                                Supported: PDF, DOCX, TXT, Markdown | Max 10MB per file
                            </p>
                            <p className="mb-3 text-xs text-gray-600">
                                Google Docs: export as PDF or DOCX before upload
                            </p>
                            <Input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.md"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || [])
                                    setUploadedFiles(prev => [...prev, ...files])
                                }}
                                className="mx-auto max-w-xs"
                            />
                        </div>

                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-600">Uploaded Files ({uploadedFiles.length})</Label>
                                <div className="max-h-32 space-y-1 overflow-y-auto">
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="size-4 text-gray-500" />
                                                <span className="max-w-xs truncate">{file.name}</span>
                                                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)}KB)</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-3 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-md duration-500 animate-in fade-in-50">
                            <div className="flex items-center gap-2 text-lg font-semibold text-green-800">
                                <CheckCircle2 className="size-6 text-green-600" />
                                Presentation Generated Successfully!
                            </div>
                            <div className="space-y-1 text-sm text-green-700">
                                <p>✓ <strong>{result.slideCount} slides</strong> created</p>
                                <p>✓ Lecture notes included for each slide</p>
                                <p>✓ Based on your uploaded materials</p>
                                <p>✓ Ready for download in multiple formats</p>
                            </div>
                            <div className="flex animate-pulse items-center gap-2 text-sm font-medium text-green-600">
                                <Loader2 className="size-4 animate-spin" />
                                Redirecting to results page...
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || isUploading || !title.trim()}
                        className="w-full"
                        size="lg"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Uploading Files ({uploadedFiles.length})...
                            </>
                        ) : isGenerating ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Generating Presentation...
                            </>
                        ) : (
                            <>
                                <Monitor className="mr-2 size-4" />
                                Generate PowerPoint Presentation
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-gray-600">
                        Generation typically takes 1-3 minutes depending on content complexity
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
