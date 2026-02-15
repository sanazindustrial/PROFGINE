import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/prisma/client'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
    Settings,
    Users,
    Zap,
    Database,
    Shield,
    BarChart3,
    Bell,
    Key,
    Globe,
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react'

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect('/auth/signin')
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== UserRole.ADMIN) {
        redirect('/dashboard')
    }

    // Get system statistics
    const [totalUsers, totalCourses, totalAssignments] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.assignment.count()
    ])

    const adminFeatures = [
        {
            title: "AI Management",
            description: "Configure AI providers and enable Claude Haiku 4.5",
            icon: Zap,
            href: "/dashboard/settings/ai",
            badge: "Critical",
            badgeColor: "bg-red-500"
        },
        {
            title: "User Management",
            description: "Manage users, roles, and permissions",
            icon: Users,
            href: "/user-management",
            badge: "Essential"
        },
        {
            title: "Subscription Management",
            description: "View billing, manage plans, and track revenue",
            icon: BarChart3,
            href: "/subscription-management",
            badge: "Financial"
        },
        {
            title: "Invite Users",
            description: "Send invitations and manage pending signups",
            icon: Bell,
            href: "/invite-user",
            badge: "Active"
        },
        {
            title: "Database Health",
            description: "Test database connection and verify data integrity",
            icon: Database,
            href: "/admin/database-health",
            badge: "System"
        },
        {
            title: "Security & Compliance",
            description: "View security policies and compliance settings",
            icon: Shield,
            href: "/admin/security",
            badge: "Security"
        },
        {
            title: "Environment Check",
            description: "Verify all environment variables and API keys",
            icon: Key,
            href: "/admin/environment",
            badge: "Setup"
        },
        {
            title: "API Configuration",
            description: "Configure third-party API integrations",
            icon: Globe,
            href: "/admin/api-config",
            badge: "Integration"
        }
    ]

    return (
        <div className="container mx-auto space-y-8 py-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">⚙️ Admin Settings & Features</h1>
                <p className="mt-2 text-muted-foreground">Manage platform configuration, users, and system settings</p>
            </div>

            {/* System Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{totalUsers}</div>
                            <p className="mt-2 text-sm text-muted-foreground">Total Users</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{totalCourses}</div>
                            <p className="mt-2 text-sm text-muted-foreground">Active Courses</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">{totalAssignments}</div>
                            <p className="mt-2 text-sm text-muted-foreground">Total Assignments</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center">
                                <CheckCircle className="size-8 text-green-600" />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">System Healthy</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Critical Alert */}
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="size-5" />
                        🔴 Critical: Enable Claude Haiku 4.5
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm">Claude Haiku 4.5 is currently <strong>DISABLED</strong>. Enable it from AI Management to provide the best experience for all users.</p>
                    <Link href="/dashboard/settings/ai">
                        <Button className="bg-red-600 hover:bg-red-700">
                            <Zap className="mr-2 size-4" />
                            Go to AI Management
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Admin Features Grid */}
            <div>
                <h2 className="mb-4 text-2xl font-bold">Admin Features</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {adminFeatures.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <Link key={feature.title} href={feature.href}>
                                <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-lg">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-1 items-center gap-3">
                                                <div className="rounded-lg bg-primary/10 p-2">
                                                    <Icon className="size-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-base">{feature.title}</CardTitle>
                                                </div>
                                            </div>
                                            {feature.badge && (
                                                <Badge className={`${feature.badgeColor || 'bg-blue-500'} ml-2`}>
                                                    {feature.badge}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                        <Button variant="ghost" size="sm" className="mt-3 w-full">
                                            Open →
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="size-5" />
                        Quick Links
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <Link href="/admin/dashboard">
                            <Button variant="outline" className="w-full justify-start">
                                Admin Dashboard
                            </Button>
                        </Link>
                        <Link href="/user-management">
                            <Button variant="outline" className="w-full justify-start">
                                User Management
                            </Button>
                        </Link>
                        <Link href="/dashboard/settings/ai">
                            <Button variant="outline" className="w-full justify-start">
                                AI Provider Settings
                            </Button>
                        </Link>
                        <Link href="/subscription-management">
                            <Button variant="outline" className="w-full justify-start">
                                Subscriptions
                            </Button>
                        </Link>
                        <Link href="/invite-user">
                            <Button variant="outline" className="w-full justify-start">
                                Invite Users
                            </Button>
                        </Link>
                        <Link href="/profile">
                            <Button variant="outline" className="w-full justify-start">
                                My Profile
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" className="w-full justify-start">
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* System Information */}
            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                    <CardDescription>Platform and environment details</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Platform Version</p>
                            <p className="text-sm text-muted-foreground">Next.js 16.1.1 + Prisma ORM</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Database</p>
                            <p className="text-sm text-muted-foreground">PostgreSQL (Neon)</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Authentication</p>
                            <p className="text-sm text-muted-foreground">NextAuth.js with Google OAuth</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">AI Providers</p>
                            <p className="text-sm text-muted-foreground">Claude, GPT, Gemini, and more</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}