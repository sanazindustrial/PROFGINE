import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        assignmentId: string;
    }>;
}

// GET /api/assignments/:id/submissions
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { assignmentId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructor or admin can view all submissions
    const assignment = await prisma.assignment.findFirst({
        where: {
            id: assignmentId,
            course: {
                OR: [
                    { instructorId: user.id },
                    ...(user.role === UserRole.ADMIN ? [{}] : []),
                ],
            },
        },
    });

    if (!assignment) {
        return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
        where: { assignmentId },
        include: {
            student: { select: { id: true, name: true, email: true } },
            grade: {
                include: { grader: { select: { name: true } } },
            },
            // feedbacks: {
            //     orderBy: { createdAt: "desc" },
            //     include: { author: { select: { name: true, role: true } } },
            // },
        },
        orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ submissions });
}