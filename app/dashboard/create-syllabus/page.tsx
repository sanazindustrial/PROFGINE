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
    FileText,
    Loader2,
    ArrowLeft,
    Save,
    Download,
    CheckCircle,
    Eye,
    BookOpen,
    Plus,
    X,
    GripVertical,
    Edit2,
    Trash2
} from "lucide-react"
import Link from "next/link"

interface Resource {
    id: string
    type: string
    title: string
    author?: string
    isbn?: string
    videoUrl?: string
    required: boolean
}

interface ScheduleItem {
    id: string
    week: number
    topic: string
}

export default function CreateSyllabusPage() {
    const [courseTitle, setCourseTitle] = useState("")
    const [courseCode, setCourseCode] = useState("")
    const [instructor, setInstructor] = useState("")
    const [semester, setSemester] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [syllabus, setSyllabus] = useState<any>(null)
    
    // Resources state
    const [resources, setResources] = useState<Resource[]>([])
    const [newResourceType, setNewResourceType] = useState("Textbook")
    const [newResourceTitle, setNewResourceTitle] = useState("")
    const [newResourceAuthor, setNewResourceAuthor] = useState("")
    const [newResourceIsbn, setNewResourceIsbn] = useState("")
    const [newResourceVideoUrl, setNewResourceVideoUrl] = useState("")
    const [newResourceRequired, setNewResourceRequired] = useState(true)
    
    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<number | null>(null)
    
    // Edit mode states
    const [editingObjective, setEditingObjective] = useState<number | null>(null)
    const [editingModule, setEditingModule] = useState<string | null>(null)

    // Add resource
    const addResource = () => {
        if (!newResourceTitle) return
        
        const newResource: Resource = {
            id: Date.now().toString(),
            type: newResourceType,
            title: newResourceTitle,
            author: newResourceAuthor || undefined,
            isbn: newResourceIsbn || undefined,
            videoUrl: newResourceVideoUrl || undefined,
            required: newResourceRequired
        }
        
        setResources([...resources, newResource])
        setNewResourceTitle("")
        setNewResourceAuthor("")
        setNewResourceIsbn("")
        setNewResourceVideoUrl("")
        setNewResourceRequired(true)
    }

    // Extract YouTube video ID from URL
    const getYouTubeVideoId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const removeResource = (id: string) => {
        setResources(resources.filter(r => r.id !== id))
    }

    // Add manual module
    const addManualModule = () => {
        if (!syllabus) return
        
        const newWeek = syllabus.schedule.length + 1
        const newModule: ScheduleItem = {
            id: Date.now().toString(),
            week: newWeek,
            topic: "New Topic"
        }
        
        setSyllabus({
            ...syllabus,
            schedule: [...syllabus.schedule, newModule]
        })
    }

    // Remove module
    const removeModule = (id: string) => {
        if (!syllabus) return
        
        const updatedSchedule = syllabus.schedule
            .filter((item: ScheduleItem) => item.id !== id)
            .map((item: ScheduleItem, index: number) => ({
                ...item,
                week: index + 1
            }))
        
        setSyllabus({
            ...syllabus,
            schedule: updatedSchedule
        })
    }

    // Update module topic
    const updateModuleTopic = (id: string, newTopic: string) => {
        if (!syllabus) return
        
        setSyllabus({
            ...syllabus,
            schedule: syllabus.schedule.map((item: ScheduleItem) =>
                item.id === id ? { ...item, topic: newTopic } : item
            )
        })
    }

    // Update objective
    const updateObjective = (index: number, newText: string) => {
        if (!syllabus) return
        
        const updatedObjectives = [...syllabus.objectives]
        updatedObjectives[index] = newText
        
        setSyllabus({
            ...syllabus,
            objectives: updatedObjectives
        })
    }

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedItem(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        
        if (draggedItem === null || draggedItem === index) return
        
        const schedule = [...syllabus.schedule]
        const draggedModule = schedule[draggedItem]
        
        schedule.splice(draggedItem, 1)
        schedule.splice(index, 0, draggedModule)
        
        // Update week numbers
        const updatedSchedule = schedule.map((item, idx) => ({
            ...item,
            week: idx + 1
        }))
        
        setSyllabus({
            ...syllabus,
            schedule: updatedSchedule
        })
        
        setDraggedItem(index)
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
    }

    const handleGenerate = async () => {
        if (!courseTitle || !courseCode) {
            alert("Please fill in required fields (Course Title and Code)")
            return
        }

        setLoading(true)
        
        // Simulate AI generation
        setTimeout(() => {
            const generated = {
                header: {
                    courseTitle,
                    courseCode,
                    instructor: instructor || "TBD",
                    semester: semester || "Fall 2024",
                    credits: 3,
                    meetingTime: "TBD"
                },
                description: description || "This course provides comprehensive coverage of essential topics...",
                objectives: [
                    "Demonstrate understanding of fundamental concepts",
                    "Apply theoretical knowledge to practical scenarios",
                    "Analyze complex problems using course frameworks",
                    "Evaluate different methodologies critically",
                    "Create innovative solutions to real-world challenges"
                ],
                schedule: [
                    { id: "1", week: 1, topic: "Introduction & Course Overview" },
                    { id: "2", week: 2, topic: "Fundamental Concepts" },
                    { id: "3", week: 3, topic: "Core Principles & Theory" },
                    { id: "4", week: 4, topic: "Practical Applications" },
                    { id: "5", week: 5, topic: "Advanced Topics" },
                    { id: "6", week: 6, topic: "Case Studies & Analysis" },
                    { id: "7", week: 7, topic: "Midterm Review" },
                    { id: "8", week: 8, topic: "Midterm Examination" },
                    { id: "9", week: 9, topic: "Research Methods" },
                    { id: "10", week: 10, topic: "Special Topics" },
                    { id: "11", week: 11, topic: "Integration & Synthesis" },
                    { id: "12", week: 12, topic: "Final Project Work" },
                    { id: "13", week: 13, topic: "Presentations" },
                    { id: "14", week: 14, topic: "Final Review" },
                    { id: "15", week: 15, topic: "Final Examination" }
                ],
                grading: [
                    { component: "Assignments", percentage: 30 },
                    { component: "Midterm Exam", percentage: 25 },
                    { component: "Final Project", percentage: 30 },
                    { component: "Participation", percentage: 15 }
                ],
                policies: {
                    attendance: "Regular attendance is expected. More than 3 unexcused absences may affect your grade.",
                    latework: "Late submissions will incur a 10% penalty per day, up to 3 days.",
                    academic: "All work must be original. Plagiarism will result in disciplinary action.",
                    accessibility: "Students with disabilities should contact the instructor to arrange accommodations."
                }
            }
            setSyllabus(generated)
            setLoading(false)
        }, 3000)
    }

    const exportSyllabus = () => {
        if (!syllabus) return

        let text = `${syllabus.header.courseTitle}\n`
        text += `${syllabus.header.courseCode}\n`
        text += `Instructor: ${syllabus.header.instructor}\n`
        text += `Semester: ${syllabus.header.semester}\n`
        text += `Credits: ${syllabus.header.credits}\n\n`
        
        text += `COURSE DESCRIPTION\n`
        text += `${syllabus.description}\n\n`
        
        text += `LEARNING OBJECTIVES\n`
        syllabus.objectives.forEach((obj: string, i: number) => {
            text += `${i + 1}. ${obj}\n`
        })
        text += '\n'
        
        // Add resources section
        if (resources.length > 0) {
            text += `REQUIRED MATERIALS & RESOURCES\n`
            const required = resources.filter(r => r.required)
            const optional = resources.filter(r => !r.required)
            
            if (required.length > 0) {
                text += `\nRequired:\n`
                required.forEach(r => {
                    text += `- ${r.title}`
                    if (r.author) text += ` by ${r.author}`
                    if (r.isbn) text += ` (${r.isbn})`
                    text += '\n'
                })
            }
            
            if (optional.length > 0) {
                text += `\nOptional:\n`
                optional.forEach(r => {
                    text += `- ${r.title}`
                    if (r.author) text += ` by ${r.author}`
                    if (r.isbn) text += ` (${r.isbn})`
                    text += '\n'
                })
            }
            text += '\n'
        }
        
        text += `COURSE SCHEDULE\n`
        syllabus.schedule.forEach((item: ScheduleItem) => {
            text += `Week ${item.week}: ${item.topic}\n`
        })
        text += '\n'
        
        text += `GRADING BREAKDOWN\n`
        syllabus.grading.forEach((item: any) => {
            text += `${item.component}: ${item.percentage}%\n`
        })
        text += '\n'
        
        text += `COURSE POLICIES\n`
        text += `Attendance: ${syllabus.policies.attendance}\n`
        text += `Late Work: ${syllabus.policies.latework}\n`
        text += `Academic Integrity: ${syllabus.policies.academic}\n`
        text += `Accessibility: ${syllabus.policies.accessibility}\n`
        
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${courseCode}-syllabus.txt`
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
                        <FileText className="size-8 text-orange-600" />
                        Create Course Syllabus
                    </h2>
                    <p className="text-muted-foreground">
                        Complete syllabus generation with policies and schedule
                    </p>
                </div>
                {syllabus && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportSyllabus}>
                            <Download className="mr-2 size-4" />
                            Export PDF
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
                            Provide basic course details to generate a complete syllabus
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Course Code *</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g., CS 101"
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="semester">Semester</Label>
                                <Input
                                    id="semester"
                                    placeholder="e.g., Fall 2024"
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Introduction to Computer Science"
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instructor">Instructor Name</Label>
                            <Input
                                id="instructor"
                                placeholder="e.g., Dr. Jane Smith"
                                value={instructor}
                                onChange={(e) => setInstructor(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Course Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief overview of the course content and goals..."
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <Separator />

                        {/* Resources Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">📚 Course Resources & Textbooks</Label>
                            </div>

                            {/* Add Resource Form */}
                            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Type</Label>
                                        <select
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={newResourceType}
                                            onChange={(e) => setNewResourceType(e.target.value)}
                                            aria-label="Resource Type"
                                        >
                                            <option value="Textbook">Textbook</option>
                                            <option value="Reference Book">Reference Book</option>
                                            <option value="Article">Article</option>
                                            <option value="Online Resource">Online Resource</option>
                                            <option value="Video Tutorial">📹 Video Tutorial</option>
                                            <option value="YouTube Playlist">📺 YouTube Playlist</option>
                                            <option value="Software">Software</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Status</Label>
                                        <select
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={newResourceRequired ? "required" : "optional"}
                                            onChange={(e) => setNewResourceRequired(e.target.value === "required")}
                                            aria-label="Resource Status"
                                        >
                                            <option value="required">Required</option>
                                            <option value="optional">Optional</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Title *</Label>
                                    <Input
                                        placeholder="e.g., Introduction to Algorithms"
                                        value={newResourceTitle}
                                        onChange={(e) => setNewResourceTitle(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Author(s)</Label>
                                        <Input
                                            placeholder="e.g., Cormen, et al."
                                            value={newResourceAuthor}
                                            onChange={(e) => setNewResourceAuthor(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">ISBN/URL</Label>
                                        <Input
                                            placeholder="ISBN or link"
                                            value={newResourceIsbn}
                                            onChange={(e) => setNewResourceIsbn(e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>

                                {(newResourceType === "Video Tutorial" || newResourceType === "YouTube Playlist") && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">YouTube URL 📹</Label>
                                        <Input
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={newResourceVideoUrl}
                                            onChange={(e) => setNewResourceVideoUrl(e.target.value)}
                                            className="text-sm"
                                        />
                                        {newResourceVideoUrl && getYouTubeVideoId(newResourceVideoUrl) && (
                                            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                                ✓ Valid YouTube link detected
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={addResource}
                                    disabled={!newResourceTitle}
                                    className="w-full"
                                >
                                    <Plus className="mr-2 size-3" />
                                    Add Resource
                                </Button>
                            </div>

                            {/* Resources List */}
                            {resources.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        {resources.length} resource{resources.length !== 1 ? 's' : ''} added
                                    </p>
                                    {resources.map((resource) => (
                                        <div key={resource.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <BookOpen className="mt-0.5 size-4 shrink-0 text-blue-600" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-medium">{resource.title}</span>
                                                        <Badge variant={resource.required ? "default" : "secondary"} className="text-xs">
                                                            {resource.required ? "Required" : "Optional"}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {resource.type}
                                                        </Badge>
                                                    </div>
                                                    {resource.author && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {resource.author}
                                                        </p>
                                                    )}
                                                    {resource.isbn && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {resource.isbn.startsWith('http') ? (
                                                                <a href={resource.isbn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                                    🔗 View Link
                                                                </a>
                                                            ) : `ISBN: ${resource.isbn}`}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeResource(resource.id)}
                                                >
                                                    <X className="size-3" />
                                                </Button>
                                            </div>
                                            {resource.videoUrl && getYouTubeVideoId(resource.videoUrl) && (
                                                <div className="ml-6 overflow-hidden rounded-lg border">
                                                    <iframe
                                                        width="100%"
                                                        height="200"
                                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(resource.videoUrl)}`}
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
                                    ))}
                                </div>
                            )}
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
                                    Generating Syllabus...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 size-4" />
                                    Generate Complete Syllabus
                                </>
                            )}
                        </Button>

                        <Alert>
                            <AlertDescription className="text-xs">
                                💡 AI will create a professional syllabus with objectives, schedule, grading, and policies
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Generated Syllabus */}
                <div className="space-y-4">
                    {!syllabus ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="text-center text-muted-foreground">
                                    <FileText className="mx-auto mb-4 size-12 opacity-20" />
                                    <p>No syllabus generated yet</p>
                                    <p className="text-sm">Fill in the form and click Generate</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Header */}
                            <Card>
                                <CardHeader className="bg-orange-50 dark:bg-orange-950/20">
                                    <CardTitle className="text-xl">{syllabus.header.courseTitle}</CardTitle>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>{syllabus.header.courseCode}</Badge>
                                            <Badge variant="outline">{syllabus.header.semester}</Badge>
                                            <Badge variant="secondary">{syllabus.header.credits} Credits</Badge>
                                        </div>
                                        <p className="text-sm">Instructor: {syllabus.header.instructor}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-sm">{syllabus.description}</p>
                                </CardContent>
                            </Card>

                            {/* Learning Objectives */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        Learning Objectives
                                        <Badge variant="secondary">{syllabus.objectives.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {syllabus.objectives.map((obj: string, i: number) => (
                                            <li key={i} className="group flex items-start gap-2">
                                                <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                                                {editingObjective === i ? (
                                                    <div className="flex flex-1 gap-2">
                                                        <Input
                                                            value={obj}
                                                            onChange={(e) => updateObjective(i, e.target.value)}
                                                            className="text-sm"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingObjective(null)}
                                                        >
                                                            ✓
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-1 items-start justify-between">
                                                        <span className="text-sm">{obj}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="size-6 p-0 opacity-0 group-hover:opacity-100"
                                                            onClick={() => setEditingObjective(i)}
                                                        >
                                                            <Edit2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Resources Display */}
                            {resources.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <BookOpen className="size-5 text-blue-600" />
                                            Course Resources
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {resources.map((resource) => (
                                                <div key={resource.id} className="space-y-1 text-sm">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-medium">{resource.title}</span>
                                                        <Badge variant={resource.required ? "default" : "secondary"} className="text-xs">
                                                            {resource.required ? "Required" : "Optional"}
                                                        </Badge>
                                                    </div>
                                                    {resource.author && (
                                                        <p className="text-xs text-muted-foreground">
                                                            By {resource.author}
                                                        </p>
                                                    )}
                                                    {resource.isbn && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {resource.isbn}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Grading */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Grading Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {syllabus.grading.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-sm">{item.component}</span>
                                                <Badge variant="secondary">{item.percentage}%</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Course Schedule Preview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span>Course Schedule (Drag to Reorder)</span>
                                        <div className="flex gap-2">
                                            <Badge variant="secondary">{syllabus.schedule.length} weeks</Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={addManualModule}
                                            >
                                                <Plus className="mr-1 size-3" />
                                                Add Week
                                            </Button>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-h-96 space-y-2 overflow-y-auto">
                                        {syllabus.schedule.map((item: ScheduleItem, index: number) => (
                                            <div
                                                key={item.id}
                                                draggable
                                                onDragStart={() => handleDragStart(index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`group flex cursor-move items-center gap-2 rounded-lg border bg-background p-2 transition-colors hover:bg-muted/50 ${
                                                    draggedItem === index ? 'opacity-50' : ''
                                                }`}
                                            >
                                                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                                                <span className="w-16 shrink-0 text-sm font-medium">Week {item.week}</span>
                                                
                                                {editingModule === item.id ? (
                                                    <div className="flex flex-1 gap-2">
                                                        <Input
                                                            value={item.topic}
                                                            onChange={(e) => updateModuleTopic(item.id, e.target.value)}
                                                            className="h-8 text-sm"
                                                            autoFocus
                                                            onBlur={() => setEditingModule(null)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') setEditingModule(null)
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-sm">{item.topic}</span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="size-7 p-0"
                                                                onClick={() => setEditingModule(item.id)}
                                                            >
                                                                <Edit2 className="size-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="size-7 p-0 hover:text-red-600"
                                                                onClick={() => removeModule(item.id)}
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Alert className="mt-4">
                                        <AlertDescription className="text-xs">
                                            💡 Click edit icon to modify topics, drag to reorder, or add custom weeks
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
