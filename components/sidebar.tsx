"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    MessageSquare,
    GraduationCap,
    BookOpen,
    Users,
    Settings,
    Star,
    ArrowRight,
    User,
    Monitor,
    CreditCard,
    Key
} from "lucide-react"

interface SidebarItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    description?: string
}

const navigationItems: SidebarItem[] = [
    {
        title: "Profile",
        href: "/dashboard/profile",
        icon: User,
        description: "Your account settings"
    },
    {
        title: "Course Design Studio",
        href: "/dashboard/course-design-studio",
        icon: Star,
        description: "AI-powered course creation"
    },
    {
        title: "Course Studio",
        href: "/dashboard/courses",
        icon: Monitor,
        description: "Create AI-powered presentations"
    },
    {
        title: "Module Registration",
        href: "/dashboard/module-registration",
        icon: Settings,
        description: "LMS module access control"
    },
    {
        title: "Student Enrollment",
        href: "/dashboard/enrollment",
        icon: Users,
        description: "Enroll students in your courses"
    },
    {
        title: "Assignments",
        href: "/dashboard/assignments",
        icon: GraduationCap,
        description: "Assignment management system"
    },
    {
        title: "Discussion Generator",
        href: "/discussion",
        icon: MessageSquare,
        description: "AI-powered discussion responses"
    },
    {
        title: "Grading Assistant",
        href: "/grade",
        icon: GraduationCap,
        description: "Smart grading and feedback"
    },
    {
        title: "AI Settings",
        href: "/dashboard/settings/ai",
        icon: Key,
        description: "Configure your own AI API keys"
    }
]

const ownerItems: SidebarItem[] = [
    {
        title: "Owner User Management",
        href: "/user-management",
        icon: Users,
        description: "Manage all platform users"
    },
    {
        title: "Owner Subscriptions",
        href: "/subscription-management",
        icon: CreditCard,
        description: "Plans, billing, and payments"
    },
    {
        title: "Owner Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        description: "Payments and invoices"
    }
]

interface SidebarProps {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const isOwner = !!(session?.user as any)?.isOwner

    return (
        <div className={cn("w-full pb-12", className)}>
            <div className="space-y-6 py-2">
                <div className="px-2">
                    <h2 className="mb-4 px-4 text-lg font-semibold tracking-tight">
                        Features
                    </h2>
                    <div className="space-y-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Button
                                    key={item.href}
                                    variant={pathname === item.href ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        pathname === item.href && "bg-secondary"
                                    )}
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <Icon className="mr-2 size-4" />
                                        {item.title}
                                    </Link>
                                </Button>
                            )
                        })}
                    </div>
                </div>

                {isOwner && (
                    <div className="px-2">
                        <h2 className="mb-4 px-4 text-lg font-semibold tracking-tight">
                            Owner Console
                        </h2>
                        <div className="space-y-2">
                            {ownerItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Button
                                        key={item.href}
                                        variant={pathname === item.href ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start",
                                            pathname === item.href && "bg-secondary"
                                        )}
                                        asChild
                                    >
                                        <Link href={item.href}>
                                            <Icon className="mr-2 size-4" />
                                            {item.title}
                                        </Link>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Stats Card */}
                <div className="px-2">
                    <Card className="transition-shadow duration-200 hover:shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Star className="mr-2 size-4 text-yellow-500" />
                                AI Providers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                                8 AI providers with automatic failover
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-block rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">OpenAI</span>
                                <span className="inline-block rounded-md bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Claude</span>
                                <span className="inline-block rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">Free</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Help Card */}
                <div className="px-2">
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-200 hover:shadow-md dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
                        <CardContent className="p-5">
                            <div className="flex items-start space-x-3">
                                <BookOpen className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Need Help?
                                    </p>
                                    <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                                        Check our documentation for tips and best practices.
                                    </p>
                                    <Button variant="link" className="h-auto p-0 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" asChild>
                                        <Link href="/docs">
                                            Learn More <ArrowRight className="ml-1 size-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}