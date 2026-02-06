import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CourseSectionBuilder } from "@/components/course-section-builder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Info } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserRole } from "@prisma/client"

export default async function BuildCourseSectionsPage({
    params,
}: {
    params: { courseId: string }
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/auth/signin")
    }

    if (!params?.courseId) {
        redirect("/dashboard/courses")
    }

    const course = await prisma.course.findUnique({
        where: { id: params.courseId },
        include: {
            modules: {
                include: {
                    contents: true
                },
                orderBy: { orderIndex: "asc" }
            },
            assignments: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    points: true,
                    dueAt: true
                },
                orderBy: { createdAt: "desc" }
            },
            discussions: {
                select: {
                    id: true,
                    title: true
                }
            },
            instructor: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    })

    if (!course) {
        redirect("/dashboard/courses")
    }

    // Check if user is instructor or admin
    if (session.user.role !== UserRole.ADMIN && course.instructorId !== session.user.id) {
        redirect("/dashboard/courses")
    }

    return (
        <div className="container mx-auto max-w-6xl space-y-6 p-6">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard/courses" className="hover:underline">
                        Courses
                    </Link>
                    <span>/</span>
                    <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                        {course.title}
                    </Link>
                    <span>/</span>
                    <span>Build Sections</span>
                </div>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                            <BookOpen className="size-8 text-blue-600" />
                            Build Course Sections
                        </h1>
                        <p className="text-muted-foreground">
                            Create detailed sections for <span className="font-semibold">{course.title}</span>
                        </p>
                    </div>
                    <Link href={`/dashboard/courses/${course.id}`}>
                        <Button variant="outline">Back to Course</Button>
                    </Link>
                </div>
            </div>

            {/* Info Alert */}
            <Alert>
                <Info className="size-4" />
                <AlertDescription>
                    Build your course section by section based on your course plan. You can:
                    <ul className="mt-2 list-inside list-disc space-y-1">
                        <li><strong>Set duration</strong>: 1-52 weeks (completely flexible)</li>
                        <li><strong>Add unlimited sections</strong>: No restrictions on how many sections you create</li>
                        <li><strong>Add multiple content types</strong>: Files, assignments, links, pages, videos, quizzes, discussions</li>
                        <li><strong>Import AI-designed content</strong>: Use assignments and assessments from Design Studio</li>
                        <li><strong>Auto-update syllabus</strong>: Changes automatically sync to your course syllabus</li>
                        <li><strong>Flexible organization</strong>: Assign to specific weeks or create custom sections</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {/* Available AI Content */}
            {(course.assignments.length > 0 || course.discussions.length > 0) && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Available AI-Designed Content</CardTitle>
                        <CardDescription>
                            You have {course.assignments.length} assignment{course.assignments.length !== 1 ? 's' : ''} and {course.discussions.length} discussion{course.discussions.length !== 1 ? 's' : ''} ready to add to sections
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Click "Import from Course" in the section builder to add these items to your course structure
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Existing Sections Summary */}
            {course.modules.length > 0 && (
                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                    <CardHeader>
                        <CardTitle className="text-lg">Existing Sections</CardTitle>
                        <CardDescription>
                            You already have {course.modules.length} section{course.modules.length !== 1 ? 's' : ''} in this course
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {course.modules.map(module => (
                                <div key={module.id} className="flex items-center justify-between rounded-lg border bg-white p-3 dark:bg-gray-900">
                                    <div>
                                        <div className="font-medium">{module.title}</div>
                                        {module.weekNo && (
                                            <div className="text-sm text-muted-foreground">Week {module.weekNo}</div>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {module.contents.length} item{module.contents.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Course Section Builder */}
            <CourseSectionBuilder
                courseId={course.id}
                durationWeeks={course.durationWeeks || 16}
                existingAssignments={course.assignments}
                existingDiscussions={course.discussions}
            />

            {/* Tips Card */}
            <Card>
                <CardHeader>
                    <CardTitle>💡 Pro Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Organize by weeks:</strong> Use the week number field to align sections with your semester schedule</p>
                    <p><strong>Custom sections:</strong> Leave week number empty to create topical sections instead</p>
                    <p><strong>Flexible content:</strong> Mix and match different content types within each section</p>
                    <p><strong>File uploads:</strong> For now, add file URLs. Full upload feature coming soon!</p>
                    <p><strong>No limits:</strong> Add as many sections and items as your course needs</p>
                </CardContent>
            </Card>
        </div>
    )
}
