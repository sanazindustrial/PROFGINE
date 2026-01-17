import { createModuleManager, LMSModule } from '@/lib/module-manager';
import { UserRole, SubscriptionType } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Check,
    X,
    Crown,
    Zap,
    Users,
    BookOpen,
    FileText,
    MessageSquare,
    BarChart3,
    Calendar,
    Settings,
    Shield,
    UserCheck,
    GraduationCap,
    ChevronRight,
    Unlock,
    Lock
} from 'lucide-react';

interface FeatureAccessStatusProps {
    userRole: UserRole;
    subscriptionType?: SubscriptionType | null;
    subscriptionExpiresAt?: Date | null;
    trialExpiresAt?: Date | null;
    currentUsage?: Record<string, number>;
}

const moduleIcons: Record<LMSModule, any> = {
    // Core Learning Modules
    [LMSModule.COURSE_MANAGEMENT]: BookOpen,
    [LMSModule.STUDENT_ENROLLMENT]: Users,
    [LMSModule.ASSIGNMENT_SYSTEM]: FileText,
    [LMSModule.DISCUSSION_FORUMS]: MessageSquare,
    [LMSModule.GRADING_SYSTEM]: BarChart3,

    // Advanced Modules
    [LMSModule.RUBRIC_BUILDER]: Settings,
    [LMSModule.AI_GRADING_ENGINE]: Zap,
    [LMSModule.ANALYTICS_DASHBOARD]: BarChart3,
    [LMSModule.BULK_OPERATIONS]: Settings,

    // Student-Specific Modules
    [LMSModule.STUDENT_DASHBOARD]: GraduationCap,
    [LMSModule.SUBMISSION_SYSTEM]: FileText,
    [LMSModule.GRADE_VIEWER]: BarChart3,
    [LMSModule.DISCUSSION_PARTICIPATION]: MessageSquare,

    // Administrative Modules
    [LMSModule.USER_MANAGEMENT]: UserCheck,
    [LMSModule.SYSTEM_ADMINISTRATION]: Shield,
    [LMSModule.API_ACCESS]: Settings
};

const moduleNames: Record<LMSModule, string> = {
    // Core Learning Modules
    [LMSModule.COURSE_MANAGEMENT]: 'Course Management',
    [LMSModule.STUDENT_ENROLLMENT]: 'Student Enrollment',
    [LMSModule.ASSIGNMENT_SYSTEM]: 'Assignment System',
    [LMSModule.DISCUSSION_FORUMS]: 'Discussion Forums',
    [LMSModule.GRADING_SYSTEM]: 'Grading System',

    // Advanced Modules
    [LMSModule.RUBRIC_BUILDER]: 'Rubric Builder',
    [LMSModule.AI_GRADING_ENGINE]: 'AI Grading Engine',
    [LMSModule.ANALYTICS_DASHBOARD]: 'Analytics Dashboard',
    [LMSModule.BULK_OPERATIONS]: 'Bulk Operations',

    // Student-Specific Modules
    [LMSModule.STUDENT_DASHBOARD]: 'Student Dashboard',
    [LMSModule.SUBMISSION_SYSTEM]: 'Submission System',
    [LMSModule.GRADE_VIEWER]: 'Grade Viewer',
    [LMSModule.DISCUSSION_PARTICIPATION]: 'Discussion Participation',

    // Administrative Modules
    [LMSModule.USER_MANAGEMENT]: 'User Management',
    [LMSModule.SYSTEM_ADMINISTRATION]: 'System Administration',
    [LMSModule.API_ACCESS]: 'API Access'
};

export function FeatureAccessStatus({
    userRole,
    subscriptionType = 'FREE',
    subscriptionExpiresAt,
    trialExpiresAt,
    currentUsage = {}
}: FeatureAccessStatusProps) {
    const moduleManager = createModuleManager({
        userId: 'temp-user-id', // This would normally come from the session
        role: userRole,
        subscriptionType,
        subscriptionExpiresAt: subscriptionExpiresAt || null,
        trialExpiresAt: trialExpiresAt || null
    });

    // Get access status for all modules
    const moduleStatuses: Array<{
        module: LMSModule;
        name: string;
        icon: any;
        hasAccess: boolean;
        currentUsage?: number;
    }> = Object.values(LMSModule).map(module => {
        const hasAccess = moduleManager.hasModuleAccess(module);

        return {
            module,
            name: moduleNames[module],
            icon: moduleIcons[module],
            hasAccess,
            currentUsage: currentUsage[module] || 0
        };
    });

    // Group modules by access level
    const accessibleModules = moduleStatuses.filter(m => m.hasAccess);
    const restrictedModules = moduleStatuses.filter(m => !m.hasAccess);

    // Calculate subscription utilization
    const totalModules = moduleStatuses.length;
    const accessibleCount = accessibleModules.length;
    const utilizationPercent = (accessibleCount / totalModules) * 100;

    return (
        <div className="space-y-6">
            {/* Subscription Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="size-5" />
                        Feature Access Overview
                    </CardTitle>
                    <CardDescription>
                        Current subscription: {subscriptionType || 'FREE_TRIAL'} | Role: {userRole}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="mb-2 flex justify-between text-sm">
                            <span>Module Access</span>
                            <span>{accessibleCount} of {totalModules} modules</span>
                        </div>
                        <Progress value={utilizationPercent} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-green-500"></div>
                            <span>{accessibleCount} Available Modules</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-gray-300"></div>
                            <span>{restrictedModules.length} Restricted Modules</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Available Modules */}
            {accessibleModules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Unlock className="size-5" />
                            Available Modules ({accessibleModules.length})
                        </CardTitle>
                        <CardDescription>
                            Modules you can access with your current subscription
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {accessibleModules.map(({ module, name, icon: Icon, currentUsage }) => (
                                <div key={module} className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                                    <div className="flex items-center gap-3">
                                        <Icon className="size-5 text-green-600" />
                                        <div>
                                            <h4 className="font-medium text-green-900">{name}</h4>
                                            <p className="text-xs text-green-700">
                                                {currentUsage || 0} usage
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="size-4 text-green-600" />
                                        <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700">
                                            Active
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Restricted Modules */}
            {restrictedModules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <Lock className="size-5" />
                            Restricted Modules ({restrictedModules.length})
                        </CardTitle>
                        <CardDescription>
                            Modules requiring subscription upgrade
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {restrictedModules.map(({ module, name, icon: Icon }) => (
                                <div key={module} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3">
                                    <div className="flex items-center gap-3">
                                        <Icon className="size-5 text-orange-600" />
                                        <div>
                                            <h4 className="font-medium text-orange-900">{name}</h4>
                                            <p className="text-xs text-orange-700">
                                                Requires Premium subscription
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <X className="size-4 text-orange-600" />
                                        <Badge variant="outline" className="border-orange-300 bg-orange-100 text-orange-700">
                                            Locked
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upgrade Prompt */}
            {restrictedModules.length > 0 && (
                <Alert>
                    <Crown className="size-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <div>
                            <strong>Unlock {restrictedModules.length} more modules</strong> with a subscription upgrade.
                            Get access to advanced features like AI grading, plagiarism detection, and advanced analytics.
                        </div>
                        <Button className="ml-4">
                            Upgrade Now
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Feature Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Comparison</CardTitle>
                    <CardDescription>
                        See what&apos;s included in each subscription tier
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 text-sm md:grid-cols-4">
                        <div className="space-y-2">
                            <h5 className="font-semibold">Free Trial</h5>
                            <p className="text-xs text-muted-foreground">Basic features only</p>
                            <ul className="space-y-1">
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>5 Students</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>2 Courses</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="size-3 text-red-600" />
                                    <span>No AI Features</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h5 className="font-semibold">Basic</h5>
                            <p className="text-xs text-muted-foreground">Essential teaching tools</p>
                            <ul className="space-y-1">
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>50 Students</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>10 Courses</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="size-3 text-red-600" />
                                    <span>Limited AI</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2 rounded-lg border-2 border-blue-200 bg-blue-50 p-2">
                            <h5 className="flex items-center gap-2 font-semibold">
                                Premium
                                <Badge className="bg-blue-600">Popular</Badge>
                            </h5>
                            <p className="text-xs text-muted-foreground">Full feature access</p>
                            <ul className="space-y-1">
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>Unlimited</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>AI Grading</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>Custom Rubrics</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h5 className="font-semibold">Enterprise</h5>
                            <p className="text-xs text-muted-foreground">Advanced features</p>
                            <ul className="space-y-1">
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>All Premium</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>Bulk Operations</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-3 text-green-600" />
                                    <span>Advanced Reports</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}