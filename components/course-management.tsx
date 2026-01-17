import { createSubscriptionManager } from '@/lib/subscription-manager';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SubscriptionBanner from '@/components/subscription-banner';
import Link from 'next/link';
import {
    BookOpen,
    FileText,
    MessageCircle,
    Users,
    Plus,
    Settings,
    BarChart3,
    GraduationCap
} from 'lucide-react';

interface Course {
    id: string;
    title: string;
    code?: string;
    description?: string;
    _count: {
        students: number;
        assignments: number;
        discussions: number;
    };
    owner: {
        id: string;
        name?: string;
        email: string;
    };
}

interface CourseManagementProps {
    user: {
        id: string;
        role: UserRole;
        name?: string;
        email: string;
        subscriptionContext?: {
            canCreateCourse: boolean;
            canCreateAssignment: boolean;
            canCreateDiscussion: boolean;
            canUseCustomRubrics: boolean;
            canUseAiGrading: boolean;
            canAccessAnalytics: boolean;
            canUseBulkOperations: boolean;
            canUseApiAccess: boolean;
            coursesUsed: number;
            courseLimit?: number;
            subscriptionType: string;
            upgradeMessages?: {
                courseCreation?: string | null;
                assignments?: string | null;
                discussions?: string | null;
            };
        };
    };
    courses: Course[];
}

export default function CourseManagement({ user, courses }: CourseManagementProps) {
    // Extract values from user subscriptionContext for easier access
    const subscriptionContext = user.subscriptionContext;
    const canCreateCourse = subscriptionContext?.canCreateCourse || false;
    const subscriptionInfo = {
        isActive: subscriptionContext?.subscriptionType !== 'FREE',
        type: subscriptionContext?.subscriptionType || 'FREE',
        role: user.role,
        daysRemaining: null, // Would need to calculate from subscription data
        needsUpgrade: !canCreateCourse
    };
    const features = {
        maxCourses: subscriptionContext?.courseLimit || 0,
        advancedAnalytics: subscriptionContext?.canAccessAnalytics || false
    };

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Show subscription banner for professors */}
            {user.role === UserRole.PROFESSOR && user.subscriptionContext && (
                <SubscriptionBanner subscriptionContext={user.subscriptionContext} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Course Management</h1>
                    <p className="text-muted-foreground">
                        {user.role === UserRole.PROFESSOR
                            ? `Manage your courses and educational content`
                            : user.role === UserRole.ADMIN
                                ? `Administer all courses in the system`
                                : `View your enrolled courses`}
                    </p>
                </div>
                {user.role === UserRole.PROFESSOR && user.subscriptionContext?.canCreateCourse ? (
                    <Button asChild>
                        <Link href="/dashboard/courses/new">
                            <Plus className="size-4" />
                            Create Course
                        </Link>
                    </Button>
                ) : user.role === UserRole.PROFESSOR ? (
                    <div className="text-center">
                        <Button disabled className="flex items-center gap-2">
                            <Plus className="size-4" />
                            Create Course
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {user.subscriptionContext?.upgradeMessages?.courseCreation || 'Upgrade to create courses'}
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Subscription Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="size-5" />
                        Subscription Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm font-medium">Plan</p>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={subscriptionInfo.isActive ? "default" : "destructive"}>
                                    {subscriptionInfo.type.replace('_', ' ')}
                                </Badge>
                                {subscriptionInfo.role === UserRole.ADMIN && (
                                    <Badge variant="outline">Administrator</Badge>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Usage</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {courses.length} of {features.maxCourses === -1 ? '∞' : features.maxCourses} courses
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Status</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {subscriptionInfo.daysRemaining !== null ?
                                    `${subscriptionInfo.daysRemaining} days remaining` :
                                    'Active'
                                }
                            </p>
                        </div>
                    </div>
                    {subscriptionInfo.needsUpgrade && (
                        <div className="mt-4">
                            <Link href="/subscription/upgrade">
                                <Button variant="outline" size="sm">
                                    Upgrade Subscription
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Course Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <Card key={course.id} className="transition-shadow hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-xl">{course.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{course.code}</p>
                                </div>
                                <Badge variant="default">
                                    Active
                                </Badge>
                            </div>
                            {course.description && (
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {course.description}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <Users className="mx-auto mb-1 size-5 text-muted-foreground" />
                                    <p className="text-sm font-medium">{course._count.students}</p>
                                    <p className="text-xs text-muted-foreground">Students</p>
                                </div>
                                <div className="text-center">
                                    <FileText className="mx-auto mb-1 size-5 text-muted-foreground" />
                                    <p className="text-sm font-medium">{course._count.assignments}</p>
                                    <p className="text-xs text-muted-foreground">Assignments</p>
                                </div>
                                <div className="text-center">
                                    <MessageCircle className="mx-auto mb-1 size-5 text-muted-foreground" />
                                    <p className="text-sm font-medium">{course._count.discussions}</p>
                                    <p className="text-xs text-muted-foreground">Discussions</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link href={`/dashboard/courses/${course.id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <BookOpen className="mr-1 size-4" />
                                        View
                                    </Button>
                                </Link>

                                {user.role !== UserRole.STUDENT && (
                                    <Link href={`/dashboard/courses/${course.id}/settings`}>
                                        <Button variant="ghost" size="sm">
                                            <Settings className="size-4" />
                                        </Button>
                                    </Link>
                                )}

                                {features.advancedAnalytics && (
                                    <Link href={`/dashboard/courses/${course.id}/analytics`}>
                                        <Button variant="ghost" size="sm">
                                            <BarChart3 className="size-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State */}
                {courses.length === 0 && (
                    <div className="py-12 text-center">
                        <BookOpen className="mx-auto mb-4 size-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium">No courses yet</h3>
                        <p className="mb-4 text-muted-foreground">
                            {user.role === UserRole.PROFESSOR
                                ? 'Create your first course to get started'
                                : 'No courses available at the moment'}
                        </p>

                        {user.role === UserRole.PROFESSOR && (
                            <div className="space-y-4">
                                {user.subscriptionContext?.canCreateCourse ? (
                                    <Link href="/dashboard/courses/new">
                                        <Button>
                                            <Plus className="mr-2 size-4" />
                                            Create Your First Course
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="space-y-2">
                                        <Button disabled>
                                            <Plus className="mr-2 size-4" />
                                            Create Course
                                        </Button>
                                        <p className="text-sm text-muted-foreground">
                                            {subscriptionContext?.upgradeMessages?.courseCreation || 'Upgrade to create more courses'}
                                        </p>
                                        <Link href="/subscription/upgrade">
                                            <Button variant="outline" size="sm">
                                                Upgrade Now
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}