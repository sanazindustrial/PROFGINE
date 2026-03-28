import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import CourseManagement from '@/components/course-management';
import { UserRole } from '@prisma/client';
import { SubscriptionManager, FeatureType } from '@/lib/subscription-manager';
import { getBillingContext } from '@/lib/access/getBillingContext';

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // First, let's check if the user exists and create a basic user if not
  let user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  // If user doesn't exist, create them (this handles the case where NextAuth created a session but we don't have a user record)
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email!,
        role: UserRole.PROFESSOR // Default role
      }
    });
  }

  // Now get user with full details
  const userWithDetails = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      name: true,
      email: true
    }
  });

  if (!userWithDetails) {
    redirect('/auth/signin');
  }

  // Create subscription manager using actual billing context
  const billingContext = await getBillingContext();
  const actualSubscriptionType = billingContext.tier === 'FREE_TRIAL' ? 'FREE' as const
    : billingContext.tier === 'BASIC' ? 'BASIC' as const
      : billingContext.tier === 'PREMIUM' ? 'PREMIUM' as const
        : billingContext.tier === 'ENTERPRISE' ? 'PREMIUM' as const
          : 'FREE' as const;

  const subscriptionManager = new SubscriptionManager({
    userId: userWithDetails.id,
    role: userWithDetails.role,
    subscriptionType: actualSubscriptionType,
    subscriptionExpiresAt: billingContext.currentPeriodEnd,
    trialExpiresAt: null
  });

  // Fetch courses based on user role
  let courses;

  if (userWithDetails.role === UserRole.ADMIN) {
    // Admins can see all courses
    courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            discussions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } else if (userWithDetails.role === UserRole.PROFESSOR) {
    // Professors can see courses they instruct
    const courseCreationAccess = subscriptionManager.hasFeature(FeatureType.COURSE_CREATION);
    const features = subscriptionManager.getFeatures();
    const courseLimit = features.maxCourses;

    const courseQuery = {
      where: {
        instructorId: userWithDetails.id
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            discussions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    } as any;

    // Apply subscription limits for professors
    if (courseLimit && courseLimit > 0) {
      courseQuery.take = courseLimit;
    }

    courses = await prisma.course.findMany(courseQuery);
  } else {
    // Students can see courses they're enrolled in
    courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            userId: userWithDetails.id
          }
        }
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            discussions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Transform courses to match the expected Course type and add subscription context
  const transformedCourses = courses.map(course => ({
    ...course,
    code: course.code || undefined,
    description: course.description ?? undefined,
    // Map instructor to owner for compatibility
    owner: (course as any).instructor,
    // Map enrollments count to students count for compatibility  
    _count: {
      ...(course as any)._count,
      students: (course as any)._count.enrollments
    }
  }));

  // Prepare subscription context for all non-student roles
  const subscriptionContext = userWithDetails.role !== UserRole.STUDENT ? (() => {
    const isAdmin = userWithDetails.role === UserRole.ADMIN;
    const features = subscriptionManager.getFeatures();
    return {
      canCreateCourse: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.COURSE_CREATION),
      canCreateAssignment: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION),
      canCreateDiscussion: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION),
      canUseCustomRubrics: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.CUSTOM_RUBRICS),
      canUseAiGrading: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.AI_GRADING),
      canAccessAnalytics: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.ADVANCED_ANALYTICS),
      canUseBulkOperations: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.BULK_OPERATIONS),
      canUseApiAccess: isAdmin ? true : subscriptionManager.hasFeature(FeatureType.API_ACCESS),
      coursesUsed: courses.length,
      courseLimit: isAdmin ? -1 : features.maxCourses,
      subscriptionType: isAdmin ? 'PREMIUM' : actualSubscriptionType,
      upgradeMessages: {
        courseCreation: null,
        assignments: null,
        discussions: null,
      }
    };
  })() : null;

  return (
    <CourseManagement
      user={{
        ...userWithDetails,
        name: userWithDetails.name || undefined,
        subscriptionContext: subscriptionContext || undefined
      }}
      courses={transformedCourses}
    />
  );
}