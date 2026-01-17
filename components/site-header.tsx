"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

import { siteConfig } from "@/config/site"
import { Button, buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  User,
  Settings,
  Star,
  Crown,
  Shield,
  LogOut
} from "lucide-react"

export function SiteHeader() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>

          <nav className="flex items-center space-x-2">
            <ThemeToggle />

            {session ? (
              <>
                {/* Quick Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs"
                >
                  <LogOut className="mr-1 size-3" />
                  Logout
                </Button>

                {/* Quick Admin Login (if not already admin) */}
                {session.user?.role !== 'ADMIN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <Link href="/admin-login">
                      <Shield className="mr-1 size-3" />
                      Admin
                    </Link>
                  </Button>
                )}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative size-8 rounded-full">
                      {session.user?.image ? (
                        <div className="size-8 overflow-hidden rounded-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={session.user.image}
                            alt={session.user?.name || 'User'}
                            className="size-8 rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
                          {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.name || session.user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                        {session.user?.role && (
                          <Badge variant={session.user.role === 'ADMIN' ? 'default' : 'secondary'} className="w-fit">
                            {session.user.role === 'ADMIN' && <Shield className="mr-1 size-3" />}
                            {session.user.role}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      Account
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 size-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <Settings className="mr-2 size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>

                    {session?.user?.role === 'ADMIN' && (
                      <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                          Admin Panel
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/user-management" className="cursor-pointer">
                            <User className="mr-2 size-4" />
                            User Management
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/ai-management" className="cursor-pointer">
                            <Settings className="mr-2 size-4" />
                            AI Management
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/invite-user" className="cursor-pointer">
                            <Star className="mr-2 size-4" />
                            Invite Users
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/subscription-management" className="cursor-pointer">
                            <Crown className="mr-2 size-4" />
                            Subscriptions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem className="cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault()
                        signOut({ callbackUrl: '/auth/signin' })
                      }}
                    >
                      <User className="mr-2 size-4" />
                      Switch Account
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-red-600"
                      onSelect={(event) => {
                        event.preventDefault()
                        signOut({ callbackUrl: '/' })
                      }}
                    >
                      <LogOut className="mr-2 size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className={buttonVariants({
                    size: "sm",
                  })}
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}