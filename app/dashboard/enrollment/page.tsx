import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createModuleManager, LMSModule } from '@/lib/module-manager';
import { SubscriptionType, UserRole } from '@prisma/client';
import { getBillingContext, ensureUserSubscription } from '@/lib/access/getBillingContext';
import { requireSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Lock } from 'lucide-react';
import { EnrollmentActions } from '@/components/enrollment-actions';

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
    const session = await requireSession();

    // Get or create user
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        redirect('/auth/signin');
    }

    if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
        redirect('/dashboard');
    }

    await ensureUserSubscription(user.id);

    // Check module access
    const billingContext = await getBillingContext();
    const subscriptionType: SubscriptionType | null =
        billingContext.tier === 'FREE_TRIAL' ? null : (billingContext.tier as SubscriptionType);

    const moduleManager = createModuleManager({
        userId: user.id,
        role: user.role,
        subscriptionType,
        subscriptionExpiresAt: billingContext.currentPeriodEnd,
        trialExpiresAt: user.trialExpiresAt
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
                                <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                                    <a href="/subscription/upgrade">
                                        <Crown className="mr-2 size-4" />
                                        Upgrade Now
                                    </a>
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

    // Serialize course data for client component
    const coursesData = courses.map(course => ({
        id: course.id,
        title: course.title,
        code: course.code,
        _count: course._count,
        enrollments: course.enrollments.map(e => ({
            id: e.id,
            user: {
                id: e.user.id,
                name: e.user.name,
                email: e.user.email,
                role: e.user.role,
            }
        }))
    }));

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
            </div>

            {/* Subscription Status Alert */}
            <Alert>
                <Crown className="size-4" />
                <AlertDescription>
                    <strong>Premium Feature Active:</strong> You have access to advanced student enrollment tools.
                </AlertDescription>
            </Alert>

            {/* Client component handles all interactive enrollment UI: header buttons, course cards, and enrollment dialogs */}
            <EnrollmentActions
                courses={coursesData}
                canBulkEnroll={canPerformBulkEnrollment.canPerform}
            />

            {/* Feature Limitations */}
            {!canPerformBulkEnrollment.canPerform && (
                <Alert>
                    <Lock className="size-4" />
                    <AlertDescription>
                        <strong>Bulk Enrollment:</strong> {canPerformBulkEnrollment.reason}
                        {canPerformBulkEnrollment.upgradeRequired && (
                            <Button variant="link" className="ml-2 h-auto p-0" asChild>
                                <a href="/subscription/upgrade">Upgrade Plan</a>
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}