import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import { createModuleManager, LMSModule } from '@/lib/module-manager';
import { UserRole, AssignmentType } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Plus, Zap, Calendar, Users, Crown } from 'lucide-react';

export default async function AssignmentsPage() {
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

    const hasAccess = moduleManager.hasModuleAccess(LMSModule.ASSIGNMENT_SYSTEM);

    if (!hasAccess) {
        return (
            <div className="container mx-auto py-6">
                <div className="mx-auto max-w-2xl">
                    <Alert>
                        <AlertDescription>
                            You don&apos;t have access to the Assignment System. Please check your subscription.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    // Get assignments
    const assignments = await prisma.assignment.findMany({
        where: {
            course: {
                instructorId: user.id
            }
        },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    code: true
                }
            },
            rubric: {
                include: {
                    criteria: true
                }
            },
            submissions: {
                include: {
                    student: {
                        select: {
                            name: true
                        }
                    },
                    grade: true
                }
            },
            _count: {
                select: {
                    submissions: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Count current assignments
    const assignmentCount = assignments.length;

    // Check feature capabilities
    const canCreateAssignment = moduleManager.canPerformAction(
        LMSModule.ASSIGNMENT_SYSTEM,
        'create',
        { currentCount: assignmentCount }
    );

    // Get the assignment limit from the module manager
    const assignmentLimit = moduleManager.getModuleLimits(LMSModule.ASSIGNMENT_SYSTEM)?.maxAssignments;

    const canUseAIGrading = moduleManager.hasModuleAccess(LMSModule.AI_GRADING_ENGINE);
    const canUseCustomRubrics = moduleManager.hasModuleAccess(LMSModule.RUBRIC_BUILDER);

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Assignment Management</h1>
                    <p className="text-muted-foreground">
                        Create and manage assignments across your courses
                    </p>
                </div>
                <div className="flex gap-2">
                    {canCreateAssignment.canPerform ? (
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Create Assignment
                        </Button>
                    ) : (
                        <div className="relative">
                            <Button disabled>
                                <Plus className="mr-2 size-4" />
                                Create Assignment
                            </Button>
                            <Badge variant="outline" className="absolute -right-2 -top-2 bg-orange-100 text-orange-700">
                                Limit Reached
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Feature Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Assignment Creation Status */}
                <Card className={canCreateAssignment.canPerform ? 'border-green-200' : 'border-orange-200'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="size-4" />
                            Assignment Creation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {assignmentCount}
                            {assignmentLimit && ` / ${assignmentLimit}`}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {canCreateAssignment.canPerform ? 'Available' : canCreateAssignment.reason}
                        </p>
                    </CardContent>
                </Card>

                {/* AI Grading Status */}
                <Card className={canUseAIGrading ? 'border-blue-200' : 'border-gray-200'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Zap className="size-4" />
                            AI Grading
                            {canUseAIGrading && <Badge variant="secondary" className="ml-auto">Premium</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {canUseAIGrading ? 'Active' : 'Locked'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {canUseAIGrading ? 'Automated grading available' : 'Requires premium subscription'}
                        </p>
                    </CardContent>
                </Card>

                {/* Custom Rubrics Status */}
                <Card className={canUseCustomRubrics ? 'border-purple-200' : 'border-gray-200'}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Crown className="size-4" />
                            Custom Rubrics
                            {canUseCustomRubrics && <Badge variant="secondary" className="ml-auto">Premium</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {canUseCustomRubrics ? 'Available' : 'Locked'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {canUseCustomRubrics ? 'Create custom grading criteria' : 'Requires premium subscription'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Assignments</h2>

                {assignments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="mx-auto mb-4 size-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">No Assignments Yet</h3>
                            <p className="mb-4 text-gray-600">
                                Create your first assignment to get started with student assessments.
                            </p>
                            {canCreateAssignment.canPerform && (
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    Create First Assignment
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map(assignment => (
                            <Card key={assignment.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-3">
                                                {assignment.title}
                                                <Badge variant="outline">
                                                    {assignment.type.replace('_', ' ')}
                                                </Badge>
                                                {assignment.rubric && canUseCustomRubrics && (
                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                        Custom Rubric
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1 flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="size-4" />
                                                    {assignment.course.title}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="size-4" />
                                                    {assignment._count.submissions} submissions
                                                </span>
                                                {assignment.dueAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-4" />
                                                        Due {new Date(assignment.dueAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {canUseAIGrading && assignment._count.submissions > 0 && (
                                                <Button variant="outline" size="sm">
                                                    <Zap className="mr-1 size-4" />
                                                    AI Grade
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {assignment.instructions && (
                                    <CardContent>
                                        <p className="line-clamp-2 text-sm text-gray-600">
                                            {assignment.instructions}
                                        </p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Upgrade Prompts */}
            {(!canUseAIGrading || !canUseCustomRubrics) && (
                <Alert>
                    <Crown className="size-4" />
                    <AlertDescription>
                        <strong>Unlock Premium Features:</strong> Get AI-powered grading and custom rubrics with our Premium plan.
                        <Button variant="link" className="ml-2 h-auto p-0">
                            Upgrade Now
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}