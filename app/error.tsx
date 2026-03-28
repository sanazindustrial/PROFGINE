"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Application error:", error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mx-auto max-w-md space-y-6">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-10 text-yellow-600"
                    >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Temporary Issue</h1>

                <p className="text-lg text-muted-foreground">
                    We encountered a temporary issue. This is usually resolved quickly.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-md border bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
