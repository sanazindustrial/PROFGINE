"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export default function SignIn() {
    const [providers, setProviders] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasGoogleAuth, setHasGoogleAuth] = useState(false)

    useEffect(() => {
        const loadProviders = async () => {
            const res = await getProviders()
            setProviders(res)
            setHasGoogleAuth(!!res?.google)
        }
        loadProviders()
    }, [])

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            await signIn("google", {
                callbackUrl: "/dashboard",
                redirect: true
            })
        } catch (error) {
            console.error("Sign in error:", error)
            alert("Sign in failed. Please try again or contact an administrator.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header with Logo */}
                <div className="text-center">
                    <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-600">
                        <svg
                            className="size-10 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM18.82 9L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15 17 12.27v3.72z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">ProfGini Platform</h1>
                    <p className="mt-2 text-gray-600">A grading tool and course design studio.</p>
                </div>

                {/* Sign In Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-center text-2xl">Welcome Back</CardTitle>
                        <CardDescription className="text-center">
                            Sign in to continue to ProfGini Platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Google Sign In Button */}
                        <div className="space-y-3">
                            {hasGoogleAuth ? (
                                <Button
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="h-12 w-full border-gray-300 hover:bg-gray-50"
                                >
                                    <Icons.google className="mr-2 size-4" />
                                    {isLoading ? "Signing in..." : "Sign in with Google"}
                                </Button>
                            ) : (
                                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                                    <p className="text-sm text-yellow-800">
                                        Google authentication is not configured. Please contact the administrator.
                                    </p>
                                </div>
                            )}

                            {providers?.github && (
                                <Button
                                    onClick={async () => {
                                        setIsLoading(true)
                                        try {
                                            await signIn("github", { callbackUrl: "/" })
                                        } catch (error) {
                                            console.error("GitHub sign in error:", error)
                                        } finally {
                                            setIsLoading(false)
                                        }
                                    }}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="h-12 w-full border-gray-300 hover:bg-gray-50"
                                >
                                    <Icons.gitHub className="mr-2 size-4" />
                                    {isLoading ? "Signing in..." : "Sign in with GitHub"}
                                </Button>
                            )}
                        </div>

                        {/* Sign Up Link */}
                        <div className="pt-4 text-center text-sm text-gray-600">
                            Don&apos;t have an account?{" "}
                            <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign up for free
                            </a>
                        </div>

                        {/* Development Mode Link */}
                        {process.env.NODE_ENV !== 'production' && (
                            <div className="pt-2 text-center text-sm">
                                <a href="/auth/dev-login" className="font-medium text-red-600 hover:text-red-500">
                                    🛠️ Development Login (Bypass OAuth)
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}