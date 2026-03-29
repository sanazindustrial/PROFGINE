import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PersonalizedWelcome from '@/components/personalized-welcome';
import { getBillingContext } from '@/lib/access/getBillingContext';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin');
    }

    const billingContext = await getBillingContext();

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
                                select: { name: true }
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
                            course: { select: { title: true } }
                        }
                    }
                },
                orderBy: { submittedAt: 'desc' },
                take: 5
            }
        }
    });

    if (!userWithData) {
        redirect('/auth/signin');
    }

    const stats = {
        totalCourses: userWithData.courses.length,
        totalStudents: userWithData.courses.reduce((t, c) => t + c._count.enrollments, 0),
        totalAssignments: userWithData.courses.reduce((t, c) => t + c._count.assignments, 0),
        totalDiscussions: userWithData.courses.reduce((t, c) => t + c._count.discussions, 0),
        totalSubmissions: userWithData.submissions.length,
        totalGradedItems: userWithData.submissions.length,
        totalRubrics: 0,
        recentActivity: [],
    };

    const currentUsage = billingContext.usage ? {
        students: ('studentsCount' in billingContext.usage) ? billingContext.usage.studentsCount || 0 : 0,
        courses: billingContext.usage.coursesCount,
        assignments: billingContext.usage.assignmentsCount,
        aiGrades: billingContext.usage.aiGradesCount,
    } : { students: 0, courses: 0, assignments: 0, aiGrades: 0 };

    return (
        <PersonalizedWelcome
            user={userWithData as any}
            stats={stats}
            billingTier={billingContext.tier}
            billingOwnerType={billingContext.ownerType}
            currentUsage={currentUsage}
        />
    );
}