import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import { createModuleManager, LMSModule } from '@/lib/module-manager';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Crown, Lock } from 'lucide-react';

/**
 * STUDENT ENROLLMENT PAGE (Professor Feature)
 * 
 * This is for PROFESSORS to enroll students in THEIR courses.
 * 
 * Key Differences:
 * - Student Enrollment (this page): PROFESSORS enroll students in their courses
 * - User Management (/admin/users): ADMIN manages all platform users
 * 
 * Access Control:
 * - Available to professors with proper subscription/module access
 * - Professors can only enroll students in courses they teach
 * - Does NOT allow managing user roles or platform-wide users
 */

export default async function EnrollmentPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    // Get or create user
    let user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email!,
                role: UserRole.PROFESSOR
            }
        });
    }

    // Check module access
    const moduleManager = createModuleManager({
        userId: user.id,
        role: user.role,
        subscriptionType: 'PREMIUM', // Simulated
        subscriptionExpiresAt: null,
        trialExpiresAt: null
    });

    const hasAccess = moduleManager.hasModuleAccess(LMSModule.STUDENT_ENROLLMENT);

    if (!hasAccess) {
        const upgradeSuggestions = moduleManager.getUpgradeSuggestions();
        const enrollmentUpgrade = upgradeSuggestions.find(s => s.module === LMSModule.STUDENT_ENROLLMENT);

        return (
            <div className="container mx-auto py-6">
                <div className="mx-auto max-w-2xl">
                    <Card className="border-orange-200">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-orange-100">
                                <Lock className="size-8 text-orange-600" />
                            </div>
                            <CardTitle className="text-2xl text-orange-900">Module Locked</CardTitle>
                            <CardDescription className="text-orange-700">
                                Student Enrollment requires a subscription upgrade
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-gray-600">
                                {enrollmentUpgrade?.upgradeMessage || 'This module is not available in your current plan.'}
                            </p>
                            <div className="flex justify-center gap-2">
                                <Button className="bg-orange-600 hover:bg-orange-700">
                                    <Crown className="mr-2 size-4" />
                                    Upgrade Now
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="/dashboard">Back to Dashboard</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Get user's courses with enrollment data
    const courses = await prisma.course.findMany({
        where: {
            instructorId: user.id
        },
        include: {
            enrollments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    enrollments: true,
                    assignments: true,
                    discussions: true
                }
            }
        }
    });

    // Check if user can perform enrollment actions
    const canPerformBulkEnrollment = moduleManager.canPerformAction(
        LMSModule.STUDENT_ENROLLMENT,
        'bulk_enroll'
    );

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Student Enrollment</h1>
                    <p className="text-muted-foreground">
                        Enroll students in your courses (Professor Feature)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <UserPlus className="mr-2 size-4" />
                        Add Students
                    </Button>
                    {canPerformBulkEnrollment.canPerform && (
                        <Button>
                            <Users className="mr-2 size-4" />
                            Bulk Enroll
                        </Button>
                    )}
                </div>
            </div>

            {/* Subscription Status Alert */}
            <Alert>
                <Crown className="size-4" />
                <AlertDescription>
                    <strong>Premium Feature Active:</strong> You have access to advanced student enrollment tools.
                </AlertDescription>
            </Alert>

            {/* Courses and Enrollments */}
            <div className="grid gap-6">
                {courses.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="mx-auto mb-4 size-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">No Courses Found</h3>
                            <p className="mb-4 text-gray-600">
                                Create a course first to start enrolling students.
                            </p>
                            <Button asChild>
                                <a href="/dashboard/courses">Create Course</a>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    courses.map(course => (
                        <Card key={course.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {course.title}
                                            {course.code && (
                                                <Badge variant="secondary">{course.code}</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {course._count.enrollments} students enrolled •
                                            {course._count.assignments} assignments •
                                            {course._count.discussions} discussions
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <UserPlus className="mr-1 size-4" />
                                            Enroll
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {course.enrollments.length > 0 ? (
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Enrolled Students:</h4>
                                        <div className="grid gap-2">
                                            {course.enrollments.slice(0, 5).map(enrollment => (
                                                <div key={enrollment.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {enrollment.user.name?.charAt(0) || 'U'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">{enrollment.user.name}</div>
                                                            <div className="text-xs text-gray-600">{enrollment.user.email}</div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {enrollment.user.role}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {course.enrollments.length > 5 && (
                                                <div className="py-2 text-center text-sm text-gray-600">
                                                    and {course.enrollments.length - 5} more students...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <Users className="mx-auto mb-2 size-8 text-gray-400" />
                                        <p>No students enrolled yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Feature Limitations */}
            {!canPerformBulkEnrollment.canPerform && (
                <Alert>
                    <Lock className="size-4" />
                    <AlertDescription>
                        <strong>Bulk Enrollment:</strong> {canPerformBulkEnrollment.reason}
                        {canPerformBulkEnrollment.upgradeRequired && (
                            <Button variant="link" className="ml-2 h-auto p-0">
                                Upgrade Plan
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}