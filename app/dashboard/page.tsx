import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PersonalizedWelcome from '@/components/personalized-welcome';
import { getBillingContext } from '@/lib/access/getBillingContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen,
    FileText,
    MessageCircle,
    Users,
    GraduationCap,
    Crown,
    Settings,
    CreditCard,
    Monitor
} from 'lucide-react';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin');
    }

    // Get current billing context using the multi-tenant system
    const billingContext = await getBillingContext();

    // Get user with detailed relations
    const userWithData = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            courses: {
                include: {
                    _count: {
                        select: {
                            enrollments: true,
                            assignments: true,
                            discussions: true
                        }
                    }
                }
            },
            enrollments: {
                include: {
                    course: {
                        include: {
                            instructor: {
                                select: {
                                    name: true
                                }
                            },
                            _count: {
                                select: {
                                    assignments: true,
                                    discussions: true
                                }
                            }
                        }
                    }
                }
            },
            submissions: {
                include: {
                    assignment: {
                        include: {
                            course: {
                                select: {
                                    title: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    submittedAt: 'desc'
                },
                take: 5
            }
        }
    });

    if (!userWithData) {
        redirect('/auth/signin');
    }

    const stats = {
        totalCourses: userWithData.courses.length,
        totalStudents: userWithData.courses.reduce((total, course) => total + course._count.enrollments, 0),
        totalAssignments: userWithData.courses.reduce((total, course) => total + course._count.assignments, 0),
        totalDiscussions: userWithData.courses.reduce((total, course) => total + course._count.discussions, 0),
        totalSubmissions: userWithData.submissions.length,
        totalGradedItems: userWithData.submissions.length, // Using submissions as proxy
        totalRubrics: 0, // Default value
        recentActivity: [], // Empty array for recent activity
    };

    // Get current usage for this billing context
    const currentUsage = billingContext.usage ? {
        students: ('studentsCount' in billingContext.usage) ? billingContext.usage.studentsCount || 0 : 0,
        courses: billingContext.usage.coursesCount,
        assignments: billingContext.usage.assignmentsCount,
        aiGrades: billingContext.usage.aiGradesCount,
        plagiarismScans: billingContext.usage.plagiarismScansCount,
    } : {
        students: 0,
        courses: 0,
        assignments: 0,
        aiGrades: 0,
        plagiarismScans: 0,
    };

    return (
        <div className="container mx-auto py-6">
            <div className="grid gap-6 lg:grid-cols-4">
                {/* Subscription Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        {/* Current Plan Card */}
                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Current Plan</CardTitle>
                                    <Crown className="size-5 text-yellow-600" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Badge
                                        variant={billingContext.tier === 'FREE_TRIAL' ? 'secondary' : 'default'}
                                        className="text-sm"
                                    >
                                        {billingContext.tier}
                                    </Badge>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {billingContext.ownerType === 'ORG' ? 'Organization Plan' : 'Personal Plan'}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Courses</span>
                                        <span className="font-medium">
                                            {currentUsage.courses}
                                            {billingContext.tier === 'FREE_TRIAL' && ' / 2'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">AI Grades</span>
                                        <span className="font-medium">
                                            {currentUsage.aiGrades}
                                            {billingContext.tier === 'FREE_TRIAL' && ' / 10'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Students</span>
                                        <span className="font-medium">
                                            {currentUsage.students}
                                            {billingContext.tier === 'FREE_TRIAL' && ' / 10'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Button asChild size="sm" className="w-full">
                                        <Link href="/dashboard/billing">
                                            <CreditCard className="mr-2 size-4" />
                                            Manage Billing
                                        </Link>
                                    </Button>

                                    {billingContext.tier === 'FREE_TRIAL' && (
                                        <Button asChild variant="outline" size="sm" className="w-full">
                                            <Link href="/dashboard/billing">
                                                Upgrade Plan
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                    <Link href="/dashboard/courses/new">
                                        <BookOpen className="mr-2 size-4" />
                                        New Course
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                    <Link href="/dashboard/courses">
                                        <Monitor className="mr-2 size-4" />
                                        Course Studio
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                    <Link href="/dashboard/assignments">
                                        <FileText className="mr-2 size-4" />
                                        Assignments
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                    <Link href="/grade">
                                        <GraduationCap className="mr-2 size-4" />
                                        AI Grading
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                                    <Link href="/discussion">
                                        <MessageCircle className="mr-2 size-4" />
                                        Discussions
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Dashboard Content */}
                <div className="lg:col-span-3">
                    <PersonalizedWelcome
                        user={userWithData as any}
                        stats={stats}
                    />
                </div>
            </div>
        </div>
    );
}