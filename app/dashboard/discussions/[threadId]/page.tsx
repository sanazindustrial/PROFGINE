import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/prisma/client';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, MessageSquare, User, CheckCircle, Clock, Star, ThumbsUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ threadId: string }>;
}

export default async function ThreadDetailPage({ params }: PageProps) {
    const { threadId } = await params;

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

    const isProfessor = user.role === UserRole.PROFESSOR || user.role === UserRole.ADMIN;

    // Get thread with posts and feedback
    const thread = await prisma.discussionThread.findUnique({
        where: { id: threadId },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    code: true,
                    instructorId: true
                }
            },
            posts: {
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    },
                    feedback: {
                        where: isProfessor
                            ? {}
                            : { isApproved: true } // Students only see approved feedback
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!thread) {
        notFound();
    }

    // Check access
    const hasAccess = isProfessor
        ? (user.role === UserRole.ADMIN || thread.course.instructorId === user.id)
        : await prisma.enrollment.findFirst({
            where: {
                userId: user.id,
                courseId: thread.course.id
            }
        });

    if (!hasAccess) {
        redirect('/dashboard/discussions');
    }

    // Filter posts based on role
    const visiblePosts = isProfessor
        ? thread.posts
        : thread.posts.filter(p => p.authorId === user.id || p.feedback);

    return (
        <div className="container mx-auto space-y-6 py-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/discussions">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                                {thread.course.code || 'Course'}
                            </Badge>
                            {thread.isActive ? (
                                <Badge variant="default">Active</Badge>
                            ) : (
                                <Badge variant="secondary">Closed</Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold">{thread.title}</h1>
                        <p className="text-muted-foreground">{thread.course.title}</p>
                    </div>
                </div>
                {isProfessor && (
                    <Button asChild>
                        <Link href={`/dashboard/discussions/review?thread=${thread.id}`}>
                            Review Posts
                        </Link>
                    </Button>
                )}
            </div>

            {/* Thread Body */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Discussion Prompt</CardTitle>
                    {thread.dueDate && (
                        <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(thread.dueDate).toLocaleDateString()}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{thread.prompt}</p>
                </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Posts ({thread.posts.length})
                </h2>

                {visiblePosts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Posts Yet</h3>
                            <p className="text-muted-foreground mt-2">
                                {isProfessor
                                    ? 'Students have not submitted any posts yet.'
                                    : 'You have not submitted a post to this discussion.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    visiblePosts.map(post => {
                        const isOwnPost = post.authorId === user.id;
                        const feedback = post.feedback; // One-to-one relation
                        const hasFeedback = !!feedback;
                        const isApprovedFeedback = feedback?.isApproved;

                        return (
                            <Card key={post.id} className={isOwnPost ? 'border-primary/50' : ''}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={post.author.image || undefined} />
                                                <AvatarFallback>
                                                    {post.author.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{post.author.name}</span>
                                                    {isOwnPost && (
                                                        <Badge variant="secondary" className="text-xs">You</Badge>
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(post.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {isProfessor && hasFeedback && (
                                                isApprovedFeedback ? (
                                                    <Badge variant="default">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Reviewed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Pending
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Post Content */}
                                    <p className="whitespace-pre-wrap">{post.body}</p>

                                    {/* Feedback Section (visible to students if approved, always to professors) */}
                                    {hasFeedback && (isProfessor || isApprovedFeedback) && (
                                        <div className="border-t pt-4 mt-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Star className="h-4 w-4 text-amber-500" />
                                                <span className="font-medium">
                                                    {isProfessor ? 'Feedback' : 'Professor Feedback'}
                                                </span>
                                                {feedback.finalScore && (
                                                    <Badge variant="outline">
                                                        Score: {feedback.finalScore}/100
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {feedback.finalFeedback || feedback.aiFeedback}
                                                </p>

                                                {/* Strengths */}
                                                {feedback.aiStrengths && feedback.aiStrengths.length > 0 && (
                                                    <div className="pt-2">
                                                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                                                            Strengths:
                                                        </p>
                                                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                            {feedback.aiStrengths.map((s: string, i: number) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Areas for Improvement */}
                                                {feedback.aiImprovements && feedback.aiImprovements.length > 0 && (
                                                    <div className="pt-2">
                                                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                                                            Areas for Improvement:
                                                        </p>
                                                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                            {feedback.aiImprovements.map((s: string, i: number) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pending feedback indicator for students */}
                                    {!isProfessor && isOwnPost && !hasFeedback && (
                                        <div className="border-t pt-4 mt-4">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-sm">
                                                    Awaiting professor feedback
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
