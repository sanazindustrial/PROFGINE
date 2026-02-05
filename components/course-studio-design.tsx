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
}

export function CourseStudioDesign({ courseId }: CourseStudioDesignProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [templateStyle, setTemplateStyle] = useState("modern-minimalist")
    const [targetSlides, setTargetSlides] = useState("25")
    const [targetDuration, setTargetDuration] = useState("50")
    const [difficultyLevel, setDifficultyLevel] = useState("intermediate")
    const [includeQuizzes, setIncludeQuizzes] = useState(true)
    const [includeDiscussions, setIncludeDiscussions] = useState(true)
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
                    title,
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
                    <CardTitle>🎬 Professor GENIE Studio</CardTitle>
                    <CardDescription>
                        Upload lecture notes and materials, then generate slide decks with speaker notes for each class session
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeQuizzes}
                                    onChange={(e) => setIncludeQuizzes(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Include Quiz Questions</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeDiscussions}
                                    onChange={(e) => setIncludeDiscussions(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Include Discussion Prompts</span>
                            </label>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                        <Label>Upload Course Materials</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-sm text-gray-800 mb-2 font-semibold">
                                Upload lecture notes, readings, and outlines
                            </p>
                            <p className="text-xs text-gray-700 mb-1">
                                Supported: PDF, DOCX, TXT, Markdown | Max 10MB per file
                            </p>
                            <p className="text-xs text-gray-600 mb-3">
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
                                className="max-w-xs mx-auto"
                            />
                        </div>

                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-600">Uploaded Files ({uploadedFiles.length})</Label>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {uploadedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                                <span className="truncate max-w-xs">{file.name}</span>
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
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-5 rounded-lg space-y-3 shadow-md animate-in fade-in-50 duration-500">
                            <div className="flex items-center gap-2 text-green-800 font-semibold text-lg">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                ✨ Presentation Generated Successfully!
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                                <p>✓ <strong>{result.slideCount} slides</strong> created</p>
                                <p>✓ Lecture notes included for each slide</p>
                                <p>✓ Based on your uploaded materials</p>
                                <p>✓ Ready for download in multiple formats</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium animate-pulse">
                                <Loader2 className="h-4 w-4 animate-spin" />
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
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading Files ({uploadedFiles.length})...
                            </>
                        ) : isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Presentation...
                            </>
                        ) : (
                            <>
                                <Monitor className="mr-2 h-4 w-4" />
                                Generate PowerPoint Presentation
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-gray-600 text-center">
                        Generation typically takes 1-3 minutes depending on content complexity
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
