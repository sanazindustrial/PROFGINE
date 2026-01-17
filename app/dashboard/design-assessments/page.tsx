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
    GraduationCap,
    Loader2,
    ArrowLeft,
    Save,
    Download,
    CheckCircle,
    FileText
} from "lucide-react"
import Link from "next/link"

interface Assessment {
    id: string
    type: string
    title: string
    description: string
    points: number
    dueWeek: number
    rubric: string[]
}

export default function DesignAssessmentsPage() {
    const [courseTitle, setCourseTitle] = useState("")
    const [objectives, setObjectives] = useState("")
    const [assessmentType, setAssessmentType] = useState("mixed")
    const [loading, setLoading] = useState(false)
    const [assessments, setAssessments] = useState<Assessment[]>([])

    const handleGenerate = async () => {
        if (!courseTitle || !objectives) {
            alert("Please fill in course title and learning objectives")
            return
        }

        setLoading(true)
        
        // Simulate AI generation
        setTimeout(() => {
            const generated: Assessment[] = [
                {
                    id: "1",
                    type: "Assignment",
                    title: "Foundational Analysis",
                    description: "Analyze key concepts and apply them to a real-world scenario",
                    points: 100,
                    dueWeek: 3,
                    rubric: [
                        "Understanding of core concepts (30%)",
                        "Application to scenario (40%)",
                        "Critical thinking (30%)"
                    ]
                },
                {
                    id: "2",
                    type: "Project",
                    title: "Midterm Project",
                    description: "Create a comprehensive solution demonstrating course principles",
                    points: 200,
                    dueWeek: 8,
                    rubric: [
                        "Design quality (25%)",
                        "Implementation (35%)",
                        "Documentation (20%)",
                        "Presentation (20%)"
                    ]
                },
                {
                    id: "3",
                    type: "Exam",
                    title: "Comprehensive Final Exam",
                    description: "Demonstrate mastery of all course material",
                    points: 150,
                    dueWeek: 15,
                    rubric: [
                        "Theoretical knowledge (40%)",
                        "Problem solving (35%)",
                        "Synthesis and application (25%)"
                    ]
                },
                {
                    id: "4",
                    type: "Quiz",
                    title: "Weekly Knowledge Checks",
                    description: "Quick assessments to reinforce learning",
                    points: 50,
                    dueWeek: 14,
                    rubric: [
                        "Accuracy (60%)",
                        "Completion (40%)"
                    ]
                }
            ]
            setAssessments(generated)
            setLoading(false)
        }, 2500)
    }

    const exportAssessments = () => {
        let text = `Course Assessments: ${courseTitle}\n\n`
        assessments.forEach((assessment, index) => {
            text += `${index + 1}. ${assessment.title} (${assessment.type})\n`
            text += `   Points: ${assessment.points}\n`
            text += `   Due: Week ${assessment.dueWeek}\n`
            text += `   Description: ${assessment.description}\n`
            text += `   Rubric:\n`
            assessment.rubric.forEach(criterion => {
                text += `   • ${criterion}\n`
            })
            text += '\n'
        })
        
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${courseTitle}-assessments.txt`
        a.click()
    }

    const getTypeColor = (type: string) => {
        switch(type) {
            case "Assignment": return "bg-blue-500"
            case "Project": return "bg-purple-500"
            case "Exam": return "bg-red-500"
            case "Quiz": return "bg-green-500"
            default: return "bg-gray-500"
        }
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
                        <GraduationCap className="size-8 text-purple-600" />
                        Design Assessments
                    </h2>
                    <p className="text-muted-foreground">
                        Smart assignment creation with rubrics and grading criteria
                    </p>
                </div>
                {assessments.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportAssessments}>
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
                        <CardTitle>Assessment Planning</CardTitle>
                        <CardDescription>
                            Define course requirements to generate appropriate assessments
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Advanced Programming"
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="objectives">Learning Objectives *</Label>
                            <Textarea
                                id="objectives"
                                placeholder="List your course learning objectives..."
                                rows={5}
                                value={objectives}
                                onChange={(e) => setObjectives(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Assessment Mix</Label>
                            <select
                                id="type"
                                aria-label="Assessment Mix"
                                className="w-full rounded-md border p-2"
                                value={assessmentType}
                                onChange={(e) => setAssessmentType(e.target.value)}
                            >
                                <option value="mixed">Mixed (Assignments, Projects, Exams)</option>
                                <option value="project-based">Project-Based Only</option>
                                <option value="exam-focused">Exam Focused</option>
                                <option value="continuous">Continuous Assessment</option>
                            </select>
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
                                    Generating Assessments...
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="mr-2 size-4" />
                                    Generate Assessment Plan
                                </>
                            )}
                        </Button>

                        <Alert>
                            <AlertDescription className="text-xs">
                                💡 AI will create assessments with clear rubrics aligned to learning objectives
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Generated Assessments */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Assessment Plan
                                {assessments.length > 0 && (
                                    <Badge variant="secondary">{assessments.length} assessments</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Generated assessments with rubrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {assessments.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <GraduationCap className="mx-auto mb-4 size-12 opacity-20" />
                                    <p>No assessments generated yet</p>
                                    <p className="text-sm">Fill in the form and click Generate</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {assessments.map((assessment) => (
                                        <Card key={assessment.id} className="border-l-4 border-l-purple-500">
                                            <CardContent className="space-y-3 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <Badge className={getTypeColor(assessment.type)}>
                                                                {assessment.type}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                Week {assessment.dueWeek}
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                {assessment.points} pts
                                                            </Badge>
                                                        </div>
                                                        <h4 className="mb-1 font-semibold">{assessment.title}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {assessment.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                        <FileText className="size-3" />
                                                        Grading Rubric:
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {assessment.rubric.map((criterion, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                                <CheckCircle className="mt-1 size-3 shrink-0 text-purple-600" />
                                                                {criterion}
                                                            </li>
                                                        ))}
                                                    </ul>
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
            {assessments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">📊 Assessment Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-purple-600">{assessments.length}</div>
                                <p className="text-sm text-muted-foreground">Assessments</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {assessments.reduce((sum, a) => sum + a.points, 0)}
                                </div>
                                <p className="text-sm text-muted-foreground">Total Points</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {assessments.filter(a => a.type === "Assignment").length}
                                </div>
                                <p className="text-sm text-muted-foreground">Assignments</p>
                            </div>
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="text-3xl font-bold text-red-600">
                                    {assessments.filter(a => a.type === "Project").length}
                                </div>
                                <p className="text-sm text-muted-foreground">Projects</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
