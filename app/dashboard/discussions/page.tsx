import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma/client';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Plus, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default async function DiscussionsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, name: true }
    });

    if (!user) {
        redirect('/auth/signin');
    }

    // Get discussions based on role
    const isProfessor = user.role === UserRole.PROFESSOR || user.role === UserRole.ADMIN;

    // Get threads based on role
    const whereClause = isProfessor
        ? {
            course: {
                OR: [
                    { instructorId: user.id },
                    ...(user.role === UserRole.ADMIN ? [{}] : [])
                ]
            }
        }
        : {
            course: {
                enrollments: {
                    some: {
                        userId: user.id
                    }
                }
            }
        };

    const threads = await prisma.discussionThread.findMany({
        where: whereClause,
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    code: true
                }
            },
            posts: {
                where: isProfessor ? {} : { authorId: user.id },
                include: {
                    feedback: {
                        select: {
                            id: true,
                            isApproved: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    posts: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const stats = threads.reduce((acc, thread) => {
        acc.totalThreads++;
        acc.totalPosts += thread._count.posts;
        thread.posts.forEach(post => {
            if (post.feedback) {
                if (post.feedback.isApproved) {
                    acc.reviewed++;
                } else {
                    acc.pendingReview++;
                }
            } else {
                acc.pendingReview++;
            }
        });
        return acc;
    }, { totalThreads: 0, totalPosts: 0, pendingReview: 0, reviewed: 0 });

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Discussion Boards</h1>
                    <p className="text-muted-foreground">
                        {isProfessor
                            ? 'Manage and review student discussion posts'
                            : 'View your discussion posts and feedback'}
                    </p>
                </div>
                {isProfessor && (
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/dashboard/discussions/review">
                                <Zap className="mr-2 h-4 w-4" />
                                Bulk AI Review
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalThreads}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPosts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingReview}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.reviewed}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Thread List */}
            <div className="space-y-4">
                {threads.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Discussion Threads</h3>
                            <p className="text-muted-foreground text-center mt-2">
                                {isProfessor
                                    ? 'Create your first discussion thread to get started.'
                                    : 'No discussions available yet. Check back later.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    threads.map(thread => {
                        const reviewedPosts = thread.posts.filter(
                            p => p.feedback?.isApproved
                        ).length;
                        const totalPosts = thread._count.posts;
                        const pendingPosts = totalPosts - reviewedPosts;

                        return (
                            <Card key={thread.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{thread.title}</CardTitle>
                                            <CardDescription>
                                                {thread.course.code && `${thread.course.code} - `}
                                                {thread.course.title}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {thread.isActive ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Closed</Badge>
                                            )}
                                            {thread.dueDate && (
                                                <Badge variant="outline">
                                                    Due: {new Date(thread.dueDate).toLocaleDateString()}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                                        {thread.prompt}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>{totalPosts} post(s)</span>
                                            {isProfessor && (
                                                <>
                                                    <span className="text-green-600">{reviewedPosts} reviewed</span>
                                                    {pendingPosts > 0 && (
                                                        <span className="text-amber-600">{pendingPosts} pending</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/dashboard/discussions/${thread.id}`}>
                                                    View Thread
                                                </Link>
                                            </Button>
                                            {isProfessor && pendingPosts > 0 && (
                                                <Button asChild size="sm">
                                                    <Link href={`/dashboard/discussions/review?thread=${thread.id}`}>
                                                        <Zap className="mr-2 h-4 w-4" />
                                                        Review Posts
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
