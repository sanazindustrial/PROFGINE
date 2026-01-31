"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    User,
    Settings,
    LogOut,
    CreditCard,
    Shield,
    Menu,
    Bell,
    Search
} from "lucide-react"

interface TopNavProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string
    }
}

export function TopNav({ user }: TopNavProps) {
    const pathname = usePathname()
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const isAdmin = user.role === "ADMIN"

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
            <div className="container flex h-16 items-center justify-between px-4">
                {/* Logo and Brand */}
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                            <span className="text-lg font-bold text-white">PG</span>
                        </div>
                        <span className="hidden font-bold text-xl sm:inline-block">
                            Professor GENIE
                        </span>
                    </Link>

                    {/* Quick Nav Links - Desktop */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="/dashboard">
                            <Button
                                variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                                size="sm"
                            >
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/dashboard/courses">
                            <Button
                                variant={pathname.startsWith("/dashboard/courses") ? "secondary" : "ghost"}
                                size="sm"
                            >
                                Courses
                            </Button>
                        </Link>
                        <Link href="/dashboard/course-design-studio">
                            <Button
                                variant={pathname === "/dashboard/course-design-studio" ? "secondary" : "ghost"}
                                size="sm"
                            >
                                Studio
                            </Button>
                        </Link>
                        {isAdmin && (
                            <Link href="/admin/users">
                                <Button
                                    variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
                                    size="sm"
                                    className="text-purple-600 dark:text-purple-400"
                                >
                                    <Shield className="mr-1 h-4 w-4" />
                                    Admin
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    {/* Search Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="hidden sm:flex"
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                            {user.role || "STUDENT"}
                                        </Badge>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/billing" className="cursor-pointer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Billing</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            {isAdmin && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/users" className="cursor-pointer text-purple-600 dark:text-purple-400">
                                            <Shield className="mr-2 h-4 w-4" />
                                            <span>Admin Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 dark:text-red-400"
                                onClick={() => signOut({ callbackUrl: "/" })}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Search Bar (when open) */}
            {isSearchOpen && (
                <div className="border-t p-4">
                    <input
                        type="text"
                        placeholder="Search courses, assignments, or discussions..."
                        className="w-full rounded-md border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                        autoFocus
                    />
                </div>
            )}
        </nav>
    )
}
