"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CourseResultsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Course presentation results error:", error)
    }, [error])

    return (
        <div className="container mx-auto flex items-center justify-center px-4 py-16">
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="size-5" />
                        Failed to load presentation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        Could not load the presentation results. The presentation may have been deleted or there was a server error.
                    </p>
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                        {error.message || "An unexpected error occurred"}
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={reset} className="flex-1">
                            <RefreshCw className="mr-2 size-4" />
                            Try Again
                        </Button>
                        <Button variant="outline" className="flex-1" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 size-4" />
                                Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
