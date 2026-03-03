"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CourseStudioDesign } from "@/components/course-studio-design"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChart3, Lightbulb, Star, Monitor, BookOpen, Loader2 } from "lucide-react"

interface Course {
    id: string
    title: string
    code: string | null
}

interface Presentation {
    id: string
    title: string
    status: string
    slideCount: number
    createdAt: string
    courseId: string | null
}

export default function PresentationStudioPage() {
    const [mode, setMode] = useState<"general" | "course">("general")
    const [courses, setCourses] = useState<Course[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState<string>("")
    const [recentPresentations, setRecentPresentations] = useState<Presentation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Fetch courses and recent presentations
        Promise.all([
            fetch("/api/courses").then(r => r.json()),
            fetch("/api/course-studio/presentations/recent").then(r => r.ok ? r.json() : { presentations: [] })
        ]).then(([coursesData, presentationsData]) => {
            setCourses(coursesData.courses || [])
            setRecentPresentations(presentationsData.presentations || [])
            setIsLoading(false)
        }).catch(() => {
            setIsLoading(false)
        })
    }, [])

    const selectedCourse = courses.find(c => c.id === selectedCourseId)

    return (
        <div className="container mx-auto px-4 py-8 duration-500 animate-in fade-in-50">
            <div className="mb-6">
                <div className="mb-2 flex items-center gap-3">
                    <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                        Presentation Studio
                    </h1>
                    <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Create professional presentations from your materials
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Studio Panel */}
                <div className="lg:col-span-2">
                    {/* Mode Selection */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Presentation Type</CardTitle>
                            <CardDescription>
                                Choose whether to create a standalone presentation or link it to a course
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <Button
                                    variant={mode === "general" ? "default" : "outline"}
                                    onClick={() => {
                                        setMode("general")
                                        setSelectedCourseId("")
                                    }}
                                    className="flex-1"
                                >
                                    <Monitor className="mr-2 size-4" />
                                    General Presentation
                                </Button>
                                <Button
                                    variant={mode === "course" ? "default" : "outline"}
                                    onClick={() => setMode("course")}
                                    className="flex-1"
                                >
                                    <BookOpen className="mr-2 size-4" />
                                    Course Presentation
                                </Button>
                            </div>

                            {mode === "course" && (
                                <div className="space-y-2">
                                    <Label>Select Course</Label>
                                    {isLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="size-4 animate-spin" />
                                            Loading courses...
                                        </div>
                                    ) : courses.length === 0 ? (
                                        <div className="text-sm text-gray-500">
                                            No courses found.{" "}
                                            <Link href="/dashboard/courses/new" className="text-blue-600 hover:underline">
                                                Create a course first
                                            </Link>
                                        </div>
                                    ) : (
                                        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a course..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map(course => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.title} {course.code ? `(${course.code})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {selectedCourse && (
                                        <p className="text-sm text-green-600">
                                            ✓ Presentation will be linked to: {selectedCourse.title}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Presentation Generator */}
                    {mode === "general" ? (
                        <CourseStudioDesign isGeneralMode={true} />
                    ) : selectedCourseId ? (
                        <CourseStudioDesign
                            courseId={selectedCourseId}
                            headerTitle={`Create Presentation for ${selectedCourse?.title || "Course"}`}
                        />
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <BookOpen className="mb-4 size-12 text-gray-400" />
                                <h3 className="mb-2 font-semibold text-gray-700">Select a Course</h3>
                                <p className="text-sm text-gray-500">
                                    Choose a course above to create a course-linked presentation
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Recent Presentations */}
                <div className="space-y-4">
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="size-4" />
                                Recent Presentations
                                <Badge variant="outline" className="text-xs">{recentPresentations.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="size-6 animate-spin text-gray-400" />
                                </div>
                            ) : recentPresentations.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="mb-2 text-sm text-gray-600">No presentations yet</p>
                                    <p className="text-xs text-gray-500">Create your first one above!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentPresentations.map(pres => (
                                        <Link
                                            key={pres.id}
                                            href={pres.courseId
                                                ? `/dashboard/courses/${pres.courseId}/studio/results/${pres.id}`
                                                : `/dashboard/presentation-studio/results/${pres.id}`
                                            }
                                            className="block rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                                                        {pres.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {pres.slideCount} slides • {new Date(pres.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={pres.status === "COMPLETED" ? "default" : "secondary"}
                                                    className="ml-2 text-xs"
                                                >
                                                    {pres.status}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tips Card */}
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lightbulb className="size-4 text-yellow-500" />
                                Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <p>• Upload PDFs or DOCX files for best results</p>
                            <p>• Include lecture notes for speaker notes</p>
                            <p>• Choose a template matching your style</p>
                            <p>• Link to courses for better organization</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
