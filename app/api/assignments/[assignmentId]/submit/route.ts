import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        assignmentId: string;
    }>;
}

// POST /api/assignments/:id/submit
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { assignmentId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if assignment exists and user has access
    const assignment = await prisma.assignment.findFirst({
        where: {
            id: assignmentId,
            course: {
                enrollments: { some: { userId: user.id } },
            },
        },
        include: { course: true },
    });

    if (!assignment) {
        return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    // Check if submission already exists for this user
    const existingSubmission = await prisma.submission.findFirst({
        where: {
            assignmentId,
            studentId: user.id,
        },
    });

    if (existingSubmission) {
        // Update existing submission
        const updatedSubmission = await prisma.submission.update({
            where: { id: existingSubmission.id },
            data: {
                contentText: body.content,
                fileUrl: body.fileUrl,
                submittedAt: new Date(),
                status: "SUBMITTED",
            },
            include: {
                assignment: { select: { title: true, points: true } },
                student: { select: { name: true, email: true } },
            },
        });

        return NextResponse.json({ submission: updatedSubmission });
    } else {
        // Create new submission
        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId: user.id,
                contentText: body.content,
                fileUrl: body.fileUrl,
                submittedAt: new Date(),
                status: "SUBMITTED",
            },
            include: {
                assignment: { select: { title: true, points: true } },
                student: { select: { name: true, email: true } },
            },
        });

        return NextResponse.json({ submission }, { status: 201 });
    }
}