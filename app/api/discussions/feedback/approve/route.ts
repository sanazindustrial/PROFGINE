import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// POST /api/discussions/feedback/approve - Bulk approve feedback
export async function POST(req: NextRequest) {
    try {
        const session = await requireSession();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { feedbackIds, action = "approve" } = await req.json();

        if (!Array.isArray(feedbackIds) || feedbackIds.length === 0) {
            return NextResponse.json({ error: "feedbackIds array is required" }, { status: 400 });
        }

        // Verify professor owns all feedback items
        const feedbackItems = await prisma.discussionFeedback.findMany({
            where: {
                id: { in: feedbackIds },
            },
            include: {
                post: {
                    include: {
                        thread: {
                            include: {
                                course: { select: { instructorId: true } }
                            }
                        }
                    }
                }
            }
        });

        // Check ownership for non-admin users
        if (user.role !== UserRole.ADMIN) {
            const unauthorizedItems = feedbackItems.filter(
                f => f.post.thread.course.instructorId !== user.id
            );

            if (unauthorizedItems.length > 0) {
                return NextResponse.json({
                    error: "You can only approve feedback for your own courses"
                }, { status: 403 });
            }
        }

        const isApproved = action === "approve";
        const approvedAt = isApproved ? new Date() : null;

        // Update all feedback items
        const result = await prisma.discussionFeedback.updateMany({
            where: { id: { in: feedbackIds } },
            data: {
                isApproved,
                approvedAt,
                // Set final feedback to AI feedback if not already edited
                finalFeedback: undefined // Keep existing
            }
        });

        // Set finalFeedback for items that don't have it
        for (const item of feedbackItems) {
            if (!item.finalFeedback) {
                await prisma.discussionFeedback.update({
                    where: { id: item.id },
                    data: {
                        finalFeedback: item.professorEdits || item.aiFeedback,
                        finalScore: item.finalScore || item.aiScore
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            action,
            updated: result.count,
            message: `${result.count} feedback items ${isApproved ? 'approved' : 'unapproved'}`
        });

    } catch (error: any) {
        console.error("Bulk approve error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/discussions/feedback/approve - Get all pending approvals
export async function GET(req: NextRequest) {
    try {
        const session = await requireSession();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get pending feedback for professor's courses
        const pendingFeedback = await prisma.discussionFeedback.findMany({
            where: {
                isApproved: false,
                post: {
                    thread: {
                        course: {
                            OR: [
                                { instructorId: user.id },
                                ...(user.role === UserRole.ADMIN ? [{}] : [])
                            ]
                        }
                    }
                }
            },
            include: {
                post: {
                    include: {
                        author: { select: { name: true, email: true } },
                        thread: {
                            include: {
                                course: { select: { id: true, title: true, code: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Group by thread
        const groupedByThread = pendingFeedback.reduce((acc, feedback) => {
            const threadId = feedback.post.thread.id;
            if (!acc[threadId]) {
                acc[threadId] = {
                    thread: {
                        id: feedback.post.thread.id,
                        title: feedback.post.thread.title,
                        course: feedback.post.thread.course
                    },
                    feedbackItems: []
                };
            }
            acc[threadId].feedbackItems.push({
                id: feedback.id,
                postId: feedback.postId,
                studentName: feedback.post.author.name,
                studentPost: feedback.post.body.substring(0, 200) + (feedback.post.body.length > 200 ? '...' : ''),
                aiFeedback: feedback.aiFeedback,
                aiScore: feedback.aiScore,
                aiStrengths: feedback.aiStrengths,
                aiImprovements: feedback.aiImprovements,
                createdAt: feedback.createdAt
            });
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({
            pending: Object.values(groupedByThread),
            totalPending: pendingFeedback.length
        });

    } catch (error: any) {
        console.error("Get pending approvals error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
