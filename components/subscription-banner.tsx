'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, AlertTriangle, Check, X } from 'lucide-react';

interface SubscriptionBannerProps {
  subscriptionContext: {
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
}

export default function SubscriptionBanner({ subscriptionContext }: SubscriptionBannerProps) {
  const {
    canCreateCourse,
    canCreateAssignment,
    canCreateDiscussion,
    canUseCustomRubrics,
    canUseAiGrading,
    canAccessAnalytics,
    canUseBulkOperations,
    canUseApiAccess,
    coursesUsed,
    courseLimit,
    subscriptionType,
    upgradeMessages
  } = subscriptionContext;

  const getSubscriptionIcon = () => {
    switch (subscriptionType) {
      case 'ENTERPRISE':
        return <Crown className="size-5 text-purple-600" />;
      case 'PREMIUM':
        return <Zap className="size-5 text-blue-600" />;
      default:
        return <AlertTriangle className="size-5 text-orange-600" />;
    }
  };

  const getSubscriptionColor = () => {
    switch (subscriptionType) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      case 'PREMIUM':
        return 'bg-blue-100 text-blue-800';
      case 'BASIC':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const features = [
    { name: 'Course Creation', enabled: canCreateCourse, premium: false },
    { name: 'Assignment Creation', enabled: canCreateAssignment, premium: false },
    { name: 'Discussion Forums', enabled: canCreateDiscussion, premium: false },
    { name: 'Custom Rubrics', enabled: canUseCustomRubrics, premium: true },
    { name: 'AI Grading', enabled: canUseAiGrading, premium: true },
    { name: 'Advanced Analytics', enabled: canAccessAnalytics, premium: true },
    { name: 'Bulk Operations', enabled: canUseBulkOperations, premium: true },
    { name: 'API Access', enabled: canUseApiAccess, premium: true }
  ];

  const isLimitReached = courseLimit && coursesUsed >= courseLimit;

  return (
    <div className="mb-6 space-y-4">
      {/* Subscription Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getSubscriptionIcon()}
              <CardTitle className="text-lg">Subscription Status</CardTitle>
              <Badge className={getSubscriptionColor()}>
                {subscriptionType}
              </Badge>
            </div>
            {subscriptionType !== 'ENTERPRISE' && (
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            )}
          </div>
          <CardDescription>
            Manage your courses and educational features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Usage Stats */}
            <div>
              <h4 className="mb-2 font-medium">Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Courses</span>
                  <span className={isLimitReached ? 'font-medium text-red-600' : ''}>
                    {coursesUsed}{courseLimit ? ` / ${courseLimit}` : ''}
                    {courseLimit === undefined && ' (Unlimited)'}
                  </span>
                </div>
                {isLimitReached && (
                  <Alert>
                    <AlertTriangle className="size-4" />
                    <AlertDescription>
                      You&apos;ve reached your course creation limit. Upgrade to create more courses.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="mb-2 font-medium">Available Features</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    {feature.enabled ? (
                      <Check className="size-3 text-green-600" />
                    ) : (
                      <X className="size-3 text-gray-400" />
                    )}
                    <span className={feature.enabled ? 'text-green-700' : 'text-gray-500'}>
                      {feature.name}
                    </span>
                    {feature.premium && !feature.enabled && (
                      <Badge variant="secondary" className="px-1 py-0 text-xs">
                        PRO
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Messages */}
      {upgradeMessages && Object.values(upgradeMessages).some(msg => msg) && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            <div className="space-y-1">
              {upgradeMessages.courseCreation && (
                <div>{upgradeMessages.courseCreation}</div>
              )}
              {upgradeMessages.assignments && (
                <div>{upgradeMessages.assignments}</div>
              )}
              {upgradeMessages.discussions && (
                <div>{upgradeMessages.discussions}</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}