import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        submissionId: string;
    }>;
}

// GET /api/submissions/:id
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { submissionId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this submission
    const submission = await prisma.submission.findFirst({
        where: {
            id: submissionId,
            OR: [
                { studentId: user.id }, // Own submission
                { assignment: { course: { instructorId: user.id } } }, // Instructor access
                ...(user.role === UserRole.ADMIN ? [{}] : []), // Admin access
            ],
        },
        include: {
            assignment: {
                include: {
                    course: { select: { title: true, instructor: { select: { name: true } } } },
                    rubric: true,
                },
            },
            student: { select: { id: true, name: true, email: true } },
            grade: {
                include: { grader: { select: { name: true, role: true } } },
            },
        },
    });

    if (!submission) {
        return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ submission });
}

// PUT /api/submissions/:id (student update draft)
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { submissionId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only student can update their own draft submission
    const submission = await prisma.submission.findFirst({
        where: {
            id: submissionId,
            studentId: user.id,
            status: { in: ["DRAFT", "SUBMITTED"] },
        },
    });

    if (!submission) {
        return NextResponse.json(
            { error: "Submission not found, access denied, or submission is finalized" },
            { status: 404 }
        );
    }

    const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
            contentText: body.content ?? submission.contentText,
            fileUrl: body.fileUrl ?? submission.fileUrl,
            status: body.status ?? submission.status,
            submittedAt: body.status === "SUBMITTED" ? new Date() : submission.submittedAt,
        },
        include: {
            assignment: { select: { title: true, points: true } },
            student: { select: { name: true, email: true } },
        },
    });

    return NextResponse.json({ submission: updatedSubmission });
}