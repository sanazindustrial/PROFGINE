"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Shield,
    User,
    GraduationCap,
    Crown,
    Eye,
    EyeOff,
    Check,
    X,
    AlertTriangle,
    Settings,
    Users,
    CreditCard,
    BarChart3,
    MessageSquare,
    FileText,
    BookOpen,
    Zap,
    Lock,
    Unlock,
    RefreshCw,
    Activity,
} from 'lucide-react'

// Types
type UserRole = 'OWNER' | 'ADMIN' | 'PROFESSOR' | 'STUDENT'

interface RolePermission {
    id: string
    name: string
    description: string
    category: 'platform' | 'grading' | 'content' | 'billing' | 'analytics' | 'users'
    roles: UserRole[]
}

interface FeatureAccess {
    id: string
    name: string
    description: string
    icon: React.ElementType
    tier: 'free' | 'basic' | 'premium' | 'enterprise'
    roles: UserRole[]
}

interface RoleSwitcherProps {
    currentUserRole: UserRole
    currentUserEmail: string
    isOwner: boolean
    onRoleSwitch?: (role: UserRole) => Promise<void>
}

// Role configuration
const ROLE_CONFIG: Record<UserRole, {
    label: string
    description: string
    color: string
    bgColor: string
    icon: React.ElementType
    level: number
}> = {
    OWNER: {
        label: 'Platform Owner',
        description: 'Full platform access with billing, user management, and all administrative functions',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        icon: Crown,
        level: 4,
    },
    ADMIN: {
        label: 'Administrator',
        description: 'Administrative access to user management, content moderation, and platform settings',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        icon: Shield,
        level: 3,
    },
    PROFESSOR: {
        label: 'Professor',
        description: 'Course management, grading, student oversight, and academic content creation',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        icon: GraduationCap,
        level: 2,
    },
    STUDENT: {
        label: 'Student',
        description: 'Course enrollment, assignment submission, and learning activities',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: User,
        level: 1,
    },
}

// Comprehensive permission matrix
const PERMISSIONS: RolePermission[] = [
    // Platform permissions
    { id: 'platform_settings', name: 'Platform Settings', description: 'Configure global platform settings', category: 'platform', roles: ['OWNER'] },
    { id: 'view_all_users', name: 'View All Users', description: 'Access to view all platform users', category: 'platform', roles: ['OWNER', 'ADMIN'] },
    { id: 'manage_roles', name: 'Manage User Roles', description: 'Assign and modify user roles', category: 'platform', roles: ['OWNER', 'ADMIN'] },
    { id: 'session_management', name: 'Session Management', description: 'View and terminate user sessions', category: 'platform', roles: ['OWNER', 'ADMIN'] },
    { id: 'api_access', name: 'API Access', description: 'Access to platform APIs', category: 'platform', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },

    // Billing permissions
    { id: 'view_billing', name: 'View Billing', description: 'Access billing dashboard and invoices', category: 'billing', roles: ['OWNER'] },
    { id: 'manage_subscriptions', name: 'Manage Subscriptions', description: 'Modify subscription plans and payments', category: 'billing', roles: ['OWNER'] },
    { id: 'cost_control', name: 'Cost Control', description: 'Set spending limits and budgets', category: 'billing', roles: ['OWNER'] },
    { id: 'credit_management', name: 'Credit Management', description: 'Allocate and manage credits', category: 'billing', roles: ['OWNER', 'ADMIN'] },
    { id: 'view_own_billing', name: 'View Own Billing', description: 'View personal billing information', category: 'billing', roles: ['OWNER', 'ADMIN', 'PROFESSOR', 'STUDENT'] },

    // User management permissions
    { id: 'create_users', name: 'Create Users', description: 'Create new user accounts', category: 'users', roles: ['OWNER', 'ADMIN'] },
    { id: 'delete_users', name: 'Delete Users', description: 'Remove user accounts', category: 'users', roles: ['OWNER'] },
    { id: 'suspend_users', name: 'Suspend Users', description: 'Temporarily disable user accounts', category: 'users', roles: ['OWNER', 'ADMIN'] },
    { id: 'impersonate_users', name: 'Impersonate Users', description: 'View platform as another user', category: 'users', roles: ['OWNER'] },
    { id: 'manage_students', name: 'Manage Students', description: 'Manage enrolled students', category: 'users', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },

    // Grading permissions
    { id: 'grade_assignments', name: 'Grade Assignments', description: 'Evaluate and score student work', category: 'grading', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'override_grades', name: 'Override Grades', description: 'Modify finalized grades', category: 'grading', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'view_all_grades', name: 'View All Grades', description: 'Access grades across all courses', category: 'grading', roles: ['OWNER', 'ADMIN'] },
    { id: 'ai_grading', name: 'AI-Assisted Grading', description: 'Use AI for grading assistance', category: 'grading', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'consensus_review', name: 'Consensus Review', description: 'Participate in multi-reviewer grading', category: 'grading', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'submit_assignments', name: 'Submit Assignments', description: 'Submit work for grading', category: 'grading', roles: ['STUDENT'] },
    { id: 'view_own_grades', name: 'View Own Grades', description: 'View personal grades and feedback', category: 'grading', roles: ['STUDENT'] },

    // Content permissions
    { id: 'create_courses', name: 'Create Courses', description: 'Create new courses', category: 'content', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'delete_courses', name: 'Delete Courses', description: 'Remove courses from platform', category: 'content', roles: ['OWNER', 'ADMIN'] },
    { id: 'create_assignments', name: 'Create Assignments', description: 'Create course assignments', category: 'content', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'manage_rubrics', name: 'Manage Rubrics', description: 'Create and edit grading rubrics', category: 'content', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'discussion_moderation', name: 'Discussion Moderation', description: 'Moderate discussion forums', category: 'content', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'enroll_courses', name: 'Enroll in Courses', description: 'Join available courses', category: 'content', roles: ['STUDENT'] },

    // Analytics permissions
    { id: 'platform_analytics', name: 'Platform Analytics', description: 'View platform-wide statistics', category: 'analytics', roles: ['OWNER', 'ADMIN'] },
    { id: 'user_analytics', name: 'User Analytics', description: 'View user activity reports', category: 'analytics', roles: ['OWNER', 'ADMIN'] },
    { id: 'course_analytics', name: 'Course Analytics', description: 'View course performance data', category: 'analytics', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'fairness_dashboard', name: 'Fairness Dashboard', description: 'Access grading fairness metrics', category: 'analytics', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'personal_analytics', name: 'Personal Analytics', description: 'View own performance data', category: 'analytics', roles: ['OWNER', 'ADMIN', 'PROFESSOR', 'STUDENT'] },
]

// Feature access matrix
const FEATURES: FeatureAccess[] = [
    { id: 'ai_discussion', name: 'AI Discussion Responses', description: 'Generate AI-powered discussion posts', icon: MessageSquare, tier: 'basic', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'ai_grading', name: 'AI Grading Assistant', description: 'AI-assisted assignment grading', icon: FileText, tier: 'premium', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'sandwich_feedback', name: 'Sandwich Feedback Coach', description: 'Structured positive-constructive-motivational feedback', icon: BookOpen, tier: 'premium', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'consensus_grading', name: 'Consensus Grading', description: 'Multi-reviewer grading with IRR', icon: Users, tier: 'enterprise', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'intervention_hub', name: 'Intervention Hub', description: 'Student support and risk monitoring', icon: Activity, tier: 'enterprise', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'fairness_metrics', name: 'Fairness Metrics', description: 'Bias detection and equity dashboards', icon: BarChart3, tier: 'premium', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'bulk_operations', name: 'Bulk Operations', description: 'Bulk grading and enrollment', icon: Zap, tier: 'premium', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'api_access', name: 'API Access', description: 'REST API for integrations', icon: Settings, tier: 'enterprise', roles: ['OWNER', 'ADMIN'] },
    { id: 'unlimited_courses', name: 'Unlimited Courses', description: 'No limit on course creation', icon: BookOpen, tier: 'premium', roles: ['OWNER', 'ADMIN', 'PROFESSOR'] },
    { id: 'priority_support', name: 'Priority Support', description: '24/7 priority customer support', icon: Shield, tier: 'enterprise', roles: ['OWNER', 'ADMIN'] },
]

// Category icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    platform: Settings,
    billing: CreditCard,
    users: Users,
    grading: FileText,
    content: BookOpen,
    analytics: BarChart3,
}

export function RoleSwitcher({
    currentUserRole,
    currentUserEmail,
    isOwner,
    onRoleSwitch,
}: RoleSwitcherProps) {
    const [viewAsRole, setViewAsRole] = useState<UserRole>(currentUserRole)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [showSwitchDialog, setShowSwitchDialog] = useState(false)
    const [pendingRole, setPendingRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'permissions' | 'features' | 'comparison'>('permissions')

    // Only owners and admins can switch roles for preview
    const canSwitchRoles = isOwner || currentUserRole === 'ADMIN'

    // Get available roles for preview (can only view lower or equal level roles)
    const availableRoles = Object.entries(ROLE_CONFIG)
        .filter(([role]) => {
            if (isOwner) return true // Owners can view all roles
            if (currentUserRole === 'ADMIN') return role !== 'OWNER' // Admins can't view owner role
            return role === currentUserRole // Others can only view their own role
        })
        .map(([role]) => role as UserRole)

    // Handle role preview
    const handleRolePreview = (role: UserRole) => {
        setViewAsRole(role)
        setIsPreviewMode(role !== currentUserRole)
    }

    // Handle actual role switch (for testing)
    const handleRoleSwitch = async () => {
        if (!pendingRole || !onRoleSwitch) return

        setIsLoading(true)
        try {
            await onRoleSwitch(pendingRole)
            setShowSwitchDialog(false)
            setPendingRole(null)
        } catch (error) {
            console.error('Failed to switch role:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Get permissions for current view role
    const rolePermissions = PERMISSIONS.filter(p => p.roles.includes(viewAsRole))
    const roleFeatures = FEATURES.filter(f => f.roles.includes(viewAsRole))

    // Group permissions by category
    const permissionsByCategory = rolePermissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = []
        acc[perm.category].push(perm)
        return acc
    }, {} as Record<string, RolePermission[]>)

    const currentRoleConfig = ROLE_CONFIG[viewAsRole]
    const RoleIcon = currentRoleConfig.icon

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header with role selector */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${currentRoleConfig.bgColor}`}>
                                    <RoleIcon className={`size-6 ${currentRoleConfig.color}`} />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        Role & Permission Viewer
                                        {isPreviewMode && (
                                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                                                <Eye className="size-3 mr-1" />
                                                Preview Mode
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {isOwner ? 'As platform owner, you can preview all role permissions' :
                                            currentUserRole === 'ADMIN' ? 'Preview permissions for different roles' :
                                                'View your current permissions and features'}
                                    </CardDescription>
                                </div>
                            </div>

                            {canSwitchRoles && (
                                <div className="flex items-center gap-3">
                                    <Select value={viewAsRole} onValueChange={(v) => handleRolePreview(v as UserRole)}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="View as role..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map((role) => {
                                                const config = ROLE_CONFIG[role]
                                                const Icon = config.icon
                                                return (
                                                    <SelectItem key={role} value={role}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={`size-4 ${config.color}`} />
                                                            {config.label}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>

                                    {isPreviewMode && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRolePreview(currentUserRole)}
                                        >
                                            <RefreshCw className="size-4 mr-1" />
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Current role info */}
                        <div className={`p-4 rounded-lg ${currentRoleConfig.bgColor} mb-4`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`font-semibold ${currentRoleConfig.color}`}>
                                        {isPreviewMode ? `Previewing: ${currentRoleConfig.label}` : `Your Role: ${currentRoleConfig.label}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {currentRoleConfig.description}
                                    </p>
                                </div>
                                <Badge className={currentRoleConfig.bgColor + ' ' + currentRoleConfig.color} variant="outline">
                                    Level {currentRoleConfig.level}
                                </Badge>
                            </div>
                        </div>

                        {/* Preview mode warning */}
                        {isPreviewMode && (
                            <Alert className="mb-4 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
                                <Eye className="size-4 text-orange-600" />
                                <AlertDescription className="text-orange-700 dark:text-orange-400">
                                    You are previewing the <strong>{currentRoleConfig.label}</strong> role.
                                    This shows what permissions and features this role would have access to.
                                    Your actual permissions remain unchanged.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Stats summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-2xl font-bold">{rolePermissions.length}</p>
                                <p className="text-xs text-muted-foreground">Permissions</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-2xl font-bold">{roleFeatures.length}</p>
                                <p className="text-xs text-muted-foreground">Features</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-2xl font-bold">{Object.keys(permissionsByCategory).length}</p>
                                <p className="text-xs text-muted-foreground">Categories</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-2xl font-bold">{currentRoleConfig.level}</p>
                                <p className="text-xs text-muted-foreground">Access Level</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for different views */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="comparison">Role Comparison</TabsTrigger>
                    </TabsList>

                    {/* Permissions Tab */}
                    <TabsContent value="permissions" className="space-y-4">
                        {Object.entries(permissionsByCategory).map(([category, perms]) => {
                            const CategoryIcon = CATEGORY_ICONS[category] || Settings
                            return (
                                <Card key={category}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <CategoryIcon className="size-5" />
                                            {category.charAt(0).toUpperCase() + category.slice(1)} Permissions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {perms.map((perm) => (
                                                <div
                                                    key={perm.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                                                            <Check className="size-4 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{perm.name}</p>
                                                            <p className="text-sm text-muted-foreground">{perm.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {perm.roles.map((role) => {
                                                            const config = ROLE_CONFIG[role]
                                                            const Icon = config.icon
                                                            return (
                                                                <Tooltip key={role}>
                                                                    <TooltipTrigger>
                                                                        <div className={`p-1 rounded ${config.bgColor}`}>
                                                                            <Icon className={`size-3 ${config.color}`} />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{config.label}</TooltipContent>
                                                                </Tooltip>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {/* Denied permissions */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                                    <Lock className="size-5" />
                                    Restricted Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {PERMISSIONS.filter(p => !p.roles.includes(viewAsRole)).slice(0, 5).map((perm) => (
                                        <div
                                            key={perm.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 opacity-60"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                                                    <X className="size-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{perm.name}</p>
                                                    <p className="text-sm text-muted-foreground">{perm.description}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-red-600 border-red-300">
                                                <Lock className="size-3 mr-1" />
                                                Restricted
                                            </Badge>
                                        </div>
                                    ))}
                                    {PERMISSIONS.filter(p => !p.roles.includes(viewAsRole)).length > 5 && (
                                        <p className="text-sm text-muted-foreground text-center pt-2">
                                            +{PERMISSIONS.filter(p => !p.roles.includes(viewAsRole)).length - 5} more restricted permissions
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Features Tab */}
                    <TabsContent value="features" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {FEATURES.map((feature) => {
                                const hasAccess = feature.roles.includes(viewAsRole)
                                const Icon = feature.icon

                                return (
                                    <Card key={feature.id} className={!hasAccess ? 'opacity-60' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${hasAccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                    <Icon className={`size-6 ${hasAccess ? 'text-green-600' : 'text-gray-400'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold">{feature.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="capitalize">
                                                                {feature.tier}
                                                            </Badge>
                                                            {hasAccess ? (
                                                                <Badge className="bg-green-100 text-green-700">
                                                                    <Unlock className="size-3 mr-1" />
                                                                    Available
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-gray-500">
                                                                    <Lock className="size-3 mr-1" />
                                                                    Locked
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {feature.description}
                                                    </p>
                                                    <div className="flex gap-1 mt-2">
                                                        {feature.roles.map((role) => {
                                                            const config = ROLE_CONFIG[role]
                                                            const RIcon = config.icon
                                                            return (
                                                                <Tooltip key={role}>
                                                                    <TooltipTrigger>
                                                                        <div className={`p-1 rounded ${config.bgColor}`}>
                                                                            <RIcon className={`size-3 ${config.color}`} />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{config.label}</TooltipContent>
                                                                </Tooltip>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </TabsContent>

                    {/* Comparison Tab */}
                    <TabsContent value="comparison" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Role Comparison Matrix</CardTitle>
                                <CardDescription>
                                    Compare permissions across all roles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="w-full">
                                    <div className="min-w-[600px]">
                                        {/* Header row */}
                                        <div className="grid grid-cols-5 gap-2 p-2 bg-muted rounded-t-lg font-semibold">
                                            <div>Permission</div>
                                            {(['OWNER', 'ADMIN', 'PROFESSOR', 'STUDENT'] as UserRole[]).map((role) => {
                                                const config = ROLE_CONFIG[role]
                                                const Icon = config.icon
                                                return (
                                                    <div key={role} className="flex items-center justify-center gap-1">
                                                        <Icon className={`size-4 ${config.color}`} />
                                                        <span className="text-sm">{role}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Permission rows */}
                                        {PERMISSIONS.map((perm, idx) => (
                                            <div
                                                key={perm.id}
                                                className={`grid grid-cols-5 gap-2 p-2 ${idx % 2 === 0 ? 'bg-muted/30' : ''}`}
                                            >
                                                <div className="text-sm">
                                                    <span className="font-medium">{perm.name}</span>
                                                </div>
                                                {(['OWNER', 'ADMIN', 'PROFESSOR', 'STUDENT'] as UserRole[]).map((role) => (
                                                    <div key={role} className="flex justify-center">
                                                        {perm.roles.includes(role) ? (
                                                            <Check className="size-5 text-green-600" />
                                                        ) : (
                                                            <X className="size-5 text-red-400" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Role switch dialog (for owners only) */}
                <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="size-5 text-amber-500" />
                                Switch Role for Testing
                            </DialogTitle>
                            <DialogDescription>
                                This will temporarily change your effective role for testing purposes.
                                Use this to verify that role restrictions are working correctly.
                            </DialogDescription>
                        </DialogHeader>

                        {pendingRole && (
                            <div className={`p-4 rounded-lg ${ROLE_CONFIG[pendingRole].bgColor}`}>
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const Icon = ROLE_CONFIG[pendingRole].icon
                                        return <Icon className={`size-6 ${ROLE_CONFIG[pendingRole].color}`} />
                                    })()}
                                    <div>
                                        <p className="font-semibold">{ROLE_CONFIG[pendingRole].label}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {ROLE_CONFIG[pendingRole].description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSwitchDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleRoleSwitch} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="size-4 mr-2 animate-spin" />
                                        Switching...
                                    </>
                                ) : (
                                    'Switch Role'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

export default RoleSwitcher
