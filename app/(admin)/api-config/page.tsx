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
    CheckCircle,
    AlertTriangle,
    Code,
    Zap,
    Cloud,
    Database,
    Lock,
    Settings,
    ExternalLink
} from 'lucide-react'

export default async function ApiConfigPage() {
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

    const apiConfigurations = [
        {
            name: "OpenAI API",
            description: "GPT-4, GPT-3.5 Turbo, and other models",
            status: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
            category: "AI",
            docs: "https://platform.openai.com/docs",
            envVar: "OPENAI_API_KEY"
        },
        {
            name: "Anthropic API",
            description: "Claude models including Claude Haiku 4.5",
            status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
            category: "AI",
            docs: "https://console.anthropic.com",
            envVar: "ANTHROPIC_API_KEY"
        },
        {
            name: "Google Gemini API",
            description: "Gemini and other Google AI models",
            status: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'configured' : 'missing',
            category: "AI",
            docs: "https://ai.google.dev",
            envVar: "GOOGLE_GENERATIVE_AI_API_KEY"
        },
        {
            name: "Groq API",
            description: "Fast inference with Groq's LPU",
            status: process.env.GROQ_API_KEY ? 'configured' : 'missing',
            category: "AI",
            docs: "https://console.groq.com",
            envVar: "GROQ_API_KEY"
        },
        {
            name: "Google OAuth",
            description: "User authentication and sign-in",
            status: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'missing',
            category: "Auth",
            docs: "https://console.cloud.google.com",
            envVar: "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
        },
        {
            name: "Stripe API",
            description: "Payment processing and billing",
            status: process.env.STRIPE_API_KEY ? 'configured' : 'missing',
            category: "Payments",
            docs: "https://stripe.com/docs",
            envVar: "STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET"
        },
        {
            name: "PostgreSQL Database",
            description: "Primary data storage (Neon)",
            status: process.env.DATABASE_URL ? 'configured' : 'missing',
            category: "Database",
            docs: "https://neon.tech/docs",
            envVar: "DATABASE_URL, DIRECT_URL"
        },
        {
            name: "NextAuth",
            description: "Authentication framework and sessions",
            status: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
            category: "Auth",
            docs: "https://next-auth.js.org",
            envVar: "NEXTAUTH_SECRET, NEXTAUTH_URL"
        }
    ]

    const categories = ['AI', 'Auth', 'Payments', 'Database']

    // Group by category
    const groupedApis = categories.reduce((acc, cat) => {
        acc[cat] = apiConfigurations.filter(api => api.category === cat)
        return acc
    }, {} as Record<string, typeof apiConfigurations>)

    const configuredCount = apiConfigurations.filter(api => api.status === 'configured').length
    const missingCount = apiConfigurations.filter(api => api.status === 'missing').length

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
                    <h1 className="text-3xl font-bold">🌐 API Configuration</h1>
                    <p className="text-muted-foreground">Manage external API integrations and services</p>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Configured APIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{configuredCount}</div>
                        <p className="mt-1 text-xs text-muted-foreground">of {apiConfigurations.length} total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Missing APIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">{missingCount}</div>
                        <p className="mt-1 text-xs text-muted-foreground">Recommended to configure</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{Math.round(configuredCount / apiConfigurations.length * 100)}%</div>
                        <p className="mt-1 text-xs text-muted-foreground">Complete</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert if incomplete */}
            {missingCount > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertTriangle className="size-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        ⚠️ {missingCount} API{missingCount !== 1 ? 's' : ''} not configured. Some features may be unavailable.
                    </AlertDescription>
                </Alert>
            )}

            {/* By Category */}
            {Object.entries(groupedApis).map(([category, apis]) => (
                <div key={category}>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                        {category === 'AI' && <Zap className="size-5" />}
                        {category === 'Auth' && <Lock className="size-5" />}
                        {category === 'Payments' && <Settings className="size-5" />}
                        {category === 'Database' && <Database className="size-5" />}
                        {category} Services
                    </h2>
                    <div className="grid gap-4">
                        {apis.map((api) => (
                            <Card key={api.name}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{api.name}</CardTitle>
                                            <CardDescription className="mt-1">{api.description}</CardDescription>
                                        </div>
                                        <Badge className={api.status === 'configured' ? 'bg-green-500' : 'bg-yellow-500'}>
                                            {api.status === 'configured' ? '✅ Configured' : '⚠️ Missing'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="mb-2 text-xs font-medium text-muted-foreground">Environment Variable</p>
                                        <code className="block break-words rounded bg-muted p-2 text-xs">
                                            {api.envVar}
                                        </code>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="w-full"
                                    >
                                        <a href={api.docs} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 size-3" />
                                            View Documentation
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {/* Setup Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>📋 Setup Instructions</CardTitle>
                    <CardDescription>How to configure API integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="mb-2 font-medium">1️⃣ Obtain API Keys</p>
                        <p className="text-muted-foreground">
                            Visit each service&apos;s documentation link and create an API key for your project.
                        </p>
                    </div>
                    <div>
                        <p className="mb-2 font-medium">2️⃣ Set Environment Variables</p>
                        <p className="text-muted-foreground">
                            Add the API keys to your .env.local file (local development) or
                            Vercel dashboard (production deployment).
                        </p>
                    </div>
                    <div>
                        <p className="mb-2 font-medium">3️⃣ Restart Development Server</p>
                        <p className="text-muted-foreground">
                            After adding environment variables, restart your development server
                            for changes to take effect.
                        </p>
                    </div>
                    <div>
                        <p className="mb-2 font-medium">4️⃣ Test Configuration</p>
                        <p className="text-muted-foreground">
                            Use the AI Management page to test AI providers, or check the Environment
                            page to verify all variables are loaded.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
                <CardHeader>
                    <CardTitle>🔒 Security Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <p>Never commit API keys to version control. Use environment variables only.</p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <p>Use separate API keys for development and production environments.</p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <p>Rotate API keys periodically and revoke old ones immediately.</p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <p>Enable API rate limiting and monitoring in your service dashboards.</p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <p>Use webhook secrets for secure integration verification.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 md:grid-cols-2">
                        <Button variant="outline" asChild className="justify-start">
                            <Link href="/admin/admin-settings">
                                ⚙️ Back to Admin Settings
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                            <Link href="/admin/environment">
                                🔑 Environment Configuration
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                            <Link href="/dashboard/settings/ai">
                                🧠 AI Management
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                            <Link href="/admin/database-health">
                                🗄️ Database Health
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}