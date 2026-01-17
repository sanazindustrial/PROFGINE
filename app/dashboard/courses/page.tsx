import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import CourseManagement from '@/components/course-management';
import { UserRole } from '@prisma/client';
import { SubscriptionManager, FeatureType } from '@/lib/subscription-manager';

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

  // Create subscription manager (using defaults since we don't have subscription fields in current schema)
  const subscriptionManager = new SubscriptionManager({
    userId: userWithDetails.id,
    role: userWithDetails.role,
    subscriptionType: 'PREMIUM', // Simulated - you can add to schema later
    subscriptionExpiresAt: null,
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

  // Prepare subscription context for professors
  const subscriptionContext = userWithDetails.role === UserRole.PROFESSOR ? (() => {
    const features = subscriptionManager.getFeatures();
    return {
      canCreateCourse: subscriptionManager.hasFeature(FeatureType.COURSE_CREATION),
      canCreateAssignment: subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION),
      canCreateDiscussion: subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION),
      canUseCustomRubrics: subscriptionManager.hasFeature(FeatureType.CUSTOM_RUBRICS),
      canUseAiGrading: subscriptionManager.hasFeature(FeatureType.AI_GRADING),
      canAccessAnalytics: subscriptionManager.hasFeature(FeatureType.ADVANCED_ANALYTICS),
      canUseBulkOperations: subscriptionManager.hasFeature(FeatureType.BULK_OPERATIONS),
      canUseApiAccess: subscriptionManager.hasFeature(FeatureType.API_ACCESS),
      coursesUsed: courses.length,
      courseLimit: features.maxCourses,
      subscriptionType: 'PREMIUM', // Simulated
      upgradeMessages: {
        courseCreation: subscriptionManager.hasFeature(FeatureType.COURSE_CREATION) ? null : subscriptionManager.getUpgradeMessage('courses'),
        assignments: subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION) ? null : subscriptionManager.getUpgradeMessage('assignments'),
        discussions: subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION) ? null : subscriptionManager.getUpgradeMessage('discussions'),
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