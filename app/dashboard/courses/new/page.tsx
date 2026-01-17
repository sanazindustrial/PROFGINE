import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CreateCourseForm from '@/components/create-course-form';
import { SubscriptionManager } from '@/lib/subscription-manager';
import { UserRole } from '@prisma/client';

export default async function NewCoursePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            role: true,
            subscription: true,
            courses: {
                select: { id: true }
            }
        }
    });

    if (!user) {
        redirect('/auth/signin');
    }

    // Only professors and admins can create courses
    if (user.role === UserRole.STUDENT) {
        redirect('/dashboard/courses');
    }

    // Check subscription limits for professors
    if (user.role === UserRole.PROFESSOR) {
        const canCreate = SubscriptionManager.canCreateCourse(
            user.subscription?.type || 'FREE',
            user.courses.length
        );

        if (!canCreate) {
            redirect('/subscription/upgrade?reason=course_limit');
        }
    }

    return <CreateCourseForm userId={user.id} />;
}