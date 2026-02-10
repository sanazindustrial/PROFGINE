"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function AuthErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    const errorMessages: Record<string, { title: string; description: string }> = {
        Configuration: {
            title: "Configuration Error",
            description: "There is a problem with the server configuration. Please contact support.",
        },
        AccessDenied: {
            title: "Access Denied",
            description: "You do not have permission to sign in.",
        },
        Verification: {
            title: "Verification Error",
            description: "The verification token has expired or has already been used.",
        },
        OAuthSignin: {
            title: "OAuth Sign In Error",
            description: "Error in constructing an authorization URL. Please try again.",
        },
        OAuthCallback: {
            title: "OAuth Callback Error",
            description: "Error in handling the response from the OAuth provider. This may be a cookie or state token issue. Please try again.",
        },
        OAuthCreateAccount: {
            title: "OAuth Account Creation Error",
            description: "Could not create OAuth provider user in the database.",
        },
        EmailCreateAccount: {
            title: "Email Account Creation Error",
            description: "Could not create email provider user in the database.",
        },
        Callback: {
            title: "Callback Error",
            description: "Error in the OAuth callback handler route. Please try again.",
        },
        OAuthAccountNotLinked: {
            title: "Account Not Linked",
            description: "To confirm your identity, sign in with the same account you used originally.",
        },
        EmailSignin: {
            title: "Email Sign In Error",
            description: "Check your email address.",
        },
        CredentialsSignin: {
            title: "Sign In Error",
            description: "Sign in failed. Check the details you provided are correct.",
        },
        SessionRequired: {
            title: "Session Required",
            description: "You must be signed in to access this page.",
        },
        Default: {
            title: "Authentication Error",
            description: "An unknown error occurred during authentication. Please try again.",
        },
    }

    const errorInfo = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100">
                        <svg
                            className="size-10 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">ProfGenie Platform</h1>
                </div>

                {/* Error Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-center text-2xl text-red-600">
                            {errorInfo.title}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {errorInfo.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Error Details */}
                        {error && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-4">
                                <p className="text-sm font-medium text-red-800">Error Code: {error}</p>
                            </div>
                        )}

                        {/* Troubleshooting Tips */}
                        {error === "OAuthCallback" && (
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                                <p className="mb-2 text-sm font-medium text-blue-800">Troubleshooting Tips:</p>
                                <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
                                    <li>Clear your browser cookies and try again</li>
                                    <li>Make sure cookies are enabled in your browser</li>
                                    <li>Try using an incognito/private browsing window</li>
                                    <li>Disable browser extensions that might block cookies</li>
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4">
                            <Link href="/auth/signin" className="block">
                                <Button className="h-12 w-full">
                                    Try Again
                                </Button>
                            </Link>
                            <Link href="/" className="block">
                                <Button variant="outline" className="h-12 w-full">
                                    Go to Home
                                </Button>
                            </Link>
                        </div>

                        {/* Support */}
                        <div className="pt-4 text-center text-sm text-gray-600">
                            Still having issues?{" "}
                            <a href="mailto:support@profgenie.ai" className="font-medium text-blue-600 hover:text-blue-500">
                                Contact Support
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function AuthError() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                    <div className="w-full max-w-md space-y-6 text-center">
                        <div className="mx-auto size-12 animate-pulse rounded-full bg-gray-200" />
                        <p className="text-sm text-gray-600">Loading error details...</p>
                    </div>
                </div>
            }
        >
            <AuthErrorContent />
        </Suspense>
    )
}
