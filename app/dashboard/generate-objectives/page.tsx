"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Target,
    Loader2,
    CheckCircle,
    Copy,
    ArrowLeft,
    Save,
    Download
} from "lucide-react"
import Link from "next/link"

interface Objective {
    id: string
    text: string
    bloomLevel: string
}

interface Resource {
    title: string
    author: string
    type: string
    relevance: string
    videoUrl?: string
    url?: string
}

export default function GenerateObjectivesPage() {
    const [courseTitle, setCourseTitle] = useState("")
    const [courseDescription, setCourseDescription] = useState("")
    const [level, setLevel] = useState("")
    const [duration, setDuration] = useState("")
    const [loading, setLoading] = useState(false)
    const [objectives, setObjectives] = useState<Objective[]>([])
    const [recommendedResources, setRecommendedResources] = useState<Resource[]>([])
    const [refinePrompt, setRefinePrompt] = useState("")
    const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null)

    const updateObjective = (id: string, newText: string) => {
        setObjectives(objectives.map(obj => 
            obj.id === id ? { ...obj, text: newText } : obj
        ))
    }

    const deleteObjective = (id: string) => {
        setObjectives(objectives.filter(obj => obj.id !== id))
    }

    const addNewObjective = () => {
        const newId = (objectives.length + 1).toString()
        setObjectives([...objectives, {
            id: newId,
            text: "New learning objective",
            bloomLevel: "Understand"
        }])
    }

    const refineObjectives = () => {
        if (!refinePrompt.trim()) return
        
        setLoading(true)
        // Simulate refining objectives
        setTimeout(() => {
            // In real implementation, this would call AI to refine based on prompt
            alert(`Objectives would be refined based on: "${refinePrompt}"`)
            setRefinePrompt("")
            setLoading(false)
        }, 1500)
    }

    const handleGenerate = async () => {
        if (!courseTitle || !courseDescription) {
            alert("Please fill in course title and description")
            return
        }

        setLoading(true)
        
        // Simulate AI generation
        setTimeout(() => {
            const generated: Objective[] = [
                {
                    id: "1",
                    text: `Analyze and evaluate key concepts in ${courseTitle}`,
                    bloomLevel: "Analyze"
                },
                {
                    id: "2",
                    text: `Apply theoretical frameworks to practical scenarios`,
                    bloomLevel: "Apply"
                },
                {
                    id: "3",
                    text: `Create innovative solutions using course principles`,
                    bloomLevel: "Create"
                },
                {
                    id: "4",
                    text: `Demonstrate understanding of fundamental concepts`,
                    bloomLevel: "Understand"
                },
                {
                    id: "5",
                    text: `Evaluate different approaches and methodologies`,
                    bloomLevel: "Evaluate"
                }
            ]
            setObjectives(generated)
            
            // Generate resource recommendations based on course with videos
            const resources: Resource[] = [
                {
                    title: `Introduction to ${courseTitle}`,
                    author: "Leading Expert in Field",
                    type: "Textbook",
                    relevance: "Core foundational text covering all course objectives",
                    url: "https://example.com/textbook"
                },
                {
                    title: `${courseTitle} - Complete Video Course`,
                    author: "freeCodeCamp.org",
                    type: "Video Tutorial",
                    relevance: "Comprehensive video series covering key concepts with practical examples",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                },
                {
                    title: `Advanced Topics in ${courseTitle}`,
                    author: "Research Scholar",
                    type: "Reference Book",
                    relevance: "Supplementary reading for deeper understanding"
                },
                {
                    title: "Quick Start Tutorial - ${courseTitle}",
                    author: "Traversy Media",
                    type: "YouTube Playlist",
                    relevance: "Step-by-step video tutorials for beginners",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                },
                {
                    title: "Interactive Learning Platform",
                    author: "Online Resource",
                    type: "Digital Platform",
                    relevance: "Hands-on practice and exercises",
                    url: "https://example.com/platform"
                },
                {
                    title: "Journal of Modern Practices",
                    author: "Academic Journal",
                    type: "Periodical",
                    relevance: "Current research and case studies"
                }
            ]
            setRecommendedResources(resources)
            
            setLoading(false)
        }, 2000)
    }

    const copyObjective = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const exportObjectives = () => {
        const text = objectives.map((obj, i) => `${i + 1}. ${obj.text} [${obj.bloomLevel}]`).join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${courseTitle}-objectives.txt`
        a.click()
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <Link href="/dashboard/course-design-studio">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 size-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                    <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                        <Target className="size-8 text-blue-600" />
                        Generate Learning Objectives
                    </h2>
                    <p className="text-muted-foreground">
                        AI-crafted learning goals aligned with Bloom&apos;s Taxonomy
                    </p>
                </div>
                {objectives.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportObjectives}>
                            <Download className="mr-2 size-4" />
                            Export
                        </Button>
                        <Button>
                            <Save className="mr-2 size-4" />
                            Save to Course
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Course Information</CardTitle>
                        <CardDescription>
                            Provide details about your course to generate tailored learning objectives
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Introduction to Data Science"
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Course Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the course content, topics covered, and main focus areas..."
                                rows={6}
                                value={courseDescription}
                                onChange={(e) => setCourseDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="level">Course Level</Label>
                                <Input
                                    id="level"
                                    placeholder="e.g., Undergraduate"
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration</Label>
                                <Input
                                    id="duration"
                                    placeholder="e.g., 15 weeks"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>
                        </div>

                        <Separator />

                        <Button 
                            className="w-full" 
                            size="lg"
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Generating Objectives...
                                </>
                            ) : (
                                <>
                                    <Target className="mr-2 size-4" />
                                    Generate Learning Objectives
                                </>
                            )}
                        </Button>

                        <Alert>
                            <AlertDescription className="text-xs">
                                💡 Our AI will create SMART learning objectives aligned with Bloom&apos;s Taxonomy levels
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Generated Objectives */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                Generated Objectives
                                {objectives.length > 0 && (
                                    <Badge variant="secondary">{objectives.length} objectives</Badge>
                                )}
                            </div>
                            {objectives.length > 0 && (
                                <Button size="sm" variant="outline" onClick={addNewObjective}>
                                    <Target className="mr-2 size-4" />
                                    Add Objective
                                </Button>
                            )}
                        </CardTitle>
                        <CardDescription>
                            AI-generated learning objectives - click to edit or refine below
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {objectives.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Target className="mx-auto mb-4 size-12 opacity-20" />
                                <p>No objectives generated yet</p>
                                <p className="text-sm">Fill in the form and click Generate</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {objectives.map((obj, index) => (
                                        <Card key={obj.id} className="group border-l-4 border-l-blue-500">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {obj.bloomLevel}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                Objective {index + 1}
                                                            </span>
                                                        </div>
                                                        {editingObjectiveId === obj.id ? (
                                                            <Textarea
                                                                value={obj.text}
                                                                onChange={(e) => updateObjective(obj.id, e.target.value)}
                                                                onBlur={() => setEditingObjectiveId(null)}
                                                                className="min-h-[80px] text-sm"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <p className="text-sm leading-relaxed">{obj.text}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => setEditingObjectiveId(obj.id)}
                                                            className="size-8 p-0"
                                                        >
                                                            ✏️
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => copyObjective(obj.text)}
                                                            className="size-8 p-0"
                                                        >
                                                            <Copy className="size-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => deleteObjective(obj.id)}
                                                            className="size-8 p-0 hover:text-red-600"
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Refine Section */}
                                <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
                                    <CardHeader>
                                        <CardTitle className="text-base">🎨 Refine Objectives</CardTitle>
                                        <CardDescription>
                                            Ask AI to adjust the objectives based on your feedback
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Textarea
                                            value={refinePrompt}
                                            onChange={(e) => setRefinePrompt(e.target.value)}
                                            placeholder="E.g., Make them more specific, add technical focus, align with industry standards..."
                                            className="min-h-[80px]"
                                        />
                                        <Button 
                                            onClick={refineObjectives}
                                            disabled={!refinePrompt.trim() || loading}
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Refining...
                                                </>
                                            ) : (
                                                "✨ Refine with AI"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bloom's Taxonomy Reference */}
            {objectives.length > 0 && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">📚 Bloom&apos;s Taxonomy Reference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                                <div>
                                    <Badge className="mb-1">Remember</Badge>
                                    <p className="text-xs text-muted-foreground">Recall facts and basic concepts</p>
                                </div>
                                <div>
                                    <Badge className="mb-1">Understand</Badge>
                                    <p className="text-xs text-muted-foreground">Explain ideas or concepts</p>
                                </div>
                                <div>
                                    <Badge className="mb-1">Apply</Badge>
                                    <p className="text-xs text-muted-foreground">Use information in new situations</p>
                                </div>
                                <div>
                                    <Badge className="mb-1">Analyze</Badge>
                                    <p className="text-xs text-muted-foreground">Draw connections among ideas</p>
                                </div>
                                <div>
                                    <Badge className="mb-1">Evaluate</Badge>
                                    <p className="text-xs text-muted-foreground">Justify decisions or actions</p>
                                </div>
                                <div>
                                    <Badge className="mb-1">Create</Badge>
                                    <p className="text-xs text-muted-foreground">Produce new or original work</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommended Resources */}
                    <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:border-green-900 dark:from-green-950/10 dark:to-blue-950/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                📖 Recommended Textbooks & Resources
                                <Badge variant="secondary">{recommendedResources.length} suggestions</Badge>
                            </CardTitle>
                            <CardDescription>
                                AI-recommended materials to support your learning objectives
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recommendedResources.map((resource, index) => {
                                    const videoId = resource.videoUrl ? (resource.videoUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)/) || [])[1] : null
                                    return (
                                        <div key={index} className="space-y-3 rounded-lg border bg-white p-4 dark:bg-gray-900">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {resource.type}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            #{index + 1}
                                                        </span>
                                                    </div>
                                                    <h4 className="mb-1 text-sm font-semibold">{resource.title}</h4>
                                                    <p className="mb-2 text-xs text-muted-foreground">
                                                        By {resource.author}
                                                    </p>
                                                    <p className="text-xs italic text-muted-foreground">
                                                        💡 {resource.relevance}
                                                    </p>
                                                    {resource.url && (
                                                        <a 
                                                            href={resource.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                                                        >
                                                            🔗 View Resource
                                                        </a>
                                                    )}
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => copyObjective(resource.title + " by " + resource.author)}
                                                >
                                                    <Copy className="size-4" />
                                                </Button>
                                            </div>
                                            {videoId && (
                                                <div className="overflow-hidden rounded-lg border">
                                                    <iframe
                                                        width="100%"
                                                        height="200"
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        title={resource.title}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="w-full"
                                                    />
                                                    <div className="bg-muted p-2 text-xs">
                                                        <a 
                                                            href={resource.videoUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                                        >
                                                            📹 Watch on YouTube
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <Alert className="mt-4">
                                <AlertDescription className="text-xs">
                                    💡 These recommendations are based on your course objectives and level. Consider your institution&apos;s library access and budget when selecting resources.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
