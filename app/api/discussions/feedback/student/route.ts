import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

// GET /api/discussions/feedback/student - Get student's own feedback
export async function GET(req: NextRequest) {
    try {
        const session = await requireSession();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get("courseId");
        const threadId = searchParams.get("threadId");

        // Get only approved feedback for posts authored by this student
        const feedbackQuery: any = {
            isApproved: true,
            post: {
                authorId: user.id,
            }
        };

        if (threadId) {
            feedbackQuery.post.threadId = threadId;
        }

        if (courseId) {
            feedbackQuery.post.thread = {
                courseId
            };
        }

        const myFeedback = await prisma.discussionFeedback.findMany({
            where: feedbackQuery,
            include: {
                post: {
                    select: {
                        id: true,
                        body: true,
                        createdAt: true,
                        thread: {
                            select: {
                                id: true,
                                title: true,
                                course: {
                                    select: {
                                        id: true,
                                        title: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { approvedAt: "desc" }
        });

        // Format response - hide professor edits, only show final feedback
        const formattedFeedback = myFeedback.map(f => ({
            id: f.id,
            postId: f.postId,
            thread: {
                id: f.post.thread.id,
                title: f.post.thread.title
            },
            course: f.post.thread.course,
            myPost: f.post.body.substring(0, 300) + (f.post.body.length > 300 ? '...' : ''),
            myPostDate: f.post.createdAt,
            feedback: f.finalFeedback || f.aiFeedback,
            score: f.finalScore || f.aiScore,
            strengths: f.aiStrengths,
            improvements: f.aiImprovements,
            receivedAt: f.approvedAt
        }));

        // Group by course
        const groupedByCourse = formattedFeedback.reduce((acc, f) => {
            const courseId = f.course.id;
            if (!acc[courseId]) {
                acc[courseId] = {
                    course: f.course,
                    feedback: []
                };
            }
            acc[courseId].feedback.push({
                id: f.id,
                postId: f.postId,
                thread: f.thread,
                myPost: f.myPost,
                myPostDate: f.myPostDate,
                feedback: f.feedback,
                score: f.score,
                strengths: f.strengths,
                improvements: f.improvements,
                receivedAt: f.receivedAt
            });
            return acc;
        }, {} as Record<string, any>);

        // Calculate stats
        const totalFeedback = formattedFeedback.length;
        const averageScore = totalFeedback > 0
            ? formattedFeedback.reduce((sum, f) => sum + (f.score || 0), 0) / totalFeedback
            : 0;

        return NextResponse.json({
            feedback: formattedFeedback,
            byCourse: Object.values(groupedByCourse),
            stats: {
                totalFeedback,
                averageScore: Math.round(averageScore * 10) / 10,
                coursesWithFeedback: Object.keys(groupedByCourse).length
            }
        });

    } catch (error: any) {
        console.error("Get student feedback error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
