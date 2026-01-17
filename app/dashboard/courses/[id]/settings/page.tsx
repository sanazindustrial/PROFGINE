import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
    ArrowLeft,
    Settings,
    Users,
    BookOpen,
    Trash2
} from 'lucide-react'

interface CourseSettingsPageProps {
    params: {
        id: string
    }
}

export default async function CourseSettingsPage({ params }: CourseSettingsPageProps) {
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
            }
        }
    })

    if (!course) {
        redirect('/dashboard/courses')
    }

    // Only course instructor can access settings
    if (course.instructorId !== session.user.id) {
        redirect('/dashboard/courses')
    }

    return (
        <div className="container mx-auto py-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href={`/dashboard/courses/${course.id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 size-4" />
                        Back to Course
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Course Settings</h1>
                    <p className="text-muted-foreground">{course.title}</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Basic Course Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Course Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="course-title">Course Title</Label>
                            <Input 
                                id="course-title" 
                                defaultValue={course.title} 
                                placeholder="Enter course title"
                            />
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="course-code">Course Code (Optional)</Label>
                            <Input 
                                id="course-code" 
                                defaultValue={course.code || ''} 
                                placeholder="e.g., CS101, MATH200"
                            />
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="course-description">Description</Label>
                            <Textarea 
                                id="course-description" 
                                defaultValue={course.description || ''} 
                                placeholder="Describe your course..."
                                rows={4}
                            />
                        </div>
                        
                        <Button className="w-fit">
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Student Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" />
                            Student Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">Enrolled Students</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {course.enrollments.length} students currently enrolled
                                    </p>
                                </div>
                                <Button variant="outline">
                                    Add Students
                                </Button>
                            </div>
                            
                            {course.enrollments.length > 0 && (
                                <div className="rounded-lg border p-4">
                                    <div className="space-y-3">
                                        {course.enrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center justify-between rounded border p-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {enrollment.user.name?.[0] || enrollment.user.email[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {enrollment.user.name || 'Unnamed Student'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {enrollment.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost">
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Course Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="size-5" />
                            Course Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <h4 className="font-medium">Course Visibility</h4>
                                <p className="text-sm text-muted-foreground">
                                    Currently visible to enrolled students only
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                Change
                            </Button>
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <h4 className="font-medium">Student Enrollment</h4>
                                <p className="text-sm text-muted-foreground">
                                    Allow new students to self-enroll
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                Configure
                            </Button>
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <h4 className="font-medium">Gradebook Settings</h4>
                                <p className="text-sm text-muted-foreground">
                                    Configure grading scale and policies
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                Configure
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="size-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-red-600">Delete Course</h4>
                                <p className="mb-3 text-sm text-muted-foreground">
                                    Permanently delete this course and all associated data. This action cannot be undone.
                                </p>
                                <Button variant="destructive" size="sm">
                                    Delete Course
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}