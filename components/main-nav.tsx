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
      <Link href="/" className="flex items-center space-x-2">
        <Icons.logo className="size-6" />
        <span className="inline-block font-bold">
          {siteConfig.name}
        </span>
      </Link>

      {session && (
        <nav className="flex gap-6">
          <Link
            href="/dashboard/course-design-studio"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard/course-design-studio" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Course Design Studio
          </Link>
          <Link
            href="/discussion"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/discussion" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Discussion Generator
          </Link>
          <Link
            href="/grade"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/grade" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Grading Assistant
          </Link>
          <Link
            href="/help"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/help" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Help
          </Link>
        </nav>
      )}
    </div>
  )
}
