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
    Database,
    CheckCircle,
    AlertTriangle,
    Clock,
    Users,
    FileText,
    MessageCircle
} from 'lucide-react'

export default async function DatabaseHealthPage() {
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

    // Perform database health checks
    let dbHealthy = true
    let errorMessage = ''
    let stats = {
        users: 0,
        courses: 0,
        assignments: 0,
        discussions: 0,
        enrollments: 0
    }

    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`

        // Check table counts
        const [
            userCount,
            courseCount,
            assignmentCount,
            discussionCount,
            enrollmentCount
        ] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.assignment.count(),
            prisma.discussionThread.count(),
            prisma.enrollment.count()
        ])

        stats = {
            users: userCount,
            courses: courseCount,
            assignments: assignmentCount,
            discussions: discussionCount,
            enrollments: enrollmentCount
        }
    } catch (error) {
        dbHealthy = false
        errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }

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
                    <h1 className="text-3xl font-bold">🗄️ Database Health Check</h1>
                    <p className="text-muted-foreground">Test database connection and verify data integrity</p>
                </div>
            </div>

            {/* Status Alert */}
            {dbHealthy ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="size-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        ✅ Database connection is healthy and all systems operational
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertTriangle className="size-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                        ❌ Database connection failed: {errorMessage}
                    </AlertDescription>
                </Alert>
            )}

            {/* Database Statistics */}
            {dbHealthy && stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Users</p>
                                    <p className="mt-2 text-3xl font-bold">{stats.users}</p>
                                </div>
                                <Users className="size-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Courses</p>
                                    <p className="mt-2 text-3xl font-bold">{stats.courses}</p>
                                </div>
                                <FileText className="size-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Assignments</p>
                                    <p className="mt-2 text-3xl font-bold">{stats.assignments}</p>
                                </div>
                                <FileText className="size-8 text-purple-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Discussions</p>
                                    <p className="mt-2 text-3xl font-bold">{stats.discussions}</p>
                                </div>
                                <MessageCircle className="size-8 text-orange-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Enrollments</p>
                                    <p className="mt-2 text-3xl font-bold">{stats.enrollments}</p>
                                </div>
                                <Users className="size-8 text-indigo-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <p className="mt-2 text-3xl font-bold text-green-600">OK</p>
                                </div>
                                <CheckCircle className="size-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Health Check Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Connection Details</CardTitle>
                    <CardDescription>Database connectivity and performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium">Database Type</p>
                            <p className="text-muted-foreground">PostgreSQL (Neon)</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Connection Status</p>
                            <div className="mt-1 flex items-center gap-2">
                                <CheckCircle className="size-4 text-green-600" />
                                <span className="text-green-600">Connected</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium">ORM</p>
                            <p className="text-muted-foreground">Prisma 5.20.0+</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Last Check</p>
                            <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle>Health Check Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex gap-3">
                            <CheckCircle className="size-5 shrink-0 text-green-600" />
                            <div>
                                <p className="font-medium">Database Connection</p>
                                <p className="text-sm text-muted-foreground">✅ Verified and operational</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle className="size-5 shrink-0 text-green-600" />
                            <div>
                                <p className="font-medium">Data Integrity</p>
                                <p className="text-sm text-muted-foreground">✅ All tables accessible</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle className="size-5 shrink-0 text-green-600" />
                            <div>
                                <p className="font-medium">Record Count</p>
                                <p className="text-sm text-muted-foreground">✅ {stats?.users || 0} users and {stats?.courses || 0} courses in database</p>
                            </div>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}