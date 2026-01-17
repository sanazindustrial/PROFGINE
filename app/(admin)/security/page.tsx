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
    Shield,
    CheckCircle,
    Lock,
    Eye,
    FileText,
    Users,
    Database,
    Globe,
    AlertTriangle
} from 'lucide-react'

export default async function SecurityPage() {
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

    const securityFeatures = [
        {
            title: "Data Encryption",
            description: "All sensitive data is encrypted at rest and in transit",
            status: "active",
            icon: Lock
        },
        {
            title: "Role-Based Access Control",
            description: "Users are restricted based on their assigned roles",
            status: "active",
            icon: Users
        },
        {
            title: "Session Management",
            description: "Secure session handling with NextAuth.js",
            status: "active",
            icon: Globe
        },
        {
            title: "Database Security",
            description: "PostgreSQL with role-based access controls",
            status: "active",
            icon: Database
        },
        {
            title: "API Rate Limiting",
            description: "Rate limiting on API endpoints to prevent abuse",
            status: "active",
            icon: AlertTriangle
        },
        {
            title: "Audit Logging",
            description: "Track all administrative actions and changes",
            status: "planned",
            icon: FileText
        }
    ]

    const complianceItems = [
        {
            title: "GDPR Compliance",
            description: "Supports user data export and deletion requests",
            status: "compliant",
            icon: Eye
        },
        {
            title: "Data Privacy",
            description: "Student data is never used for training AI models",
            status: "compliant",
            icon: Shield
        },
        {
            title: "FERPA Compliance",
            description: "Supports educational privacy regulations",
            status: "compliant",
            icon: FileText
        },
        {
            title: "SOC 2 Ready",
            description: "Infrastructure designed for SOC 2 compliance",
            status: "in-progress",
            icon: CheckCircle
        }
    ]

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
                    <h1 className="text-3xl font-bold">🔒 Security & Compliance</h1>
                    <p className="text-muted-foreground">Platform security policies and compliance status</p>
                </div>
            </div>

            {/* Security Overview */}
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="size-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                    ✅ Platform maintains high security standards with encrypted data, role-based access, and secure session management
                </AlertDescription>
            </Alert>

            {/* Security Features */}
            <div>
                <h2 className="mb-4 text-2xl font-bold">Security Features</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {securityFeatures.map((feature) => {
                        const Icon = feature.icon
                        const statusColor = feature.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        return (
                            <Card key={feature.title}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <Icon className="size-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{feature.title}</CardTitle>
                                            </div>
                                        </div>
                                        <Badge className={statusColor}>
                                            {feature.status === 'active' ? 'Active' : 'Planned'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Compliance Status */}
            <div>
                <h2 className="mb-4 text-2xl font-bold">Compliance Standards</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {complianceItems.map((item) => {
                        const Icon = item.icon
                        const statusColor = item.status === 'compliant' ? 'bg-green-500' : 
                                           item.status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                        const statusLabel = item.status === 'compliant' ? '✅ Compliant' : 
                                           item.status === 'in-progress' ? '🔄 In Progress' : 'Planned'
                        
                        return (
                            <Card key={item.title}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <Icon className="size-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{item.title}</CardTitle>
                                            </div>
                                        </div>
                                        <Badge className={statusColor}>
                                            {statusLabel}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Security Policies */}
            <Card>
                <CardHeader>
                    <CardTitle>Security Policies</CardTitle>
                    <CardDescription>Core security principles and practices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="mb-2 font-medium">🔐 Authentication & Authorization</h4>
                        <p className="text-sm text-muted-foreground">
                            Uses NextAuth.js with Google OAuth 2.0. All users must authenticate before access. 
                            Role-based access control restricts features based on user role (ADMIN, PROFESSOR, STUDENT).
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-2 font-medium">🔒 Data Protection</h4>
                        <p className="text-sm text-muted-foreground">
                            Sensitive data is encrypted using industry-standard algorithms. Database connections use 
                            SSL/TLS encryption. Student data and grading information are protected with strict access controls.
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-2 font-medium">📋 Audit Trail</h4>
                        <p className="text-sm text-muted-foreground">
                            Administrative actions are logged for compliance and security purposes. Grades and feedback 
                            changes are tracked to maintain academic integrity.
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-2 font-medium">🛡️ Privacy Protection</h4>
                        <p className="text-sm text-muted-foreground">
                            Student submissions and personal information are never used to train AI models. 
                            Data is stored securely and only accessible to authorized users.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Policy */}
            <Card>
                <CardHeader>
                    <CardTitle>Privacy & Data Rights</CardTitle>
                    <CardDescription>User data handling and rights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="mb-2 font-medium">📥 Data Collection</p>
                        <p className="text-muted-foreground">
                            We collect only the necessary information for platform operation: user identity, course enrollment, 
                            assignments, and grades.
                        </p>
                    </div>
                    <div>
                        <p className="mb-2 font-medium">🔄 Data Usage</p>
                        <p className="text-muted-foreground">
                            Data is used solely for educational purposes. Student work and submissions are never 
                            shared with third parties without explicit consent.
                        </p>
                    </div>
                    <div>
                        <p className="mb-2 font-medium">🗑️ Data Deletion</p>
                        <p className="text-muted-foreground">
                            Users can request data export or deletion. Admins can permanently delete user accounts 
                            and associated data through the user management interface.
                        </p>
                    </div>
                    <div>
                        <p className="mb-2 font-medium">📑 Data Retention</p>
                        <p className="text-muted-foreground">
                            Educational records are retained according to institutional policies. Users can request 
                            data deletion at any time.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Security Contacts */}
            <Card>
                <CardHeader>
                    <CardTitle>Security & Support</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Button variant="outline" asChild className="justify-start">
                            <Link href="/help">
                                📚 View Security Documentation
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start">
                            <Link href="/admin/admin-settings">
                                ⚙️ Back to Admin Settings
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}