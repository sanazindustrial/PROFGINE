'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    BookOpen,
    Users,
    FileText,
    MessageCircle,
    BarChart3,
    Settings,
    Crown,
    Lock,
    GraduationCap,
    ClipboardCheck,
    Zap,
    Database
} from 'lucide-react';
import { LMSModule } from '@/lib/module-manager';

interface NavigationItem {
    module: LMSModule;
    name: string;
    route: string;
    accessible: boolean;
    requiresUpgrade?: boolean;
}

interface ModuleNavigationProps {
    navigationItems: NavigationItem[];
    userRole: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
    subscriptionType: string;
}

const getModuleIcon = (module: LMSModule) => {
    switch (module) {
        case LMSModule.COURSE_MANAGEMENT:
            return <BookOpen className="size-5" />;
        case LMSModule.STUDENT_ENROLLMENT:
            return <Users className="size-5" />;
        case LMSModule.ASSIGNMENT_SYSTEM:
            return <FileText className="size-5" />;
        case LMSModule.DISCUSSION_FORUMS:
            return <MessageCircle className="size-5" />;
        case LMSModule.GRADING_SYSTEM:
            return <ClipboardCheck className="size-5" />;
        case LMSModule.RUBRIC_BUILDER:
            return <Settings className="size-5" />;
        case LMSModule.AI_GRADING_ENGINE:
            return <Zap className="size-5" />;
        case LMSModule.ANALYTICS_DASHBOARD:
            return <BarChart3 className="size-5" />;
        case LMSModule.BULK_OPERATIONS:
            return <Database className="size-5" />;
        case LMSModule.STUDENT_DASHBOARD:
            return <GraduationCap className="size-5" />;
        case LMSModule.SUBMISSION_SYSTEM:
            return <FileText className="size-5" />;
        case LMSModule.GRADE_VIEWER:
            return <BarChart3 className="size-5" />;
        case LMSModule.DISCUSSION_PARTICIPATION:
            return <MessageCircle className="size-5" />;
        case LMSModule.USER_MANAGEMENT:
            return <Users className="size-5" />;
        case LMSModule.SYSTEM_ADMINISTRATION:
            return <Settings className="size-5" />;
        case LMSModule.API_ACCESS:
            return <Database className="size-5" />;
        default:
            return <Settings className="size-5" />;
    }
};

export default function ModuleNavigation({ navigationItems, userRole, subscriptionType }: ModuleNavigationProps) {
    const pathname = usePathname();
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    const accessibleItems = navigationItems.filter(item => item.accessible);
    const restrictedItems = navigationItems.filter(item => !item.accessible && item.requiresUpgrade);

    return (
        <div className="space-y-6">
            {/* Accessible Modules */}
            <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Available Modules</h2>
                <div className="grid gap-3">
                    {accessibleItems.map((item) => {
                        const isActive = pathname === item.route;
                        return (
                            <Link
                                key={item.module}
                                href={item.route}
                                className={`group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${isActive
                                    ? 'border-blue-200 bg-blue-50 text-blue-900'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                    {getModuleIcon(item.module)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                </div>
                                {isActive && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                        Active
                                    </Badge>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Restricted Modules */}
            {restrictedItems.length > 0 && (
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Upgrade Required</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUpgradePrompt(!showUpgradePrompt)}
                        >
                            <Crown className="mr-2 size-4" />
                            Upgrade Plan
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {restrictedItems.map((item) => (
                            <div
                                key={item.module}
                                className="group flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 opacity-75"
                            >
                                <div className="shrink-0 text-orange-500">
                                    <Lock className="size-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-orange-900">{item.name}</div>
                                    <div className="text-sm text-orange-700">Requires {subscriptionType === 'FREE_TRIAL' ? 'BASIC' : 'PREMIUM'} plan</div>
                                </div>
                                <Badge variant="outline" className="border-orange-300 text-orange-700">
                                    Locked
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upgrade Prompt */}
            {showUpgradePrompt && (
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="shrink-0">
                                <Crown className="size-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="mb-2 font-semibold text-blue-900">
                                    Unlock All {userRole === 'PROFESSOR' ? 'Teaching' : 'Learning'} Features
                                </h3>
                                <p className="mb-4 text-sm text-blue-700">
                                    Upgrade your subscription to access advanced modules like AI Grading,
                                    Analytics Dashboard, and Bulk Operations.
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                        View Plans
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowUpgradePrompt(false)}
                                    >
                                        Maybe Later
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Subscription Status */}
            <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current Plan:</span>
                    <Badge
                        className={
                            subscriptionType === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                                subscriptionType === 'PREMIUM' ? 'bg-blue-100 text-blue-800' :
                                    subscriptionType === 'BASIC' ? 'bg-green-100 text-green-800' :
                                        'bg-orange-100 text-orange-800'
                        }
                    >
                        {subscriptionType.replace('_', ' ')}
                    </Badge>
                </div>
            </div>
        </div>
    );
}