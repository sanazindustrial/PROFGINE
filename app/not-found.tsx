import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Page Not Found - Professor GENIE',
    description: 'The page you are looking for is under construction or does not exist.',
}

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mx-auto max-w-md space-y-6">
                {/* Logo/Icon */}
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-10 text-primary"
                    >
                        <path d="M12 6V2H8" />
                        <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
                        <path d="M2 12h2" />
                        <path d="M9 11v2" />
                        <path d="M15 11v2" />
                        <path d="M20 12h2" />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">Under Construction</h1>

                <p className="text-lg text-muted-foreground">
                    This page is currently being built or updated. We're working hard to bring you the best experience.
                </p>

                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">
                        Professor GENIE is continuously improving. New features and pages are being added regularly.
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-md border bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                        Back to Home
                    </Link>
                </div>

                <p className="text-xs text-muted-foreground">
                    If you believe this is an error, please contact support.
                </p>
            </div>
        </div>
    )
}
