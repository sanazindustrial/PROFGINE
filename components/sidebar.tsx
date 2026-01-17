"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
    Presentation
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
        href: "/profile",
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
        icon: Presentation,
        description: "Create AI-powered presentations"
    },
    {
        title: "Module Registration",
        href: "/dashboard/module-registration",
        icon: Settings,
        description: "LMS module access control"
    },
    {
        title: "Enrollment",
        href: "/dashboard/enrollment",
        icon: Users,
        description: "Student enrollment management"
    },
    {
        title: "Assignments",
        href: "/dashboard/assignments",
        icon: GraduationCap,
        description: "Assignment management system"
    },
    {
        title: "Courses",
        href: "/dashboard/courses",
        icon: BookOpen,
        description: "Manage your courses"
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
    }
]

interface SidebarProps {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn("w-64 pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Features
                    </h2>
                    <div className="space-y-1">
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

                {/* Quick Stats Card */}
                <div className="px-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Star className="mr-1 size-4 text-yellow-500" />
                                AI Providers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <p className="mb-2 text-xs text-muted-foreground">
                                8 AI providers with automatic failover
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">OpenAI</span>
                                <span className="inline-block rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">Claude</span>
                                <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-700">Free</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Help Card */}
                <div className="px-3">
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-2">
                                <BookOpen className="mt-0.5 size-5 text-blue-600 dark:text-blue-400" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Need Help?
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Check our documentation for tips and best practices.
                                    </p>
                                    <Button variant="link" className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400" asChild>
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