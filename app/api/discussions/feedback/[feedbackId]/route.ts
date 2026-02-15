import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        feedbackId: string;
    }>;
}

// GET /api/discussions/feedback/[feedbackId] - Get single feedback
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireSession();
        const { feedbackId } = await params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const feedback = await prisma.discussionFeedback.findUnique({
            where: { id: feedbackId },
            include: {
                post: {
                    include: {
                        author: { select: { id: true, name: true, email: true } },
                        thread: {
                            include: {
                                course: { select: { id: true, title: true, instructorId: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!feedback) {
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        // Check access - instructor of the course, the student, or admin
        const isInstructor = feedback.post.thread.course.instructorId === user.id;
        const isStudent = feedback.post.authorId === user.id;
        const isAdmin = user.role === UserRole.ADMIN;

        if (!isInstructor && !isStudent && !isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Students only see approved feedback
        if (isStudent && !feedback.isApproved) {
            return NextResponse.json({ error: "Feedback not yet available" }, { status: 403 });
        }

        return NextResponse.json({ feedback });

    } catch (error: any) {
        console.error("Get feedback error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/discussions/feedback/[feedbackId] - Update/edit feedback
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireSession();
        const { feedbackId } = await params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();

        // Get existing feedback
        const existingFeedback = await prisma.discussionFeedback.findUnique({
            where: { id: feedbackId },
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

        if (!existingFeedback) {
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        // Only instructor or admin can edit
        const isInstructor = existingFeedback.post.thread.course.instructorId === user.id;
        const isAdmin = user.role === UserRole.ADMIN;

        if (!isInstructor && !isAdmin) {
            return NextResponse.json({ error: "Only the course instructor can edit feedback" }, { status: 403 });
        }

        // Update feedback
        const updatedFeedback = await prisma.discussionFeedback.update({
            where: { id: feedbackId },
            data: {
                professorEdits: body.professorEdits,
                finalFeedback: body.finalFeedback || body.professorEdits || existingFeedback.aiFeedback,
                finalScore: body.finalScore !== undefined ? body.finalScore : existingFeedback.aiScore,
                isApproved: body.isApproved !== undefined ? body.isApproved : existingFeedback.isApproved,
                approvedAt: body.isApproved ? new Date() : existingFeedback.approvedAt,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            feedback: updatedFeedback
        });

    } catch (error: any) {
        console.error("Update feedback error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/discussions/feedback/[feedbackId] - Delete feedback
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireSession();
        const { feedbackId } = await params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get existing feedback
        const existingFeedback = await prisma.discussionFeedback.findUnique({
            where: { id: feedbackId },
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

        if (!existingFeedback) {
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        // Only instructor or admin can delete
        const isInstructor = existingFeedback.post.thread.course.instructorId === user.id;
        const isAdmin = user.role === UserRole.ADMIN;

        if (!isInstructor && !isAdmin) {
            return NextResponse.json({ error: "Only the course instructor can delete feedback" }, { status: 403 });
        }

        await prisma.discussionFeedback.delete({
            where: { id: feedbackId }
        });

        return NextResponse.json({
            success: true,
            message: "Feedback deleted"
        });

    } catch (error: any) {
        console.error("Delete feedback error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
