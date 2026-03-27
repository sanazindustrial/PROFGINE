import { requireSession } from '@/lib/auth';
import { getBillingContext } from '@/lib/access/getBillingContext';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
    User,
    Crown,
    Calendar,
    Mail,
    Shield,
    BookOpen,
    FileText,
    Users,
    Zap,
    TrendingUp,
    CreditCard,
    Settings,
    Award,
    Download,
    Trash2,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Database,
    FileDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    Key
} from 'lucide-react';

export default async function ProfilePage() {
    const session = await requireSession();
    const billingContext = await getBillingContext();

    // Get user with comprehensive data
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            courses: {
                include: {
                    _count: {
                        select: { enrollments: true, assignments: true }
                    }
                }
            },
            submissions: true,
            gradesGiven: true
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Calculate usage statistics
    const usage = billingContext.usage ? {
        students: ('studentsCount' in billingContext.usage) ? billingContext.usage.studentsCount || 0 : 0,
        courses: billingContext.usage.coursesCount,
        assignments: billingContext.usage.assignmentsCount,
        aiGrades: billingContext.usage.aiGradesCount,
        plagiarismScans: billingContext.usage.plagiarismScansCount,
    } : {
        students: 0,
        courses: 0,
        assignments: 0,
        aiGrades: 0,
        plagiarismScans: 0,
    };

    // Define plan limits for progress bars
    const planLimits = {
        FREE_TRIAL: {
            courses: 2,
            students: 10,
            assignments: 5,
            aiGrades: 10,
        },
        BASIC: {
            courses: 10,
            students: 50,
            assignments: 25,
            aiGrades: 100,
        },
        PREMIUM: {
            courses: -1, // unlimited
            students: -1,
            assignments: -1,
            aiGrades: 500,
        },
        ENTERPRISE: {
            courses: -1,
            students: -1,
            assignments: -1,
            aiGrades: -1,
        }
    };

    const limits = planLimits[billingContext.tier as keyof typeof planLimits];

    const getUsagePercentage = (current: number, limit: number) => {
        if (limit === -1) return 0; // unlimited
        return Math.min((current / limit) * 100, 100);
    };

    const getPlanColor = (tier: string) => {
        switch (tier) {
            case 'FREE_TRIAL': return 'text-gray-600 bg-gray-100';
            case 'BASIC': return 'text-blue-600 bg-blue-100';
            case 'PREMIUM': return 'text-purple-600 bg-purple-100';
            case 'ENTERPRISE': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="container mx-auto space-y-6 py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Profile & Data Control</h1>
                    <p className="text-muted-foreground">Manage your account, privacy settings, and data control options</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard/billing">
                        <CreditCard className="mr-2 size-4" />
                        Manage Billing
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="data-control">Data Control</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Profile Information */}
                        <div className="space-y-6 lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="size-5" />
                                        Account Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="size-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Name</span>
                                        </div>
                                        <p className="font-medium">{user.name || 'Not provided'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Email</span>
                                        </div>
                                        <p className="font-medium">{user.email}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Shield className="size-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Role</span>
                                        </div>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Member Since</span>
                                        </div>
                                        <p className="text-sm">{user.createdAt.toLocaleDateString()}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current Subscription */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Crown className="size-5" />
                                        Current Plan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className={getPlanColor(billingContext.tier)} variant="secondary">
                                            {billingContext.tier}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {billingContext.ownerType === 'ORG' ? 'Organization' : 'Personal'}
                                        </span>
                                    </div>

                                    {billingContext.tier !== 'ENTERPRISE' && (
                                        <div className="pt-2">
                                            <Button asChild size="sm" className="w-full">
                                                <Link href="/dashboard/billing">
                                                    Upgrade Plan
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Activity Summary */}
                        <div className="space-y-6 lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="size-5" />
                                        Activity Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        <div className="rounded-lg border p-4 text-center">
                                            <BookOpen className="mx-auto mb-2 size-8 text-blue-500" />
                                            <div className="text-2xl font-bold">{user.courses.length}</div>
                                            <div className="text-sm text-muted-foreground">Courses Created</div>
                                        </div>

                                        <div className="rounded-lg border p-4 text-center">
                                            <Users className="mx-auto mb-2 size-8 text-green-500" />
                                            <div className="text-2xl font-bold">
                                                {user.courses.reduce((total, course) => total + course._count.enrollments, 0)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Students Taught</div>
                                        </div>

                                        <div className="rounded-lg border p-4 text-center">
                                            <FileText className="mx-auto mb-2 size-8 text-purple-500" />
                                            <div className="text-2xl font-bold">
                                                {user.courses.reduce((total, course) => total + course._count.assignments, 0)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Assignments</div>
                                        </div>

                                        <div className="rounded-lg border p-4 text-center">
                                            <Zap className="mx-auto mb-2 size-8 text-orange-500" />
                                            <div className="text-2xl font-bold">{usage.aiGrades}</div>
                                            <div className="text-sm text-muted-foreground">AI Grades</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Data Control Tab */}
                <TabsContent value="data-control" className="space-y-6">
                    <Alert>
                        <Database className="size-4" />
                        <AlertDescription>
                            You have complete control over your data. Export, view, or delete your information at any time.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Data Export */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="size-5" />
                                    Export My Data
                                </CardTitle>
                                <CardDescription>
                                    Download all your data in a portable format
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Includes courses, assignments, grades, and all activity data
                                    </p>
                                    <ul className="space-y-1 pl-4 text-xs text-muted-foreground">
                                        <li>• Course information and enrollment data</li>
                                        <li>• Assignment submissions and grades</li>
                                        <li>• Discussion posts and responses</li>
                                        <li>• Usage statistics and activity logs</li>
                                        <li>• Account settings and preferences</li>
                                    </ul>
                                </div>
                                <Button className="w-full" variant="outline">
                                    <FileDown className="mr-2 size-4" />
                                    Request Data Export
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Export will be emailed to you within 24 hours
                                </p>
                            </CardContent>
                        </Card>

                        {/* Data Deletion */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trash2 className="size-5" />
                                    Delete My Data
                                </CardTitle>
                                <CardDescription>
                                    Permanently remove your data from our systems
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertTriangle className="size-4" />
                                    <AlertDescription>
                                        This action cannot be undone. All data will be permanently deleted.
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        This will delete:
                                    </p>
                                    <ul className="space-y-1 pl-4 text-xs text-muted-foreground">
                                        <li>• Your account and profile</li>
                                        <li>• All courses and assignments</li>
                                        <li>• Student enrollments and grades</li>
                                        <li>• Discussion posts and AI responses</li>
                                        <li>• Usage data and analytics</li>
                                    </ul>
                                </div>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 size-4" />
                                    Delete All My Data
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    {/* Data Retention Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="size-5" />
                                Data Retention Preferences
                            </CardTitle>
                            <CardDescription>
                                Control how long different types of data are kept
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Course Data</Label>
                                        <p className="text-xs text-muted-foreground">Course information and assignments</p>
                                    </div>
                                    <select className="rounded border px-3 py-1 text-sm" aria-label="Course data retention period">
                                        <option value="1">1 Year</option>
                                        <option value="2">2 Years</option>
                                        <option value="5" selected>5 Years</option>
                                        <option value="forever">Forever</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Student Data</Label>
                                        <p className="text-xs text-muted-foreground">Enrollments and grade information</p>
                                    </div>
                                    <select className="rounded border px-3 py-1 text-sm" aria-label="Student data retention period">
                                        <option value="1">1 Year</option>
                                        <option value="3">3 Years</option>
                                        <option value="7" selected>7 Years</option>
                                        <option value="forever">Forever</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Activity Logs</Label>
                                        <p className="text-xs text-muted-foreground">Usage statistics and system logs</p>
                                    </div>
                                    <select className="rounded border px-3 py-1 text-sm" aria-label="Activity logs retention period">
                                        <option value="6months">6 Months</option>
                                        <option value="1" selected>1 Year</option>
                                        <option value="2">2 Years</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">AI Generated Content</Label>
                                        <p className="text-xs text-muted-foreground">AI responses and feedback</p>
                                    </div>
                                    <select className="rounded border px-3 py-1 text-sm" aria-label="AI generated content retention period">
                                        <option value="6months">6 Months</option>
                                        <option value="1" selected>1 Year</option>
                                        <option value="3">3 Years</option>
                                    </select>
                                </div>
                            </div>

                            <Button className="w-full" variant="outline">
                                Save Retention Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-6">
                    <Alert>
                        <Lock className="size-4" />
                        <AlertDescription>
                            Control how your data is used and what information is shared across the platform.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="size-5" />
                                    Profile Visibility
                                </CardTitle>
                                <CardDescription>
                                    Control who can see your information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Show Email to Students</Label>
                                        <p className="text-xs text-muted-foreground">Allow enrolled students to see your email</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Public Profile</Label>
                                        <p className="text-xs text-muted-foreground">Show your profile in the professor directory</p>
                                    </div>
                                    <Switch />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Show Activity Status</Label>
                                        <p className="text-xs text-muted-foreground">Let others see when you were last active</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="size-5" />
                                    AI & Data Usage
                                </CardTitle>
                                <CardDescription>
                                    Control how AI features use your data
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">AI Content Generation</Label>
                                        <p className="text-xs text-muted-foreground">Allow AI to use your course data for generating content</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Analytics Collection</Label>
                                        <p className="text-xs text-muted-foreground">Help improve the platform with usage analytics</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Third-party Integrations</Label>
                                        <p className="text-xs text-muted-foreground">Share data with connected services (e.g., LMS)</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="size-5" />
                                Communication Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Email Notifications</Label>
                                    <p className="text-xs text-muted-foreground">Receive updates about courses and submissions</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Marketing Emails</Label>
                                    <p className="text-xs text-muted-foreground">Receive news about new features and promotions</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Usage Tab */}
                <TabsContent value="usage" className="space-y-6">
                    <Alert>
                        <TrendingUp className="size-4" />
                        <AlertDescription>
                            Track your platform usage and resource consumption against your plan limits.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="size-5" />
                                Resource Usage
                            </CardTitle>
                            <CardDescription>
                                Current billing period usage for your <Badge className={getPlanColor(billingContext.tier)} variant="secondary">{billingContext.tier}</Badge> plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <BookOpen className="size-4 text-blue-500" />
                                            Courses
                                        </span>
                                        <span className="text-muted-foreground">
                                            {usage.courses} / {limits.courses === -1 ? '∞' : limits.courses}
                                        </span>
                                    </div>
                                    <Progress value={getUsagePercentage(usage.courses, limits.courses)} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Users className="size-4 text-green-500" />
                                            Students
                                        </span>
                                        <span className="text-muted-foreground">
                                            {usage.students} / {limits.students === -1 ? '∞' : limits.students}
                                        </span>
                                    </div>
                                    <Progress value={getUsagePercentage(usage.students, limits.students)} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <FileText className="size-4 text-purple-500" />
                                            Assignments
                                        </span>
                                        <span className="text-muted-foreground">
                                            {usage.assignments} / {limits.assignments === -1 ? '∞' : limits.assignments}
                                        </span>
                                    </div>
                                    <Progress value={getUsagePercentage(usage.assignments, limits.assignments)} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Zap className="size-4 text-orange-500" />
                                            AI Grades Used
                                        </span>
                                        <span className="text-muted-foreground">
                                            {usage.aiGrades} / {limits.aiGrades === -1 ? '∞' : limits.aiGrades}
                                        </span>
                                    </div>
                                    <Progress value={getUsagePercentage(usage.aiGrades, limits.aiGrades)} className="h-2" />
                                </div>
                            </div>

                            {billingContext.tier === 'FREE_TRIAL' && (
                                <Alert>
                                    <AlertTriangle className="size-4" />
                                    <AlertDescription>
                                        You&apos;re on the Free Trial. <Link href="/dashboard/billing" className="font-medium underline">Upgrade</Link> to increase your limits.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="size-5" />
                                Account Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold">{user.courses.length}</div>
                                    <div className="text-sm text-muted-foreground">Total Courses</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold">{user.submissions.length}</div>
                                    <div className="text-sm text-muted-foreground">Submissions</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold">{user.gradesGiven.length}</div>
                                    <div className="text-sm text-muted-foreground">Grades Given</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold">{Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))}</div>
                                    <div className="text-sm text-muted-foreground">Days Active</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Alert>
                        <Shield className="size-4" />
                        <AlertDescription>
                            Manage your account security settings and monitor active sessions.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="size-5" />
                                    Authentication
                                </CardTitle>
                                <CardDescription>
                                    How you sign in to your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="size-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium">Google OAuth</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600">Connected</Badge>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-3">
                                        <Lock className="size-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Two-Factor Authentication</p>
                                            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-yellow-600">Not Enabled</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="size-5" />
                                    Account Security
                                </CardTitle>
                                <CardDescription>
                                    Security status and recommendations
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="size-4 text-green-500" />
                                        <span className="text-sm">Email verified</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="size-4 text-green-500" />
                                        <span className="text-sm">Google OAuth connected</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="size-4 text-yellow-500" />
                                        <span className="text-sm">Two-factor authentication not enabled</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Last Sign-in</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user.updatedAt?.toLocaleDateString()} at {user.updatedAt?.toLocaleTimeString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Unlock className="size-5" />
                                Active Sessions
                            </CardTitle>
                            <CardDescription>
                                Devices currently signed in to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="size-5 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium">Current Session</p>
                                        <p className="text-xs text-muted-foreground">This device &bull; Active now</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-green-600">Active</Badge>
                            </div>

                            <Button variant="outline" className="w-full">
                                <EyeOff className="mr-2 size-4" />
                                Sign Out All Other Sessions
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}