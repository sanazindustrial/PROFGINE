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
    BookOpen,
    Loader2,
    ArrowLeft,
    Save,
    Download,
    Clock,
    CheckCircle
} from "lucide-react"
import Link from "next/link"

interface Module {
    id: string
    week: number
    title: string
    topics: string[]
    duration: string
}

export default function SuggestCurriculumPage() {
    const [courseTitle, setCourseTitle] = useState("")
    const [courseDescription, setCourseDescription] = useState("")
    const [weeks, setWeeks] = useState("15")
    const [loading, setLoading] = useState(false)
    const [modules, setModules] = useState<Module[]>([])

    const handleGenerate = async () => {
        if (!courseTitle || !courseDescription) {
            alert("Please fill in course title and description")
            return
        }

        setLoading(true)
        
        // Simulate AI generation
        setTimeout(() => {
            const generated: Module[] = [
                {
                    id: "1",
                    week: 1,
                    title: "Introduction and Fundamentals",
                    topics: ["Course overview", "Key concepts", "Historical context"],
                    duration: "3 hours"
                },
                {
                    id: "2",
                    week: 2,
                    title: "Core Principles",
                    topics: ["Theoretical foundations", "Main frameworks", "Case studies"],
                    duration: "3 hours"
                },
                {
                    id: "3",
                    week: 3,
                    title: "Practical Applications",
                    topics: ["Real-world examples", "Hands-on exercises", "Problem solving"],
                    duration: "4 hours"
                },
                {
                    id: "4",
                    week: 4,
                    title: "Advanced Topics",
                    topics: ["Complex scenarios", "Research methods", "Critical analysis"],
                    duration: "4 hours"
                },
                {
                    id: "5",
                    week: 5,
                    title: "Integration and Synthesis",
                    topics: ["Connecting concepts", "Comprehensive review", "Final project"],
                    duration: "5 hours"
                }
            ]
            setModules(generated)
            setLoading(false)
        }, 2500)
    }

    const exportCurriculum = () => {
        let text = `Course Curriculum: ${courseTitle}\n\n`
        modules.forEach(module => {
            text += `Week ${module.week}: ${module.title}\n`
            text += `Duration: ${module.duration}\n`
            text += `Topics:\n`
            module.topics.forEach(topic => {
                text += `  • ${topic}\n`
            })
            text += '\n'
        })
        
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${courseTitle}-curriculum.txt`
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
                        <BookOpen className="size-8 text-green-600" />
                        Suggest Course Curriculum
                    </h2>
                    <p className="text-muted-foreground">
                        Course structure recommendations with weekly breakdown
                    </p>
                </div>
                {modules.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportCurriculum}>
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
                        <CardTitle>Course Details</CardTitle>
                        <CardDescription>
                            Provide course information to generate a structured curriculum
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Web Development Fundamentals"
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Course Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the course goals, main topics, and target audience..."
                                rows={6}
                                value={courseDescription}
                                onChange={(e) => setCourseDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weeks">Course Duration (weeks)</Label>
                            <Input
                                id="weeks"
                                type="number"
                                placeholder="15"
                                value={weeks}
                                onChange={(e) => setWeeks(e.target.value)}
                            />
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
                                    Generating Curriculum...
                                </>
                            ) : (
                                <>
                                    <BookOpen className="mr-2 size-4" />
                                    Generate Curriculum
                                </>
                            )}
                        </Button>

                        <Alert>
                            <AlertDescription className="text-xs">
                                💡 AI will create a week-by-week curriculum with topics and time estimates
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Generated Curriculum */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Course Structure
                                {modules.length > 0 && (
                                    <Badge variant="secondary">{modules.length} modules</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Weekly curriculum breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {modules.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <BookOpen className="mx-auto mb-4 size-12 opacity-20" />
                                    <p>No curriculum generated yet</p>
                                    <p className="text-sm">Fill in the form and click Generate</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {modules.map((module, index) => (
                                        <Card key={module.id} className="border-l-4 border-l-green-500">
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <Badge variant="outline">Week {module.week}</Badge>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Clock className="mr-1 size-3" />
                                                                    {module.duration}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-semibold">{module.title}</h4>
                                                        </div>
                                                    </div>
                                                    <Separator />
                                                    <div>
                                                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                            Topics Covered:
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {module.topics.map((topic, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                                    <CheckCircle className="mt-1 size-3 shrink-0 text-green-600" />
                                                                    {topic}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Statistics */}
            {modules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">📊 Curriculum Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-green-600">{modules.length}</div>
                                <p className="text-sm text-muted-foreground">Modules</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {modules.reduce((sum, m) => sum + m.topics.length, 0)}
                                </div>
                                <p className="text-sm text-muted-foreground">Total Topics</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-purple-600">{weeks}</div>
                                <p className="text-sm text-muted-foreground">Weeks</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
