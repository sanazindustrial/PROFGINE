"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, FileText, Presentation, Download } from "lucide-react"

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

    const handleGenerate = async () => {
        if (!title.trim()) {
            setError("Please enter a presentation title")
            return
        }

        setIsGenerating(true)
        setError("")
        setResult(null)

        try {
            const response = await fetch("/api/course-studio/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    courseId,
                    title,
                    sources: [], // File upload would populate this
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
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>🎬 Course Studio Design</CardTitle>
                    <CardDescription>
                        Generate professional PowerPoint presentations from your textbooks, resources, and lecture notes
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600 mb-2">
                            Upload source materials (optional)
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                            Textbooks (PDF), Lecture Notes (Word, Text), Research Papers
                        </p>
                        <Button variant="outline" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Choose Files
                        </Button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-green-800 font-medium">
                                <Presentation className="h-5 w-5" />
                                Presentation Generated Successfully!
                            </div>
                            <div className="text-sm text-green-700">
                                <p>Slide Count: {result.slideCount} slides</p>
                                <p>Status: {result.status}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" asChild>
                                    <a href={result.downloadUrl} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PPTX
                                    </a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={result.previewUrl} target="_blank" rel="noopener noreferrer">
                                        Preview
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !title.trim()}
                        className="w-full"
                        size="lg"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Presentation...
                            </>
                        ) : (
                            <>
                                <Presentation className="mr-2 h-4 w-4" />
                                Generate PowerPoint Presentation
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        Generation typically takes 1-3 minutes depending on content complexity
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
