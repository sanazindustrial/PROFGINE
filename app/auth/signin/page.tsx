"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"

export default function SignIn() {
    const [providers, setProviders] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasGoogleAuth, setHasGoogleAuth] = useState(false)
    const [hasGuestAuth, setHasGuestAuth] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    useEffect(() => {
        const loadProviders = async () => {
            const res = await getProviders()
            setProviders(res)
            setHasGoogleAuth(!!res?.google)
            setHasGuestAuth(!!res?.guest)
        }
        loadProviders()
    }, [])

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            await signIn("google", {
                callbackUrl: "/auth/success",
                redirect: true
            })
        } catch (error) {
            console.error("Sign in error:", error)
            alert("Sign in failed. Please try again or contact an administrator.")
            setIsLoading(false)
        }
    }

    const handlePasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await signIn("credentials", {
                email,
                password,
                callbackUrl: "/auth/success",
                redirect: true
            })
        } catch (error) {
            console.error("Sign in error:", error)
            alert("Sign in failed. Please check your credentials or contact an administrator.")
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
                    <h1 className="text-3xl font-bold text-gray-900">ProfGenie Platform</h1>
                    <p className="mt-2 text-gray-600">A grading tool and course design studio.</p>
                </div>

                {/* Sign In Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-center text-2xl">Welcome Back</CardTitle>
                        <CardDescription className="text-center">
                            Sign in to continue to ProfGenie Platform
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

                            {hasGuestAuth && (
                                <Button
                                    onClick={async () => {
                                        setIsLoading(true)
                                        try {
                                            await signIn("guest", { callbackUrl: "/auth/success" })
                                        } finally {
                                            setIsLoading(false)
                                        }
                                    }}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="h-12 w-full border-gray-300 hover:bg-gray-50"
                                >
                                    Continue as Guest
                                </Button>
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

                        {/* Admin/Owner Password Sign In */}
                        <div className="rounded-md border border-gray-200 bg-white p-4">
                            <p className="mb-3 text-xs text-gray-600">
                                Admin/Owner password sign-in (university email required)
                            </p>
                            <form onSubmit={handlePasswordSignIn} className="space-y-3">
                                <Input
                                    type="email"
                                    placeholder="admin@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full border-gray-300 hover:bg-gray-50"
                                >
                                    Sign in with Password
                                </Button>
                            </form>
                        </div>

                        {/* Sign Up Link */}
                        <div className="pt-4 text-center text-sm text-gray-600">
                            Don&apos;t have an account?{" "}
                            <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign up for free
                            </a>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}