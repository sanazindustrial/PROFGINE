import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import SubscriptionBanner from '@/components/subscription-banner';
import { UserRole } from '@prisma/client';
import { SubscriptionManager, FeatureType } from '@/lib/subscription-manager';

export default async function SubscriptionTestPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get user
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

  // Create subscription manager
  const subscriptionManager = new SubscriptionManager({
    userId: user.id,
    role: user.role,
    subscriptionType: 'PREMIUM',
    subscriptionExpiresAt: null,
    trialExpiresAt: null
  });

  // Get current courses count
  const coursesCount = await prisma.course.count({
    where: { instructorId: user.id }
  });

  // Prepare subscription context
  const subscriptionContext = {
    canCreateCourse: subscriptionManager.hasFeature(FeatureType.COURSE_CREATION),
    canCreateAssignment: subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION),
    canCreateDiscussion: subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION),
    canUseCustomRubrics: subscriptionManager.hasFeature(FeatureType.CUSTOM_RUBRICS),
    canUseAiGrading: subscriptionManager.hasFeature(FeatureType.AI_GRADING),
    canAccessAnalytics: subscriptionManager.hasFeature(FeatureType.ADVANCED_ANALYTICS),
    canUseBulkOperations: subscriptionManager.hasFeature(FeatureType.BULK_OPERATIONS),
    canUseApiAccess: subscriptionManager.hasFeature(FeatureType.API_ACCESS),
    coursesUsed: coursesCount,
    courseLimit: 10, // Set a reasonable limit for premium
    subscriptionType: 'PREMIUM',
    upgradeMessages: {
      courseCreation: subscriptionManager.hasFeature(FeatureType.COURSE_CREATION) ? null : subscriptionManager.getUpgradeMessage('courses'),
      assignments: subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION) ? null : subscriptionManager.getUpgradeMessage('assignments'),
      discussions: subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION) ? null : subscriptionManager.getUpgradeMessage('discussions'),
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Subscription Features Test</h1>

      <SubscriptionBanner subscriptionContext={subscriptionContext} />

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Feature Access Details</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 font-medium">Core Features</h3>
            <ul className="space-y-1 text-sm">
              <li className={subscriptionContext.canCreateCourse ? 'text-green-600' : 'text-red-600'}>
                ✓ Course Creation: {subscriptionContext.canCreateCourse ? 'Enabled' : 'Disabled'}
              </li>
              <li className={subscriptionContext.canCreateAssignment ? 'text-green-600' : 'text-red-600'}>
                ✓ Assignment Creation: {subscriptionContext.canCreateAssignment ? 'Enabled' : 'Disabled'}
              </li>
              <li className={subscriptionContext.canCreateDiscussion ? 'text-green-600' : 'text-red-600'}>
                ✓ Discussion Forums: {subscriptionContext.canCreateDiscussion ? 'Enabled' : 'Disabled'}
              </li>
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 font-medium">Premium Features</h3>
            <ul className="space-y-1 text-sm">
              <li className={subscriptionContext.canUseCustomRubrics ? 'text-green-600' : 'text-red-600'}>
                ✓ Custom Rubrics: {subscriptionContext.canUseCustomRubrics ? 'Enabled' : 'Disabled'}
              </li>
              <li className={subscriptionContext.canUseAiGrading ? 'text-green-600' : 'text-red-600'}>
                ✓ AI Grading: {subscriptionContext.canUseAiGrading ? 'Enabled' : 'Disabled'}
              </li>
              <li className={subscriptionContext.canAccessAnalytics ? 'text-green-600' : 'text-red-600'}>
                ✓ Advanced Analytics: {subscriptionContext.canAccessAnalytics ? 'Enabled' : 'Disabled'}
              </li>
              <li className={subscriptionContext.canUseBulkOperations ? 'text-green-600' : 'text-red-600'}>
                ✓ Bulk Operations: {subscriptionContext.canUseBulkOperations ? 'Enabled' : 'Disabled'}
              </li>
              <li className={subscriptionContext.canUseApiAccess ? 'text-green-600' : 'text-red-600'}>
                ✓ API Access: {subscriptionContext.canUseApiAccess ? 'Enabled' : 'Disabled'}
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-medium">Usage Statistics</h3>
          <p className="text-sm">
            <strong>Courses:</strong> {subscriptionContext.coursesUsed} / {subscriptionContext.courseLimit || 'Unlimited'}
          </p>
          <p className="text-sm">
            <strong>Subscription Tier:</strong> {subscriptionContext.subscriptionType}
          </p>
          <p className="text-sm">
            <strong>User Role:</strong> {user.role}
          </p>
        </div>
      </div>
    </div>
  );
}