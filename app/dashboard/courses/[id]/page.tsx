import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
    BookOpen,
    Users,
    FileText,
    MessageCircle,
    Settings,
    Edit,
    Star,
    Calendar,
    Target,
    ArrowLeft
} from 'lucide-react'

interface CourseDetailPageProps {
    params: {
        id: string
    }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect('/auth/signin')
    }

    // Await params (Next.js 15+ requirement)
    const { id } = await params

    // Get course details
    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            instructor: true,
            enrollments: {
                include: {
                    user: true
                }
            },
            assignments: true,
            discussions: true,
            modules: true
        }
    })

    if (!course) {
        redirect('/dashboard/courses')
    }

    // Check if user has access to this course
    const hasAccess = course.instructorId === session.user.id || 
                      course.enrollments.some(enrollment => enrollment.userId === session.user.id)
    
    if (!hasAccess) {
        redirect('/dashboard/courses')
    }

    const isOwner = course.instructorId === session.user.id

    return (
        <div className="container mx-auto py-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/courses">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 size-4" />
                            Back to Courses
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{course.title}</h1>
                        {course.code && (
                            <p className="text-muted-foreground">{course.code}</p>
                        )}
                    </div>
                </div>
                
                {isOwner && (
                    <div className="flex gap-2">
                        <Link href={`/dashboard/course-design-studio?courseId=${course.id}`}>
                            <Button className="gap-2">
                                <Star className="size-4" />
                                Course Design Studio
                            </Button>
                        </Link>
                        <Link href={`/dashboard/courses/${course.id}/settings`}>
                            <Button variant="outline" className="gap-2">
                                <Settings className="size-4" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Course Description */}
            {course.description && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Course Description
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="leading-relaxed text-muted-foreground">
                            {course.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <Users className="mb-2 size-8 text-blue-600" />
                        <div className="text-2xl font-bold">{course.enrollments.length}</div>
                        <p className="text-xs text-muted-foreground">Students</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <FileText className="mb-2 size-8 text-green-600" />
                        <div className="text-2xl font-bold">{course.assignments.length}</div>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <MessageCircle className="mb-2 size-8 text-purple-600" />
                        <div className="text-2xl font-bold">{course.discussions.length}</div>
                        <p className="text-xs text-muted-foreground">Discussions</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <Target className="mb-2 size-8 text-orange-600" />
                        <div className="text-2xl font-bold">{course.modules.length}</div>
                        <p className="text-xs text-muted-foreground">Modules</p>
                    </CardContent>
                </Card>
            </div>

            {/* Course Content */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Assignments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Recent Assignments
                        </CardTitle>
                        {isOwner && (
                            <Link href={`/dashboard/assignments/new?courseId=${course.id}`}>
                                <Button size="sm" variant="outline">
                                    <Edit className="mr-1 size-4" />
                                    Add
                                </Button>
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent>
                        {course.assignments.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                No assignments yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {course.assignments.slice(0, 3).map((assignment) => (
                                    <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{assignment.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {assignment.dueAt ? `Due: ${new Date(assignment.dueAt).toLocaleDateString()}` : 'No due date'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {assignment.points} pts
                                        </Badge>
                                    </div>
                                ))}
                                {course.assignments.length > 3 && (
                                    <Link href={`/dashboard/assignments?courseId=${course.id}`}>
                                        <Button variant="ghost" className="w-full">
                                            View All Assignments
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Discussions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="size-5" />
                            Recent Discussions
                        </CardTitle>
                        {isOwner && (
                            <Link href={`/discussion/new?courseId=${course.id}`}>
                                <Button size="sm" variant="outline">
                                    <Edit className="mr-1 size-4" />
                                    Add
                                </Button>
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent>
                        {course.discussions.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                No discussions yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {course.discussions.slice(0, 3).map((discussion) => (
                                    <div key={discussion.id} className="rounded-lg border p-3">
                                        <p className="font-medium">{discussion.title}</p>
                                        {discussion.prompt && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {discussion.prompt.length > 100 
                                                    ? discussion.prompt.substring(0, 100) + '...' 
                                                    : discussion.prompt}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {course.discussions.length > 3 && (
                                    <Link href={`/discussion?courseId=${course.id}`}>
                                        <Button variant="ghost" className="w-full">
                                            View All Discussions
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Enrolled Students (For Instructors) */}
            {isOwner && course.enrollments.length > 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            Enrolled Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {course.enrollments.map((enrollment) => (
                                <div key={enrollment.id} className="flex items-center gap-3 rounded-lg border p-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                                        <span className="text-sm font-medium text-blue-600">
                                            {enrollment.user.name?.[0] || enrollment.user.email[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {enrollment.user.name || 'Unnamed Student'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {enrollment.user.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}