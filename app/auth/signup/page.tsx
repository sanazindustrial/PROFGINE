"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import Link from "next/link"
import { AlertCircle, Eye, EyeOff, UserCheck, GraduationCap, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Simple Label component as fallback
const Label = ({ htmlFor, children, className = "" }: { htmlFor?: string, children: React.ReactNode, className?: string }) => (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
        {children}
    </label>
)

// Admin Signup Component - Invitation Required
function AdminSignupForm({ formData, setFormData, errors, isLoading, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, handleSubmit }: any) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                    <UserCheck className="mt-0.5 size-5 text-blue-600" />
                    <div>
                        <h4 className="font-semibold text-blue-900">Admin Account Registration</h4>
                        <p className="mt-1 text-sm text-blue-700">
                            Admin accounts require a valid invitation token. Contact an existing admin for access.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="invitationToken">Invitation Token *</Label>
                    <Input
                        id="invitationToken"
                        name="invitationToken"
                        type="text"
                        placeholder="Enter your invitation token"
                        value={formData.invitationToken}
                        onChange={(e) => setFormData({ ...formData, invitationToken: e.target.value })}
                        className={`h-11 ${errors.invitationToken ? 'border-red-500' : ''}`}
                        required
                    />
                    {errors.invitationToken && <p className="text-sm text-red-600">{errors.invitationToken}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`h-11 ${errors.name ? 'border-red-500' : ''}`}
                        required
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@university.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                        required
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={`h-11 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                            placeholder="Create a secure password"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="size-4 text-gray-400" /> : <Eye className="size-4 text-gray-400" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`h-11 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            placeholder="Confirm your password"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="size-4 text-gray-400" /> : <Eye className="size-4 text-gray-400" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <Button
                    type="submit"
                    className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Admin Account..." : "Create Admin Account"}
                </Button>
            </form>
        </div>
    )
}

// Professor Signup Component - Subscription Required
function ProfessorSignupForm({ formData, setFormData, errors, isLoading, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, handleSubmit, hasGoogleAuth, handleGoogleSignIn }: any) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 size-5 text-green-600" />
                    <div>
                        <h4 className="font-semibold text-green-900">Professor Account Registration</h4>
                        <p className="mt-1 text-sm text-green-700">
                            Create your professor account and select a subscription plan to get started with course management.
                        </p>
                    </div>
                </div>
            </div>

            {/* Google Sign Up Button */}
            {hasGoogleAuth && (
                <>
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        variant="outline"
                        className="h-11 w-full border-gray-300 hover:bg-gray-50"
                    >
                        <Icons.google className="mr-2 size-4" />
                        {isLoading ? "Creating account..." : "Continue with Google"}
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 uppercase tracking-wide text-gray-500">OR CONTINUE WITH EMAIL</span>
                        </div>
                    </div>
                </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Dr. Sarah Wilson"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`h-11 ${errors.name ? 'border-red-500' : ''}`}
                        required
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="professor@university.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                        required
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="institution">Institution</Label>
                        <Input
                            id="institution"
                            name="institution"
                            type="text"
                            placeholder="University Name"
                            value={formData.institution}
                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            name="department"
                            type="text"
                            placeholder="Computer Science"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="h-11"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Subscription Plan *</Label>
                    <Select
                        value={formData.subscriptionPlan}
                        onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                    >
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder="Choose your plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BASIC">
                                <div className="flex flex-col">
                                    <span className="font-medium">Basic - $29/month</span>
                                    <span className="text-sm text-gray-500">200 credits, unlimited students</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="PREMIUM">
                                <div className="flex flex-col">
                                    <span className="font-medium">Premium - $79/month</span>
                                    <span className="text-sm text-gray-500">500 credits, unlimited students</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.subscriptionPlan && <p className="text-sm text-red-600">{errors.subscriptionPlan}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={`h-11 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                            placeholder="Create a strong password"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="size-4 text-gray-400" /> : <Eye className="size-4 text-gray-400" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`h-11 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            placeholder="Confirm your password"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="size-4 text-gray-400" /> : <Eye className="size-4 text-gray-400" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                    <p>By creating an account, you agree to our Terms of Service and Privacy Policy. You will be able to start your 14-day free trial immediately.</p>
                </div>

                <Button
                    type="submit"
                    className="h-11 w-full bg-green-600 text-white hover:bg-green-700"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Professor Account..." : "Start Free Trial"}
                </Button>
            </form>
        </div>
    )
}

export default function SignUp() {
    const [providers, setProviders] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasGoogleAuth, setHasGoogleAuth] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [signupType, setSignupType] = useState<'admin' | 'professor' | 'student'>('professor')
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        institution: "",
        department: "",
        subscriptionPlan: "BASIC",
        invitationToken: ""
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    useEffect(() => {
        const loadProviders = async () => {
            const res = await getProviders()
            setProviders(res)
            setHasGoogleAuth(!!res?.google)
        }
        loadProviders()
    }, [])

    const handleGoogleSignIn = async () => {
        if (!hasGoogleAuth) {
            setErrors({ general: "Google authentication is not available. Please use email signup." })
            return
        }

        setIsLoading(true)
        try {
            await signIn("google", {
                callbackUrl: "/auth/success",
                redirect: true
            })
        } catch (error) {
            console.error("Google sign in error:", error)
            setErrors({ general: "Failed to sign up with Google. Please try again." })
            setIsLoading(false)
        }
    }

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}

        if (!formData.name.trim()) {
            newErrors.name = "Full name is required"
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
        }

        if (!formData.password) {
            newErrors.password = "Password is required"
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long"
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }

        // Validate based on signup type
        if (signupType === 'admin' && !formData.invitationToken.trim()) {
            newErrors.invitationToken = "Invitation token is required for admin accounts"
        }

        if (signupType === 'professor' && !formData.subscriptionPlan) {
            newErrors.subscriptionPlan = "Please select a subscription plan"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        if (!validateForm()) {
            return
        }

        setIsLoading(true)
        try {
            let signupEndpoint = '/api/auth/signup'

            if (signupType === 'admin') {
                signupEndpoint = '/api/admin/signup'
            } else if (signupType === 'professor') {
                signupEndpoint = '/api/auth/professor-signup'
            }

            const signupResponse = await fetch(signupEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    institution: formData.institution,
                    department: formData.department,
                    subscriptionPlan: formData.subscriptionPlan,
                    invitationToken: formData.invitationToken
                })
            })

            const signupData = await signupResponse.json()

            if (!signupResponse.ok) {
                setErrors({ general: signupData.error || "Failed to create account" })
                return
            }

            // Auto sign in after successful signup
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                setErrors({ general: "Account created but sign-in failed. Please try signing in manually." })
            } else {
                // Redirect based on account type
                if (signupType === 'admin') {
                    window.location.href = "/admin/dashboard"
                } else if (signupType === 'professor') {
                    window.location.href = "/subscription/welcome"
                } else {
                    window.location.href = "/dashboard"
                }
            }

        } catch (error) {
            console.error("Signup error:", error)
            setErrors({ general: "Failed to create account. Please try again." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg space-y-8">
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
                    <p className="mt-2 text-gray-600">AI-Powered Course Management & Grading</p>
                </div>

                {/* Sign Up Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-center text-2xl">Create Account</CardTitle>
                        <CardDescription className="text-center">
                            Choose your account type to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        {errors.general && (
                            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                                <AlertCircle className="size-4" />
                                {errors.general}
                            </div>
                        )}

                        {/* Account Type Selection */}
                        <div className="space-y-3">
                            <Label>Account Type</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    type="button"
                                    variant={signupType === 'admin' ? 'default' : 'outline'}
                                    className="flex h-auto flex-col gap-2 p-4"
                                    onClick={() => setSignupType('admin')}
                                >
                                    <UserCheck className="size-5" />
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">Admin</div>
                                        <div className="text-xs opacity-75">Invitation Only</div>
                                    </div>
                                </Button>
                                <Button
                                    type="button"
                                    variant={signupType === 'professor' ? 'default' : 'outline'}
                                    className="flex h-auto flex-col gap-2 p-4"
                                    onClick={() => setSignupType('professor')}
                                >
                                    <GraduationCap className="size-5" />
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">Professor</div>
                                        <div className="text-xs opacity-75">Subscription</div>
                                    </div>
                                </Button>
                                <Button
                                    type="button"
                                    variant={signupType === 'student' ? 'default' : 'outline'}
                                    className="flex h-auto flex-col gap-2 p-4"
                                    onClick={() => setSignupType('student')}
                                    disabled
                                >
                                    <Users className="size-5" />
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">Student</div>
                                        <div className="text-xs opacity-75">Enrolled Only</div>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        {signupType === 'student' && (
                            <div className="rounded-lg bg-gray-50 p-6 text-center">
                                <Users className="mx-auto mb-3 size-8 text-gray-400" />
                                <h3 className="mb-2 font-semibold text-gray-900">Student Access</h3>
                                <p className="mb-4 text-sm text-gray-600">
                                    Students are enrolled by their professors through course management.
                                    Contact your professor if you need access to a course.
                                </p>
                                <Button variant="outline" asChild>
                                    <Link href="/auth/signin">Sign In Instead</Link>
                                </Button>
                            </div>
                        )}

                        {signupType === 'admin' && (
                            <AdminSignupForm
                                formData={formData}
                                setFormData={setFormData}
                                errors={errors}
                                isLoading={isLoading}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                                handleSubmit={handleEmailSignUp}
                            />
                        )}

                        {signupType === 'professor' && (
                            <ProfessorSignupForm
                                formData={formData}
                                setFormData={setFormData}
                                errors={errors}
                                isLoading={isLoading}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                                handleSubmit={handleEmailSignUp}
                                hasGoogleAuth={hasGoogleAuth}
                                handleGoogleSignIn={handleGoogleSignIn}
                            />
                        )}

                        {/* Sign In Link */}
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