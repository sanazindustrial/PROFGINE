import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        gradeId: string;
    }>;
}

// PUT /api/grades/:id (regrade)
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { gradeId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructors and admins can update grades
    if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if grade exists and user has permission
    const existingGrade = await prisma.grade.findFirst({
        where: {
            id: gradeId,
            submission: {
                assignment: {
                    course: {
                        OR: [
                            { instructorId: user.id },
                            ...(user.role === UserRole.ADMIN ? [{}] : []),
                        ],
                    },
                },
            },
        },
        include: {
            submission: {
                include: {
                    assignment: { select: { title: true, points: true } },
                    student: { select: { name: true } },
                },
            },
        },
    });

    if (!existingGrade) {
        return NextResponse.json({ error: "Grade not found or access denied" }, { status: 404 });
    }

    const updatedGrade = await prisma.grade.update({
        where: { id: gradeId },
        data: {
            score: body.score ?? existingGrade.score,
            feedback: body.feedback ?? existingGrade.feedback,
            graderId: user.id, // Update the grader to current user
        },
        include: {
            grader: { select: { name: true, role: true } },
            submission: {
                include: {
                    assignment: { select: { title: true } },
                    student: { select: { name: true } },
                },
            },
        },
    });

    return NextResponse.json({
        message: "Grade updated successfully",
        grade: updatedGrade
    });
}