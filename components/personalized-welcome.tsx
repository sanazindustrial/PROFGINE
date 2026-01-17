import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createSubscriptionManager } from '@/lib/subscription-manager';
import { FeatureLayout } from '@/components/feature-layout';
import {
  BookOpen,
  FileText,
  MessageCircle,
  Users,
  GraduationCap,
  Star,
  Crown,
  CheckCircle,
  ArrowRight,
  Calendar,
  Upload,
  BarChart3,
  Zap,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { UserRole, SubscriptionType } from '@prisma/client';
import { FeatureType } from '@/lib/subscription-manager';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  subscriptionType: SubscriptionType;
  subscriptionExpiresAt: Date | null;
  trialExpiresAt: Date | null;
  createdAt: Date;
  ownedCourses: any[];
  enrolledCourses: any[];
  createdAssignments: any[];
  createdDiscussions: any[];
  submissions: any[];
  grades: any[];
  createdRubrics: any[];
}

interface Stats {
  totalCourses: number;
  totalAssignments: number;
  totalDiscussions: number;
  totalSubmissions: number;
  totalGradedItems: number;
  totalRubrics: number;
  totalStudents: number;
  recentActivity: Array<{
    type: string;
    title: string;
    subtitle: string;
    time: Date;
    icon: string;
  }>;
}

interface PersonalizedWelcomeProps {
  user: User;
  stats: Stats;
}

const getIconComponent = (iconName: string) => {
  const icons = {
    FileText,
    MessageCircle,
    Upload,
    CheckCircle,
    BookOpen,
    GraduationCap
  };
  return icons[iconName as keyof typeof icons] || FileText;
};

export default function PersonalizedWelcome({ user, stats }: PersonalizedWelcomeProps) {
  const subscriptionManager = createSubscriptionManager({
    userId: user.id,
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    trialExpiresAt: user.trialExpiresAt
  });
  const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
  const features = subscriptionManager.getFeatures();

  const getSubscriptionColor = (type: SubscriptionType) => {
    switch (type) {
      case 'FREE': return 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100';
      case 'BASIC': return 'border-green-200 bg-gradient-to-r from-green-50 to-green-100';
      case 'PREMIUM': return 'border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100';
      default: return 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100';
    }
  };

  const getSubscriptionIcon = (type: SubscriptionType) => {
    switch (type) {
      case 'FREE': return <Zap className="size-5 text-gray-600" />;
      case 'BASIC': return <CheckCircle className="size-5 text-green-600" />;
      case 'PREMIUM': return <Crown className="size-5 text-purple-600" />;
      default: return <CheckCircle className="size-5 text-gray-600" />;
    }
  };

  const getRoleActions = () => {
    if (user.role === 'STUDENT') {
      return [
        {
          title: 'View My Courses',
          description: 'Access course materials and assignments',
          href: '/dashboard/courses',
          icon: BookOpen,
          color: 'blue'
        },
        {
          title: 'Submit Assignments',
          description: 'Upload and submit your work',
          href: '/dashboard/assignments',
          icon: Upload,
          color: 'green'
        }
      ];
    }

    return [
      {
        title: 'Course Management',
        description: 'Create and manage your courses',
        href: '/dashboard/courses',
        icon: BookOpen,
        color: 'blue'
      },
      {
        title: 'Assignment Designer',
        description: 'Create assignments with custom rubrics',
        href: '/dashboard/assignments/new',
        icon: FileText,
        color: 'green',
        disabled: !subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION)
      },
      {
        title: 'Discussion Manager',
        description: 'Foster meaningful discussions',
        href: '/dashboard/discussions/new',
        icon: MessageCircle,
        color: 'purple',
        disabled: !subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION)
      },
      {
        title: 'AI Grading Assistant',
        description: 'Grade submissions with AI assistance',
        href: '/grade',
        icon: GraduationCap,
        color: 'orange',
        disabled: !subscriptionManager.hasFeature(FeatureType.AI_GRADING)
      }
    ];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <FeatureLayout
      title={`Welcome back, ${user.name?.split(' ')[0] || user.role}! 🎓`}
      description="Here's your personalized dashboard with everything you need to succeed."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Subscription Status - Full Width */}
        <Card className={`lg:col-span-12 ${getSubscriptionColor(user.subscriptionType)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getSubscriptionIcon(user.subscriptionType)}
                <div>
                  <CardTitle className="text-lg">
                    {user.subscriptionType.replace('_', ' ')} Plan
                    {user.role === 'ADMIN' && <Badge className="ml-2">Administrator</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {subscriptionInfo.isActive ? 'Active subscription' : 'Subscription expired'}
                    {subscriptionInfo.daysRemaining && (
                      ` • ${subscriptionInfo.daysRemaining} days remaining`
                    )}
                  </CardDescription>
                </div>
              </div>
              {subscriptionInfo.needsUpgrade && (
                <Link href="/subscription/upgrade">
                  <Button size="sm">Upgrade Plan</Button>
                </Link>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user.role === 'STUDENT' ? 'Enrolled Courses' : 'My Courses'}
              </CardTitle>
              <BookOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {features.maxCourses === -1 ? (
                  <>Unlimited</>
                ) : (
                  <>
                    {stats.totalCourses} of {features.maxCourses}
                    <Progress
                      value={(stats.totalCourses / features.maxCourses) * 100}
                      className="h-1 w-8"
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
              <div className="text-xs text-muted-foreground">
                {user.role === 'STUDENT' ? 'Submitted' : 'Created'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discussions</CardTitle>
              <MessageCircle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDiscussions}</div>
              <div className="text-xs text-muted-foreground">
                Active threads
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user.role === 'STUDENT' ? 'My Students' : 'Total Students'}
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <div className="text-xs text-muted-foreground">
                Across all courses
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getRoleActions().map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={action.disabled ? 'pointer-events-none opacity-50' : ''}
                >
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <Icon className={`text-${action.color}-600 size-5`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-purple-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => {
                  const Icon = getIconComponent(activity.icon);
                  return (
                    <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                      <Icon className="size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <TrendingUp className="mx-auto mb-2 size-12 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Your activity will appear here as you use the platform</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 text-yellow-600" />
              Your Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Course Creation</span>
                <Badge variant={features.maxCourses === -1 ? 'default' : 'secondary'}>
                  {features.maxCourses === -1 ? 'Unlimited' : `${features.maxCourses} max`}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>AI Grading</span>
                <Badge variant={features.aiGrading ? 'default' : 'secondary'}>
                  {features.aiGrading ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Custom Rubrics</span>
                <Badge variant={features.customRubrics ? 'default' : 'secondary'}>
                  {features.customRubrics ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Advanced Analytics</span>
                <Badge variant={features.advancedAnalytics ? 'default' : 'secondary'}>
                  {features.advancedAnalytics ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>

            {subscriptionInfo.needsUpgrade && (
              <div className="border-t pt-3">
                <Link href="/subscription/upgrade">
                  <Button size="sm" className="w-full">
                    <ArrowRight className="mr-2 size-4" />
                    Upgrade for More Features
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureLayout>
  );
}