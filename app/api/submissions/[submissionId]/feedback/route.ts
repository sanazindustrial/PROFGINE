import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        submissionId: string;
    }>;
}

// POST /api/submissions/:id/feedback
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { submissionId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to provide feedback on this submission
    const submission = await prisma.submission.findFirst({
        where: {
            id: submissionId,
            OR: [
                { assignment: { course: { instructorId: user.id } } }, // Instructor
                ...(user.role === UserRole.ADMIN ? [{}] : []), // Admin
            ],
        },
        include: {
            assignment: { select: { title: true } },
            student: { select: { name: true } },
        },
    });

    if (!submission) {
        return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    // Store feedback in the grade record instead since feedback model doesn't exist
    const grade = await prisma.grade.upsert({
        where: { submissionId },
        create: {
            submissionId,
            graderId: user.id,
            score: 0, // Default score
            feedback: body.content,
        },
        update: {
            feedback: body.content,
        },
        include: {
            grader: { select: { name: true, role: true } },
        },
    });

    return NextResponse.json({ feedback: grade.feedback, author: grade.grader }, { status: 201 });
}

// GET /api/submissions/:id/feedback
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { submissionId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to view feedback
    const submission = await prisma.submission.findFirst({
        where: {
            id: submissionId,
            OR: [
                { studentId: user.id }, // Own submission
                { assignment: { course: { instructorId: user.id } } }, // Instructor access
                ...(user.role === UserRole.ADMIN ? [{}] : []), // Admin access
            ],
        },
    });

    if (!submission) {
        return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    // Get feedback from the grade record
    const grade = await prisma.grade.findUnique({
        where: { submissionId },
        include: {
            grader: { select: { name: true, role: true } },
        },
    });

    return NextResponse.json({ feedback: grade?.feedback || null, grader: grade?.grader || null });
}