"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex gap-6 md:gap-10">
      <Link
        href={session ? "/dashboard/course-design-studio" : "/"}
        className="flex items-center space-x-3 group"
        title="ProfGenie - AI-Powered Education Platform"
      >
        <div className="relative size-12 shrink-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 animate-float">
          <Icons.logo className="size-12" />
        </div>
        <div className="flex flex-col">
          <span className="hidden font-bold sm:inline-block text-base md:text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            {siteConfig.name}
          </span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline-block">
            Empowering Smart Learning
          </span>
        </div>
      </Link>

      {session && (
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard/course-design-studio"
            className={cn(
              "relative text-sm font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
              pathname === "/dashboard/course-design-studio"
                ? "text-foreground after:w-full"
                : "text-muted-foreground"
            )}
          >
            Course Design Studio
          </Link>
          <Link
            href="/discussion"
            className={cn(
              "relative text-sm font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
              pathname === "/discussion"
                ? "text-foreground after:w-full"
                : "text-muted-foreground"
            )}
          >
            Discussion Generator
          </Link>
          <Link
            href="/grade"
            className={cn(
              "relative text-sm font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
              pathname === "/grade"
                ? "text-foreground after:w-full"
                : "text-muted-foreground"
            )}
          >
            Grading Assistant
          </Link>
          <Link
            href="/help"
            className={cn(
              "relative text-sm font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
              pathname === "/help"
                ? "text-foreground after:w-full"
                : "text-muted-foreground"
            )}
          >
            Help
          </Link>
        </nav>
      )}
    </div>
  )
}
