"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
    Crown,
    Lock,
    CheckCircle,
    ArrowRight,
    BookOpen,
    FileText,
    Users,
    Zap,
    MessageCircle,
    BarChart3,
    Settings,
    Star,
    Shield
} from 'lucide-react';

interface FeatureCardProps {
    feature: {
        id: string;
        name: string;
        description: string;
        icon: any;
        available: boolean;
        tier: 'FREE_TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
        currentUsage?: number;
        limit?: number;
        upgradeRequired?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
    };
    currentTier: string;
    onUpgrade: (targetTier: string) => void;
}

function FeatureCard({ feature, currentTier, onUpgrade }: FeatureCardProps) {
    const Icon = feature.icon;
    const isUnlimited = feature.limit === -1;
    const usagePercentage = feature.limit && feature.limit > 0 && feature.currentUsage
        ? (feature.currentUsage / feature.limit) * 100
        : 0;

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'FREE_TRIAL': return 'text-gray-600 bg-gray-100';
            case 'BASIC': return 'text-blue-600 bg-blue-100';
            case 'PREMIUM': return 'text-purple-600 bg-purple-100';
            case 'ENTERPRISE': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <Card className={`relative transition-all duration-200 ${feature.available
            ? 'border-green-200 bg-green-50/30'
            : 'border-gray-200 bg-gray-50/30'
            }`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${feature.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <Icon className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{feature.name}</CardTitle>
                            <CardDescription className="text-sm">{feature.description}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {feature.available ? (
                            <CheckCircle className="size-5 text-green-500" />
                        ) : (
                            <Lock className="size-5 text-gray-400" />
                        )}
                        <Badge
                            variant="secondary"
                            className={`text-xs ${getTierColor(feature.tier)}`}
                        >
                            {feature.tier === 'FREE_TRIAL' ? 'Trial' : feature.tier}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            {feature.available && (feature.currentUsage !== undefined || feature.limit !== undefined) && (
                <CardContent className="pt-0">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Usage</span>
                            <span className="font-medium">
                                {feature.currentUsage || 0}
                                {!isUnlimited && feature.limit ? ` / ${feature.limit}` : ' (Unlimited)'}
                            </span>
                        </div>
                        {!isUnlimited && feature.limit && (
                            <Progress
                                value={usagePercentage}
                                className={usagePercentage >= 80 ? 'text-yellow-500' : 'text-green-500'}
                            />
                        )}
                        {usagePercentage >= 80 && !isUnlimited && (
                            <p className="text-xs text-yellow-600">
                                ⚠️ Approaching limit
                            </p>
                        )}
                    </div>
                </CardContent>
            )}

            {!feature.available && feature.upgradeRequired && (
                <CardContent className="pt-0">
                    <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                            Requires {feature.upgradeRequired} plan or higher
                        </div>
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onUpgrade(feature.upgradeRequired!)}
                        >
                            <Star className="mr-2 size-4" />
                            Upgrade to {feature.upgradeRequired}
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

interface SubscriptionFeaturesOverviewProps {
    billingContext: {
        tier: string;
        ownerType: 'USER' | 'ORG';
        ownerId: string;
        status: string;
    };
    usage: {
        students: number;
        courses: number;
        assignments: number;
        aiGrades: number;
        plagiarismScans: number;
    };
}

export default function SubscriptionFeaturesOverview({
    billingContext,
    usage
}: SubscriptionFeaturesOverviewProps) {
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Define feature limits per tier
    const tierLimits = {
        FREE_TRIAL: {
            courses: 2,
            students: 10,
            assignments: 5,
            aiGrades: 10,
            discussions: 3,
            analytics: 0,
            bulkOps: 0,
            api: 0,
        },
        BASIC: {
            courses: 10,
            students: 50,
            assignments: 25,
            aiGrades: 100,
            discussions: 15,
            analytics: 5,
            bulkOps: 0,
            api: 0,
        },
        PREMIUM: {
            courses: -1,
            students: -1,
            assignments: -1,
            aiGrades: 500,
            discussions: -1,
            analytics: -1,
            bulkOps: 50,
            api: 0,
        },
        ENTERPRISE: {
            courses: -1,
            students: -1,
            assignments: -1,
            aiGrades: -1,
            discussions: -1,
            analytics: -1,
            bulkOps: -1,
            api: -1,
        }
    };

    const currentLimits = tierLimits[billingContext.tier as keyof typeof tierLimits];

    // Define all features with their availability
    const features = [
        {
            id: 'courses',
            name: 'Course Creation',
            description: 'Create and manage courses',
            icon: BookOpen,
            available: billingContext.tier !== 'FREE_TRIAL' || usage.courses < 2,
            tier: 'FREE_TRIAL' as const,
            currentUsage: usage.courses,
            limit: currentLimits?.courses,
            category: 'core',
        },
        {
            id: 'students',
            name: 'Student Management',
            description: 'Add and manage students',
            icon: Users,
            available: billingContext.tier !== 'FREE_TRIAL' || usage.students < 10,
            tier: 'FREE_TRIAL' as const,
            currentUsage: usage.students,
            limit: currentLimits?.students,
            category: 'core',
        },
        {
            id: 'assignments',
            name: 'Assignments',
            description: 'Create assignments and collect submissions',
            icon: FileText,
            available: billingContext.tier !== 'FREE_TRIAL' || usage.assignments < 5,
            tier: 'FREE_TRIAL' as const,
            currentUsage: usage.assignments,
            limit: currentLimits?.assignments,
            category: 'core',
        },
        {
            id: 'ai_grading',
            name: 'AI-Powered Grading',
            description: 'Automated grading with AI assistance',
            icon: Zap,
            available: true, // Available in all tiers with limits
            tier: 'FREE_TRIAL' as const,
            currentUsage: usage.aiGrades,
            limit: currentLimits?.aiGrades,
            category: 'ai',
        },
        {
            id: 'discussions',
            name: 'Discussion Forums',
            description: 'Create and moderate discussion threads',
            icon: MessageCircle,
            available: billingContext.tier !== 'FREE_TRIAL' || usage.assignments < 3,
            tier: 'FREE_TRIAL' as const,
            currentUsage: 0, // TODO: Add discussion usage tracking
            limit: currentLimits?.discussions,
            category: 'engagement',
        },
        {
            id: 'analytics',
            name: 'Advanced Analytics',
            description: 'Detailed performance insights and reports',
            icon: BarChart3,
            available: billingContext.tier === 'BASIC' || billingContext.tier === 'PREMIUM' || billingContext.tier === 'ENTERPRISE',
            tier: 'BASIC' as const,
            upgradeRequired: 'BASIC' as const,
            category: 'analytics',
        },
        {
            id: 'bulk_operations',
            name: 'Bulk Operations',
            description: 'Perform operations on multiple items at once',
            icon: Zap,
            available: billingContext.tier === 'PREMIUM' || billingContext.tier === 'ENTERPRISE',
            tier: 'PREMIUM' as const,
            upgradeRequired: 'PREMIUM' as const,
            category: 'productivity',
        },
        {
            id: 'api_access',
            name: 'API Access',
            description: 'Programmatic access to platform features',
            icon: Settings,
            available: billingContext.tier === 'ENTERPRISE',
            tier: 'ENTERPRISE' as const,
            upgradeRequired: 'ENTERPRISE' as const,
            category: 'integration',
        },
    ];

    const handleUpgrade = (targetTier: string) => {
        window.location.href = '/dashboard/billing';
    };

    const categories = [
        { id: 'all', name: 'All Features', count: features.length },
        { id: 'core', name: 'Core', count: features.filter(f => f.category === 'core').length },
        { id: 'ai', name: 'AI Features', count: features.filter(f => f.category === 'ai').length },
        { id: 'analytics', name: 'Analytics', count: features.filter(f => f.category === 'analytics').length },
        { id: 'productivity', name: 'Productivity', count: features.filter(f => f.category === 'productivity').length },
    ];

    const filteredFeatures = selectedCategory === 'all'
        ? features
        : features.filter(f => f.category === selectedCategory);

    const availableCount = filteredFeatures.filter(f => f.available).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Feature Overview</h2>
                    <p className="text-muted-foreground">
                        Current plan: <Badge className="ml-1">{billingContext.tier}</Badge>
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/billing">
                        <Crown className="mr-2 size-4" />
                        Manage Billing
                    </Link>
                </Button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="text-sm"
                    >
                        {category.name} ({category.count})
                    </Button>
                ))}
            </div>

            {/* Summary Stats */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                            <div className="text-sm text-muted-foreground">Available Features</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                                {filteredFeatures.length - availableCount}
                            </div>
                            <div className="text-sm text-muted-foreground">Locked Features</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.round((availableCount / filteredFeatures.length) * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Feature Utilization</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFeatures.map((feature) => (
                    <FeatureCard
                        key={feature.id}
                        feature={feature}
                        currentTier={billingContext.tier}
                        onUpgrade={handleUpgrade}
                    />
                ))}
            </div>

            {/* Upgrade Suggestion */}
            {billingContext.tier === 'FREE_TRIAL' && (
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <Star className="size-5" />
                            Unlock More Features
                        </CardTitle>
                        <CardDescription>
                            Upgrade your plan to access advanced features and remove usage limits
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/billing">
                                    <Crown className="mr-2 size-4" />
                                    View Plans
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/dashboard/billing">
                                    Upgrade to Basic
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/profile">
                                    View Usage
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}