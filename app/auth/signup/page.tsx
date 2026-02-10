"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import Link from "next/link"

export default function SignUp() {
    const [isLoading, setIsLoading] = useState(false)
    const [hasGoogleAuth, setHasGoogleAuth] = useState(false)

    useEffect(() => {
        const loadProviders = async () => {
            const res = await getProviders()
            setHasGoogleAuth(!!res?.google)
        }
        loadProviders()
    }, [])

    const handleGoogleSignUp = async () => {
        setIsLoading(true)
        try {
            await signIn("google", {
                callbackUrl: "/auth/success",
                redirect: true
            })
        } catch (error) {
            console.error("Google sign in error:", error)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg space-y-8">
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
                    <h1 className="text-3xl font-bold text-gray-900">ProfGenie Platform</h1>
                    <p className="mt-2 text-gray-600">Professor signup (university email required)</p>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-center text-2xl">Create Professor Account</CardTitle>
                        <CardDescription className="text-center">
                            Admin/Owner accounts are invite-only
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {hasGoogleAuth ? (
                            <Button
                                onClick={handleGoogleSignUp}
                                disabled={isLoading}
                                variant="outline"
                                className="h-12 w-full border-gray-300 hover:bg-gray-50"
                            >
                                <Icons.google className="mr-2 size-4" />
                                {isLoading ? "Signing up..." : "Continue with Google"}
                            </Button>
                        ) : (
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                                <p className="text-sm text-yellow-800">
                                    Google authentication is not configured. Please contact the administrator.
                                </p>
                            </div>
                        )}

                        <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                            Admin and owner access is granted only by invitation. Invited admins can sign in with Google or password.
                        </div>

                        <div className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
