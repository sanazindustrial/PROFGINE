import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Book, Users, Calendar, Trash2, Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CourseSettingsPage({
    params,
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = await params
    const session = await requireSession()
    if (!session) {
        redirect("/login")
    }

    // Verify user has access to this course
    const course = await prisma.course.findFirst({
        where: session.user.role === UserRole.ADMIN
            ? { id: courseId }
            : { id: courseId, instructorId: session.user.id },
        include: {
            instructor: {
                select: {
                    name: true,
                    email: true
                }
            },
            _count: {
                select: {
                    assignments: true,
                    discussions: true,
                    enrollments: true,
                    modules: true
                }
            }
        }
    })

    if (!course) {
        redirect("/dashboard/courses")
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/dashboard/courses" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Courses
                </Link>
                <div className="flex items-center gap-3">
                    <Settings className="size-6 text-blue-600" />
                    <h1 className="text-2xl font-bold">Course Settings</h1>
                </div>
                <p className="mt-2 text-muted-foreground">
                    Manage settings for <span className="font-medium">{course.title}</span>
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Course Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Book className="size-5" />
                            Course Information
                        </CardTitle>
                        <CardDescription>Basic course details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Title</label>
                            <p className="text-lg font-semibold">{course.title}</p>
                        </div>
                        {course.code && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Course Code</label>
                                <p><Badge variant="outline">{course.code}</Badge></p>
                            </div>
                        )}
                        {course.description && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-sm">{course.description}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Instructor</label>
                            <p>{course.instructor?.name || "Not assigned"}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                            <p>
                                <Badge variant={course.isPublic ? "default" : "secondary"}>
                                    {course.isPublic ? "Public" : "Private"}
                                </Badge>
                            </p>
                        </div>
                        <Button variant="outline" className="w-full">
                            <Edit className="mr-2 size-4" />
                            Edit Course Details
                        </Button>
                    </CardContent>
                </Card>

                {/* Course Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            Course Statistics
                        </CardTitle>
                        <CardDescription>Overview of course content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 text-center">
                                <div className="text-3xl font-bold text-blue-600">{course._count.enrollments}</div>
                                <div className="text-sm text-muted-foreground">Students Enrolled</div>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <div className="text-3xl font-bold text-green-600">{course._count.modules}</div>
                                <div className="text-sm text-muted-foreground">Modules</div>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <div className="text-3xl font-bold text-purple-600">{course._count.assignments}</div>
                                <div className="text-sm text-muted-foreground">Assignments</div>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <div className="text-3xl font-bold text-orange-600">{course._count.discussions}</div>
                                <div className="text-sm text-muted-foreground">Discussions</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="size-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Manage your course</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href={`/dashboard/courses/${courseId}/studio`} className="block">
                            <Button variant="outline" className="w-full justify-start">
                                Course Studio Design
                            </Button>
                        </Link>
                        <Link href={`/dashboard/courses/${courseId}/build-sections`} className="block">
                            <Button variant="outline" className="w-full justify-start">
                                Build Course Sections
                            </Button>
                        </Link>
                        <Link href={`/dashboard/courses/${courseId}/lecture-notes`} className="block">
                            <Button variant="outline" className="w-full justify-start">
                                Manage Lecture Notes
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 dark:border-red-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="size-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>Irreversible actions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                            Archive Course
                        </Button>
                        <Button variant="destructive" className="w-full">
                            Delete Course
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Deleting a course will permanently remove all associated content, assignments, and student data.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Dates */}
            <Card className="mt-6">
                <CardContent className="py-4">
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                        <div>
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(course.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                            <span className="font-medium">Last Updated:</span>{" "}
                            {new Date(course.updatedAt).toLocaleDateString()}
                        </div>
                        {course.startDate && (
                            <div>
                                <span className="font-medium">Start Date:</span>{" "}
                                {new Date(course.startDate).toLocaleDateString()}
                            </div>
                        )}
                        {course.endDate && (
                            <div>
                                <span className="font-medium">End Date:</span>{" "}
                                {new Date(course.endDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
