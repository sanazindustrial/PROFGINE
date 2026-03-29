import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createSubscriptionManager } from '@/lib/subscription-manager';
import { Sidebar } from '@/components/sidebar';
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
  Upload,
  BarChart3,
  Zap,
  TrendingUp,
  CreditCard,
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
  billingTier: string;
  billingOwnerType: string;
  currentUsage: {
    students: number;
    courses: number;
    assignments: number;
    aiGrades: number;
  };
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    FileText,
    MessageCircle,
    Upload,
    CheckCircle,
    BookOpen,
    GraduationCap,
  };
  return icons[iconName] || FileText;
};

export default function PersonalizedWelcome({
  user,
  stats,
  billingTier,
  billingOwnerType,
  currentUsage,
}: PersonalizedWelcomeProps) {
  const subscriptionManager = createSubscriptionManager({
    userId: user.id,
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    trialExpiresAt: user.trialExpiresAt,
  });
  const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
  const features = subscriptionManager.getFeatures();

  const tierLabel = billingTier.replace(/_/g, ' ');
  const tierColor =
    billingTier === 'PREMIUM' || billingTier === 'ENTERPRISE'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      : billingTier === 'BASIC'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  const isFreeTier = billingTier === 'FREE_TRIAL' || billingTier === 'FREE';

  const tierLimits: Record<string, { courses: number; aiGrades: number; students: number }> = {
    FREE_TRIAL: { courses: 2, aiGrades: 10, students: 10 },
    FREE: { courses: 2, aiGrades: 10, students: 10 },
    BASIC: { courses: 10, aiGrades: 100, students: 50 },
    PREMIUM: { courses: -1, aiGrades: -1, students: -1 },
    ENTERPRISE: { courses: -1, aiGrades: -1, students: -1 },
  };
  const limits = tierLimits[billingTier] ?? tierLimits.FREE_TRIAL;

  const getRoleActions = () => {
    if (user.role === 'STUDENT') {
      return [
        { title: 'My Courses', desc: 'Access materials & assignments', href: '/dashboard/courses', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
        { title: 'Submit Work', desc: 'Upload and submit assignments', href: '/dashboard/assignments', icon: Upload, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
        { title: 'Discussions', desc: 'Participate in class threads', href: '/discussion', icon: MessageCircle, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
        { title: 'My Grades', desc: 'View feedback and scores', href: '/dashboard/profile', icon: GraduationCap, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
      ];
    }
    return [
      { title: 'Course Management', desc: 'Create and manage your courses', href: '/dashboard/courses', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
      { title: 'Assignment Designer', desc: 'Create with custom rubrics', href: '/dashboard/assignments/new', icon: FileText, color: 'text-green-600 bg-green-50 dark:bg-green-950', disabled: !subscriptionManager.hasFeature(FeatureType.ASSIGNMENT_CREATION) },
      { title: 'Discussion Manager', desc: 'Foster meaningful discussions', href: '/discussion', icon: MessageCircle, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950', disabled: !subscriptionManager.hasFeature(FeatureType.DISCUSSION_CREATION) },
      { title: 'AI Grading', desc: 'Grade submissions with AI', href: '/grade', icon: GraduationCap, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950', disabled: !subscriptionManager.hasFeature(FeatureType.AI_GRADING) },
    ];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const statCards = [
    { label: user.role === 'STUDENT' ? 'Enrolled' : 'Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Assignments', value: stats.totalAssignments, icon: FileText, color: 'text-green-600' },
    { label: 'Discussions', value: stats.totalDiscussions, icon: MessageCircle, color: 'text-purple-600' },
    { label: 'Students', value: stats.totalStudents, icon: Users, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <div className="space-y-6">

              {/* ── Welcome Header ────────────────────────── */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Welcome back, {user.name?.split(' ')[0] || 'Professor'}!
                  </h1>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Here&apos;s your personalized dashboard overview.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`px-3 py-1 text-xs font-semibold ${tierColor}`}>
                    {tierLabel} Plan
                  </Badge>
                  {isFreeTier && (
                    <Button asChild size="sm" variant="default" className="h-8 text-xs">
                      <Link href="/subscription/upgrade">Upgrade</Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* ── Stats Cards ───────────────────────────── */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {statCards.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.label} className="border shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{s.label}</p>
                          <Icon className={`size-4 ${s.color} opacity-70`} />
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{s.value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* ── Quick Actions Grid ────────────────────── */}
              <div>
                <h2 className="mb-3 text-base font-semibold sm:text-lg">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {getRoleActions().map((action) => {
                    const Icon = action.icon;
                    const disabled = 'disabled' in action && action.disabled;
                    return (
                      <Link
                        key={action.title}
                        href={action.href}
                        className={disabled ? 'pointer-events-none opacity-50' : ''}
                      >
                        <Card className="group h-full border shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                          <CardContent className="flex items-start gap-4 p-4 sm:p-5">
                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                              <Icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold group-hover:text-primary">{action.title}</p>
                              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{action.desc}</p>
                            </div>
                            <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* ── Usage & Features Row ──────────────────── */}
              <div className="grid gap-4 md:grid-cols-2">

                {/* Usage & Limits */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="size-4 text-blue-600" />
                      Usage &amp; Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Courses', used: currentUsage.courses, max: limits.courses },
                      { label: 'AI Grades', used: currentUsage.aiGrades, max: limits.aiGrades },
                      { label: 'Students', used: currentUsage.students, max: limits.students },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium tabular-nums">
                            {item.used}{item.max === -1 ? ' / ∞' : ` / ${item.max}`}
                          </span>
                        </div>
                        {item.max !== -1 && (
                          <Progress
                            value={item.max > 0 ? Math.min((item.used / item.max) * 100, 100) : 0}
                            className="h-1.5"
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 border-t pt-3">
                      <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                        <Link href="/dashboard/credits">
                          <CreditCard className="mr-1.5 size-3.5" />
                          Credits
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                        <Link href="/dashboard/billing">
                          <Crown className="mr-1.5 size-3.5" />
                          Billing
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Your Features */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="size-4 text-yellow-600" />
                      Your Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Course Creation', value: features.maxCourses === -1 ? 'Unlimited' : `${features.maxCourses} max`, active: true },
                      { label: 'AI Grading', value: features.aiGrading ? 'Enabled' : 'Disabled', active: features.aiGrading },
                      { label: 'Custom Rubrics', value: features.customRubrics ? 'Enabled' : 'Disabled', active: features.customRubrics },
                      { label: 'Advanced Analytics', value: features.advancedAnalytics ? 'Enabled' : 'Disabled', active: features.advancedAnalytics },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{f.label}</span>
                        <Badge
                          variant={f.active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {f.value}
                        </Badge>
                      </div>
                    ))}
                    {subscriptionInfo.needsUpgrade && (
                      <div className="border-t pt-3">
                        <Button asChild size="sm" className="w-full text-xs">
                          <Link href="/subscription/upgrade">
                            <ArrowRight className="mr-1.5 size-3.5" />
                            Upgrade for More
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Recent Activity ───────────────────────── */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4 text-purple-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentActivity.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentActivity.map((activity, index) => {
                        const Icon = getIconComponent(activity.icon);
                        return (
                          <div key={index} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{activity.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{activity.subtitle}</p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatTimeAgo(activity.time)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <TrendingUp className="mb-2 size-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No recent activity yet</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Activity will appear here as you use the platform.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── AI Provider Status ────────────────────── */}
              <Card className="border border-dashed">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                      <Zap className="size-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">AI Providers</p>
                      <p className="text-xs text-muted-foreground">Multi-provider system with automatic failover</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-600">
                    <span className="mr-1.5 inline-block size-1.5 rounded-full bg-green-500" />
                    Online
                  </Badge>
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}