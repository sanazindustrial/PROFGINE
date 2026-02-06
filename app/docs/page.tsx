"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { FeatureLayout } from "@/components/feature-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    BookOpen,
    FileText,
    Zap,
    Users,
    Settings,
    Crown,
    ArrowRight,
    ExternalLink,
    Download,
    Code,
    Lightbulb,
    Shield
} from "lucide-react"

export default function DocsPage() {
    const { data: session } = useSession()

    const docSections = [
        {
            title: "Getting Started",
            description: "Quick start guide and basic setup",
            icon: <Zap className="size-5 text-blue-600" />,
            items: [
                { title: "Platform Overview", href: "/help#overview" },
                { title: "Account Setup", href: "/help#profile" },
                { title: "First Course Creation", href: "/help#courses" },
                { title: "Understanding Roles", href: "/help#roles" }
            ]
        },
        {
            title: "Core Features",
            description: "Detailed feature documentation",
            icon: <BookOpen className="size-5 text-green-600" />,
            items: [
                { title: "Course Management", href: "/help#courses" },
                { title: "Student Enrollment", href: "/help#students" },
                { title: "Assignment Creation", href: "/help#assignments" },
                { title: "Discussion Management", href: "/help#discussions" }
            ]
        },
        {
            title: "AI Features",
            description: "AI-powered teaching assistance",
            icon: <Lightbulb className="size-5 text-purple-600" />,
            items: [
                { title: "Discussion Response Generation", href: "/help#ai-responses" },
                { title: "Automated Grading", href: "/help#ai-grading" },
                { title: "Custom Prompts", href: "/help#prompts" },
                { title: "AI Provider Configuration", href: "/help#ai-config" }
            ]
        },
        {
            title: "Administration",
            description: "Admin and management features",
            icon: <Shield className="size-5 text-orange-600" />,
            items: [
                { title: "User Management", href: "/help#user-management" },
                { title: "Subscription Control", href: "/help#subscriptions" },
                { title: "Institution Setup", href: "/help#institution" },
                { title: "System Configuration", href: "/help#system-config" }
            ]
        }
    ]

    const apiDocs = [
        {
            endpoint: "/api/profile",
            method: "GET/PUT",
            description: "User profile management"
        },
        {
            endpoint: "/api/courses",
            method: "GET/POST",
            description: "Course CRUD operations"
        },
        {
            endpoint: "/api/auth/dev-login",
            method: "POST",
            description: "Development authentication"
        },
        {
            endpoint: "/api/chat",
            method: "POST",
            description: "AI chat and response generation"
        }
    ]

    const quickLinks = [
        {
            title: "Help Center",
            description: "Complete user guide and FAQ",
            href: "/help",
            icon: <BookOpen className="size-4" />
        },
        {
            title: "Profile Settings",
            description: "Manage your account settings",
            href: "/profile",
            icon: <Users className="size-4" />
        },
        {
            title: "Dashboard",
            description: "Your main dashboard",
            href: "/dashboard",
            icon: <Settings className="size-4" />
        }
    ]

    return (
        <FeatureLayout
            title="Documentation"
            description="Complete documentation for ProfGenie platform"
        >
            <div className="space-y-8">
                {/* Quick Links */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Navigation</CardTitle>
                        <CardDescription>
                            Jump to common sections and features
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {quickLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                >
                                    <div className="shrink-0">
                                        {link.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{link.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {link.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="ml-auto size-4 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Documentation Sections */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {docSections.map((section, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {section.icon}
                                    {section.title}
                                </CardTitle>
                                <CardDescription>
                                    {section.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {section.items.map((item, itemIndex) => (
                                        <Link
                                            key={itemIndex}
                                            href={item.href}
                                            className="flex items-center justify-between rounded p-2 transition-colors hover:bg-muted/50"
                                        >
                                            <span className="text-sm">{item.title}</span>
                                            <ExternalLink className="size-3" />
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* User Role Specific Documentation */}
                <Card>
                    <CardHeader>
                        <CardTitle>Role-Specific Features</CardTitle>
                        <CardDescription>
                            Documentation tailored to your role: {session?.user?.role || 'Guest'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {session?.user?.role === 'ADMIN' && (
                            <div className="space-y-4">
                                <div className="border-l-4 border-orange-500 pl-4">
                                    <h3 className="mb-2 font-semibold text-orange-900">Administrator Documentation</h3>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        As an administrator, you have access to advanced features for managing users, subscriptions, and system configuration.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/user-management">User Management</Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/ai-management">AI Configuration</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {session?.user?.role === 'PROFESSOR' && (
                            <div className="space-y-4">
                                <div className="border-l-4 border-green-500 pl-4">
                                    <h3 className="mb-2 font-semibold text-green-900">Professor Documentation</h3>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        Access documentation for course management, grading features, and AI-powered teaching assistance.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/help#courses">Course Guide</Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/help#ai-features">AI Features</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {session?.user?.role === 'STUDENT' && (
                            <div className="space-y-4">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <h3 className="mb-2 font-semibold text-blue-900">Student Documentation</h3>
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        Learn how to participate in discussions, submit assignments, and track your progress.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/help#student-guide">Student Guide</Link>
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/dashboard">Your Dashboard</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!session && (
                            <div className="py-8 text-center">
                                <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
                                <p className="mb-4 text-muted-foreground">
                                    Sign in to see documentation specific to your role
                                </p>
                                <Button asChild>
                                    <Link href="/auth/signin">Sign In</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* API Documentation */}
                {session?.user?.role === 'ADMIN' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="size-5" />
                                API Reference
                            </CardTitle>
                            <CardDescription>
                                Developer documentation for API endpoints
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {apiDocs.map((api, index) => (
                                    <div key={index} className="flex items-center justify-between rounded border p-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{api.method}</Badge>
                                                <code className="font-mono text-sm">{api.endpoint}</code>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {api.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 rounded-lg bg-muted p-4">
                                <h4 className="mb-2 font-medium">Development Environment</h4>
                                <p className="text-sm text-muted-foreground">
                                    API endpoints are available at <code>http://localhost:3000</code> in development.
                                    Authentication is required for most endpoints.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* System Requirements & Support */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="mb-3 font-semibold">System Requirements</h3>
                                <ul className="space-y-2 text-sm">
                                    <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                                    <li>• Stable internet connection</li>
                                    <li>• JavaScript enabled</li>
                                    <li>• Cookies enabled for authentication</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-3 font-semibold">Technical Stack</h3>
                                <ul className="space-y-2 text-sm">
                                    <li>• Next.js 16.1+ with App Router</li>
                                    <li>• NextAuth.js for authentication</li>
                                    <li>• Prisma ORM with PostgreSQL</li>
                                    <li>• Multi-AI provider integration</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg border bg-blue-50 p-4">
                            <h4 className="mb-2 font-medium text-blue-900">Need Help?</h4>
                            <p className="mb-3 text-sm text-blue-800">
                                Can&apos;t find what you&apos;re looking for? Check our comprehensive help center.
                            </p>
                            <Button size="sm" asChild>
                                <Link href="/help">
                                    Visit Help Center
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FeatureLayout>
    )
}