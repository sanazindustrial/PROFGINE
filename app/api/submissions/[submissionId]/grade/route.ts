import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
    const session = await requireSession();
    const body = await req.json();
    const { submissionId } = await params;

    const grader = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });
    if (!grader) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (grader.role !== UserRole.PROFESSOR && grader.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { assignment: { include: { course: true } } },
    });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // only the instructor of the course can grade
    if (submission.assignment.course.instructorId !== grader.id && grader.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const grade = await prisma.grade.upsert({
        where: { submissionId: submission.id },
        create: {
            submissionId: submission.id,
            graderId: grader.id,
            score: Number(body.score),
            feedback: body.feedback ?? null,
        },
        update: {
            score: Number(body.score),
            feedback: body.feedback ?? null,
            graderId: grader.id,
        },
    });

    await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "GRADED" },
    });

    return NextResponse.json({ grade }, { status: 201 });
}

// GET /api/submissions/:id/grade
export async function GET(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
    const session = await requireSession();
    const { submissionId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this grade
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
            assignment: { select: { title: true, points: true } },
            student: { select: { name: true, email: true } },
            grade: {
                include: { grader: { select: { name: true, role: true } } },
            },
        },
    });

    if (!submission) {
        return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
        submission: {
            id: submission.id,
            status: submission.status,
            assignment: submission.assignment,
            student: submission.student,
        },
        grade: submission.grade
    });
}