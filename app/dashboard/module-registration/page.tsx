import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import { UserRole } from '@prisma/client';
import { createSubscriptionManager } from '@/lib/enhanced-subscription-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Crown,
  Clock,
  Zap
} from 'lucide-react';

export default async function ModuleRegistrationPage() {
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

  // Get current usage statistics (simulated)
  const currentUsage = {
    students: 12,
    courses: 3,
    assignments: 15,
    storageUsedMB: 256,
    aiGradingRequestsThisMonth: 5,
    reportsGeneratedThisMonth: 2
  };

  // Create subscription manager
  const subscriptionManager = createSubscriptionManager({
    userId: user.id,
    role: user.role,
    subscriptionType: 'PREMIUM', // Simulated
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    trialExpiresAt: null,
    currentUsage
  });

  const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
  const usageSummary = subscriptionManager.getUsageSummary({
    students: currentUsage.students,
    courses: currentUsage.courses,
    assignments: currentUsage.assignments,
    storageUsedMB: currentUsage.storageUsedMB,
    aiGradingRequestsThisMonth: currentUsage.aiGradingRequestsThisMonth,
    reportsGeneratedThisMonth: currentUsage.reportsGeneratedThisMonth
  });

  const accessibleModules = subscriptionManager.getAccessibleModules();
  const restrictedModules = subscriptionManager.getRestrictedModules();

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Registration & Access Control</h1>
          <p className="text-muted-foreground">
            Complete LMS module system with subscription-based feature access
          </p>
        </div>
        <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700">
          All Modules Registered
        </Badge>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-5 text-yellow-600" />
            Subscription Status
          </CardTitle>
          <CardDescription>
            Current subscription: {subscriptionInfo.type} | Role: {user.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {subscriptionInfo.status === 'active' ? <CheckCircle className="mx-auto size-8" /> : <Clock className="mx-auto size-8" />}
              </div>
              <p className="text-sm text-muted-foreground">Status: {subscriptionInfo.status}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{accessibleModules.length}</div>
              <p className="text-sm text-muted-foreground">Available Modules</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{restrictedModules.length}</div>
              <p className="text-sm text-muted-foreground">Restricted Modules</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{subscriptionInfo.daysRemaining || 0}</div>
              <p className="text-sm text-muted-foreground">Days Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
          <CardDescription>Current usage against subscription limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Students</span>
                <span className="text-sm text-muted-foreground">
                  {usageSummary.students.current} / {usageSummary.students.limit || '∞'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full bg-blue-600 transition-all duration-300 ${(usageSummary.students.percentage ?? 0) >= 100 ? 'w-full' :
                      (usageSummary.students.percentage ?? 0) >= 90 ? 'w-[90%]' :
                        (usageSummary.students.percentage ?? 0) >= 80 ? 'w-4/5' :
                          (usageSummary.students.percentage ?? 0) >= 75 ? 'w-3/4' :
                            (usageSummary.students.percentage ?? 0) >= 66 ? 'w-2/3' :
                              (usageSummary.students.percentage ?? 0) >= 50 ? 'w-1/2' :
                                (usageSummary.students.percentage ?? 0) >= 33 ? 'w-1/3' :
                                  (usageSummary.students.percentage ?? 0) >= 25 ? 'w-1/4' :
                                    (usageSummary.students.percentage ?? 0) >= 20 ? 'w-1/5' :
                                      (usageSummary.students.percentage ?? 0) >= 10 ? 'w-[10%]' : 'w-0'
                    }`}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Courses</span>
                <span className="text-sm text-muted-foreground">
                  {usageSummary.courses.current} / {usageSummary.courses.limit || '∞'}
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-gray-200">
                {(() => {
                  const percentage = usageSummary.courses.percentage ?? 0;
                  const widthClass = percentage >= 100 ? 'w-full' :
                    percentage >= 90 ? 'w-[90%]' :
                      percentage >= 80 ? 'w-4/5' :
                        percentage >= 75 ? 'w-3/4' :
                          percentage >= 66 ? 'w-2/3' :
                            percentage >= 50 ? 'w-1/2' :
                              percentage >= 33 ? 'w-1/3' :
                                percentage >= 25 ? 'w-1/4' :
                                  percentage >= 20 ? 'w-1/5' :
                                    percentage >= 10 ? 'w-[10%]' : 'w-0';

                  return (
                    <div className={`absolute left-0 top-0 h-2 rounded-full bg-green-600 ${widthClass}`}></div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Assignments</span>
                <span className="text-sm text-muted-foreground">
                  {usageSummary.assignments.current} / {usageSummary.assignments.limit || '∞'}
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-gray-200">
                {(() => {
                  const percentage = usageSummary.assignments.percentage ?? 0;
                  const widthClass = percentage >= 100 ? 'w-full' :
                    percentage >= 90 ? 'w-[90%]' :
                      percentage >= 80 ? 'w-4/5' :
                        percentage >= 75 ? 'w-3/4' :
                          percentage >= 66 ? 'w-2/3' :
                            percentage >= 50 ? 'w-1/2' :
                              percentage >= 33 ? 'w-1/3' :
                                percentage >= 25 ? 'w-1/4' :
                                  percentage >= 20 ? 'w-1/5' :
                                    percentage >= 10 ? 'w-[10%]' : 'w-0';

                  return (
                    <div className={`absolute left-0 top-0 h-2 rounded-full bg-purple-600 ${widthClass}`}></div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(usageSummary.storage.currentMB)}MB / {usageSummary.storage.limitMB ? Math.round(usageSummary.storage.limitMB / 1024) + 'GB' : '∞'}
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-gray-200">
                {(() => {
                  const percentage = usageSummary.storage.percentage ?? 0;
                  const widthClass = percentage >= 100 ? 'w-full' :
                    percentage >= 90 ? 'w-[90%]' :
                      percentage >= 80 ? 'w-4/5' :
                        percentage >= 75 ? 'w-3/4' :
                          percentage >= 66 ? 'w-2/3' :
                            percentage >= 50 ? 'w-1/2' :
                              percentage >= 33 ? 'w-1/3' :
                                percentage >= 25 ? 'w-1/4' :
                                  percentage >= 20 ? 'w-1/5' :
                                    percentage >= 10 ? 'w-[10%]' : 'w-0';

                  return (
                    <div className={`absolute left-0 top-0 h-2 rounded-full bg-orange-600 ${widthClass}`}></div>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Module Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accessible">Accessible Modules</TabsTrigger>
          <TabsTrigger value="restricted">Restricted Modules</TabsTrigger>
          <TabsTrigger value="features">Feature Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Complete subscription and module access overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">User Information</h4>
                  <p className="text-sm">Role: {user.role}</p>
                  <p className="text-sm">Subscription: {subscriptionInfo.type}</p>
                  <p className="text-sm">Status: {subscriptionInfo.status}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Access Summary</h4>
                  <p className="text-sm">Available Modules: {accessibleModules.length}</p>
                  <p className="text-sm">Restricted Modules: {restrictedModules.length}</p>
                  <p className="text-sm">Days Remaining: {subscriptionInfo.daysRemaining || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessible">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Accessible Modules ({accessibleModules.length})</CardTitle>
              <CardDescription>
                These modules are available with your current subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {accessibleModules.map(module => (
                  <div key={module} className="flex items-center rounded-lg border border-green-200 bg-green-50 p-3">
                    <CheckCircle className="mr-3 size-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">{module.replace('_', ' ')}</h4>
                      <p className="text-xs text-green-700">Active & Ready</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restricted">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-700">Restricted Modules ({restrictedModules.length})</CardTitle>
              <CardDescription>
                These modules require a subscription upgrade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {restrictedModules.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 size-12 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">All Modules Available!</h3>
                  <p className="text-green-700">Your current subscription provides access to all LMS modules.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {restrictedModules.map(module => (
                    <div key={module} className="flex items-center rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <XCircle className="mr-3 size-5 text-orange-600" />
                      <div>
                        <h4 className="font-medium text-orange-900">{module.replace('_', ' ')}</h4>
                        <p className="text-xs text-orange-700">Requires Upgrade</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Feature Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Access Tests</CardTitle>
                <CardDescription>
                  Test subscription-based feature access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Users className="size-5" />
                      <span>Add Student</span>
                    </div>
                    {subscriptionManager.canAddStudent(currentUsage.students).canAdd ? (
                      <Badge className="bg-green-100 text-green-700">Allowed</Badge>
                    ) : (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="size-5" />
                      <span>Create Course</span>
                    </div>
                    {subscriptionManager.canCreateCourse(currentUsage.courses).canAdd ? (
                      <Badge className="bg-green-100 text-green-700">Allowed</Badge>
                    ) : (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5" />
                      <span>Create Assignment</span>
                    </div>
                    {subscriptionManager.canCreateAssignment(currentUsage.assignments).canAdd ? (
                      <Badge className="bg-green-100 text-green-700">Allowed</Badge>
                    ) : (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Zap className="size-5" />
                      <span>Use AI Features</span>
                    </div>
                    {subscriptionManager.canUseAIFeatures() ? (
                      <Badge className="bg-blue-100 text-blue-700">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="size-5" />
                      <span>Advanced Analytics</span>
                    </div>
                    {subscriptionManager.canUseAdvancedAnalytics() ? (
                      <Badge className="bg-purple-100 text-purple-700">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Settings className="size-5" />
                      <span>Bulk Operations</span>
                    </div>
                    {subscriptionManager.canUseBulkOperations() ? (
                      <Badge className="bg-gray-100 text-gray-700">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Test the system with various scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <Users className="mr-2 size-4" />
                    Test Student Management
                  </Button>

                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="mr-2 size-4" />
                    Test Course Builder
                  </Button>

                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 size-4" />
                    Test Assignment System
                  </Button>

                  <Button className="w-full justify-start" variant="outline">
                    <Zap className="mr-2 size-4" />
                    Test AI Grading
                  </Button>

                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="mr-2 size-4" />
                    Test Analytics Dashboard
                  </Button>

                  <Button className="w-full justify-start" variant="secondary">
                    <Crown className="mr-2 size-4" />
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Alert */}
      <Alert>
        <CheckCircle className="size-4" />
        <AlertDescription>
          <strong>Module Registration Complete:</strong> All {accessibleModules.length + restrictedModules.length} LMS modules are properly registered and integrated with subscription-based access control.
          Students, course design, assignments, and all other modules can now be assigned to users based on their subscription features.
        </AlertDescription>
      </Alert>
    </div>
  );
}