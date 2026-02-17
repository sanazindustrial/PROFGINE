import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Book,
    Users,
    FileText,
    MessageSquare,
    Settings,
    ArrowLeft,
    Calendar,
    Layers,
    PlusCircle,
    GraduationCap
} from "lucide-react"
import Link from "next/link"

export default async function CourseDetailPage({
    params,
}: {
    params: { courseId: string }
}) {
    const session = await requireSession()
    if (!session) {
        redirect("/login")
    }

    // Get course with all related data
    const course = await prisma.course.findFirst({
        where: session.user.role === UserRole.ADMIN
            ? { id: params.courseId }
            : { id: params.courseId, instructorId: session.user.id },
        include: {
            instructor: {
                select: {
                    name: true,
                    email: true
                }
            },
            modules: {
                orderBy: { orderIndex: 'asc' },
                take: 5
            },
            assignments: {
                orderBy: { dueDate: 'asc' },
                take: 5
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
            {/* Header */}
            <div className="mb-6">
                <Link href="/dashboard/courses" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Courses
                </Link>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Book className="size-8 text-blue-600" />
                            <h1 className="text-3xl font-bold">{course.title}</h1>
                        </div>
                        {course.code && (
                            <Badge variant="secondary" className="mt-2">
                                {course.code}
                            </Badge>
                        )}
                        {course.term && (
                            <Badge variant="outline" className="ml-2 mt-2">
                                {course.term}
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/dashboard/courses/${course.id}/settings`}>
                            <Button variant="outline">
                                <Settings className="mr-2 size-4" />
                                Settings
                            </Button>
                        </Link>
                        <Link href={`/dashboard/courses/${course.id}/studio`}>
                            <Button>
                                <Layers className="mr-2 size-4" />
                                Course Studio
                            </Button>
                        </Link>
                    </div>
                </div>
                {course.description && (
                    <p className="mt-4 text-muted-foreground">{course.description}</p>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="mb-8 grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Students</CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course._count.enrollments}</div>
                        <p className="text-xs text-muted-foreground">enrolled students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Modules</CardTitle>
                        <Layers className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course._count.modules}</div>
                        <p className="text-xs text-muted-foreground">course modules</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                        <FileText className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course._count.assignments}</div>
                        <p className="text-xs text-muted-foreground">total assignments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Discussions</CardTitle>
                        <MessageSquare className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{course._count.discussions}</div>
                        <p className="text-xs text-muted-foreground">discussion threads</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`/dashboard/courses/${course.id}/build-sections`}>
                    <Card className="cursor-pointer transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Layers className="size-5 text-blue-600" />
                                Build Sections
                            </CardTitle>
                            <CardDescription>Create and manage course sections</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href={`/dashboard/courses/${course.id}/lecture-notes`}>
                    <Card className="cursor-pointer transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="size-5 text-green-600" />
                                Lecture Notes
                            </CardTitle>
                            <CardDescription>Generate AI lecture notes</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href={`/dashboard/courses/${course.id}/studio`}>
                    <Card className="cursor-pointer transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <GraduationCap className="size-5 text-purple-600" />
                                Course Studio
                            </CardTitle>
                            <CardDescription>Design presentations and materials</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href={`/dashboard/courses/${course.id}/settings`}>
                    <Card className="cursor-pointer transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings className="size-5 text-gray-600" />
                                Course Settings
                            </CardTitle>
                            <CardDescription>Configure course options</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Recent Content */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Modules */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="size-5" />
                                Recent Modules
                            </CardTitle>
                            <Link href={`/dashboard/courses/${course.id}/build-sections`}>
                                <Button variant="ghost" size="sm">
                                    <PlusCircle className="mr-2 size-4" />
                                    Add Module
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {course.modules.length > 0 ? (
                            <div className="space-y-3">
                                {course.modules.map((module) => (
                                    <div key={module.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{module.title}</p>
                                            {module.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {module.description}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={module.isPublished ? "default" : "secondary"}>
                                            {module.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">No modules yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Assignments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-5" />
                                Recent Assignments
                            </CardTitle>
                            <Link href="/dashboard/assignments">
                                <Button variant="ghost" size="sm">
                                    <PlusCircle className="mr-2 size-4" />
                                    Add Assignment
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {course.assignments.length > 0 ? (
                            <div className="space-y-3">
                                {course.assignments.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{assignment.title}</p>
                                            {assignment.dueDate && (
                                                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Calendar className="size-3" />
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="outline">
                                            {assignment.maxScore ? `${assignment.maxScore} pts` : 'Ungraded'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">No assignments yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
