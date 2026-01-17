import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/prisma/client'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import {
    ArrowLeft,
    Key,
    CheckCircle,
    AlertTriangle,
    Copy
} from 'lucide-react'

export default async function EnvironmentCheckPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect('/auth/signin')
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== UserRole.ADMIN) {
        redirect('/dashboard')
    }

    // Check environment variables
    const envVars = {
        'NEXTAUTH_URL': { value: process.env.NEXTAUTH_URL, required: true, sensitive: false },
        'NEXTAUTH_SECRET': { value: process.env.NEXTAUTH_SECRET ? '***CONFIGURED***' : '', required: true, sensitive: true },
        'GOOGLE_CLIENT_ID': { value: process.env.GOOGLE_CLIENT_ID ? '***CONFIGURED***' : '', required: true, sensitive: true },
        'GOOGLE_CLIENT_SECRET': { value: process.env.GOOGLE_CLIENT_SECRET ? '***CONFIGURED***' : '', required: true, sensitive: true },
        'DATABASE_URL': { value: process.env.DATABASE_URL ? '***CONFIGURED***' : '', required: true, sensitive: true },
        'DIRECT_URL': { value: process.env.DIRECT_URL ? '***CONFIGURED***' : '', required: false, sensitive: true },
        'OPENAI_API_KEY': { value: process.env.OPENAI_API_KEY ? '***CONFIGURED***' : '', required: false, sensitive: true },
        'ANTHROPIC_API_KEY': { value: process.env.ANTHROPIC_API_KEY ? '***CONFIGURED***' : '', required: false, sensitive: true },
        'GEMINI_API_KEY': { value: process.env.GEMINI_API_KEY ? '***CONFIGURED***' : '', required: false, sensitive: true },
        'GROQ_API_KEY': { value: process.env.GROQ_API_KEY ? '***CONFIGURED***' : '', required: false, sensitive: true },
        'STRIPE_SECRET_KEY': { value: process.env.STRIPE_SECRET_KEY ? '***CONFIGURED***' : '', required: false, sensitive: true },
        'STRIPE_PUBLISHABLE_KEY': { value: process.env.STRIPE_PUBLISHABLE_KEY ? '***CONFIGURED***' : '', required: false, sensitive: true },
    }

    const getStatus = (envVar: { value: string | undefined; required: boolean }) => {
        if (!envVar.value) {
            return envVar.required ? 'missing' : 'optional'
        }
        return 'configured'
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'configured':
                return <Badge variant="default" className="bg-green-500">Configured</Badge>
            case 'missing':
                return <Badge variant="destructive">Missing</Badge>
            case 'optional':
                return <Badge variant="secondary">Optional</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const missingRequired = Object.entries(envVars)
        .filter(([_, env]) => env.required && !env.value)
        .length

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/admin-settings">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">🔑 Environment Configuration Check</h1>
                    <p className="text-muted-foreground">Verify all required environment variables and API keys</p>
                </div>
            </div>

            {/* Status Alert */}
            {missingRequired === 0 ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="size-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        ✅ All required environment variables are configured
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertTriangle className="size-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                        ⚠️ {missingRequired} required environment variable(s) are missing. Please configure them.
                    </AlertDescription>
                </Alert>
            )}

            {/* Authentication Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Configuration</CardTitle>
                    <CardDescription>NextAuth.js and Google OAuth setup</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'].map(key => {
                            const env = envVars[key as keyof typeof envVars]
                            const status = getStatus(env)
                            return (
                                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{key}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {env.sensitive ? 'Sensitive value - not displayed' : env.value || 'Not configured'}
                                        </p>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Database Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Database Configuration</CardTitle>
                    <CardDescription>PostgreSQL and Prisma ORM setup</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {['DATABASE_URL', 'DIRECT_URL'].map(key => {
                            const env = envVars[key as keyof typeof envVars]
                            const status = getStatus(env)
                            return (
                                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{key}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {env.sensitive ? 'Sensitive value - not displayed' : env.value || 'Not configured'}
                                        </p>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* AI Providers */}
            <Card>
                <CardHeader>
                    <CardTitle>AI Provider Keys</CardTitle>
                    <CardDescription>API keys for AI services</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY'].map(key => {
                            const env = envVars[key as keyof typeof envVars]
                            const status = getStatus(env)
                            return (
                                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{key}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Optional - Leave empty to use free/fallback providers
                                        </p>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment & Billing</CardTitle>
                    <CardDescription>Stripe API configuration</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'].map(key => {
                            const env = envVars[key as keyof typeof envVars]
                            const status = getStatus(env)
                            return (
                                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{key}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Optional - Required only if using Stripe for payments
                                        </p>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Configuration Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration Guide</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h4 className="mb-2 font-medium">✅ Essential Configuration</h4>
                            <p className="text-muted-foreground">
                                These variables must be configured for the platform to work:
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                                <li>NEXTAUTH_URL and NEXTAUTH_SECRET - Authentication</li>
                                <li>GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET - Google OAuth</li>
                                <li>DATABASE_URL - PostgreSQL connection</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-2 font-medium">🚀 Recommended Configuration</h4>
                            <p className="text-muted-foreground">
                                Add at least one AI provider key:
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                                <li>ANTHROPIC_API_KEY - Claude (Recommended)</li>
                                <li>OPENAI_API_KEY - GPT</li>
                                <li>GEMINI_API_KEY - Google Gemini</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-2 font-medium">💳 Optional Configuration</h4>
                            <p className="text-muted-foreground">
                                Add if using Stripe for billing:
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                                <li>STRIPE_SECRET_KEY - Server-side transactions</li>
                                <li>STRIPE_PUBLISHABLE_KEY - Client-side forms</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documentation Link */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/help">
                                📚 View Documentation
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/admin-settings">
                                Back to Admin Settings
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}