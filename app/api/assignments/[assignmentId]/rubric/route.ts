import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        assignmentId: string;
    }>;
}

// POST /api/assignments/:id/rubric
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { assignmentId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructor or admin can create rubrics
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

    const rubric = await prisma.rubric.create({
        data: {
            assignmentId,
            criteria: body.criteria, // JSON array of criteria objects
            // totalPoints: body.totalPoints, // Not in schema
        },
    });

    return NextResponse.json({ rubric }, { status: 201 });
}

// GET /api/assignments/:id/rubric
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { assignmentId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this assignment
    const assignment = await prisma.assignment.findFirst({
        where: {
            id: assignmentId,
            course: {
                OR: [
                    { instructorId: user.id },
                    { enrollments: { some: { userId: user.id } } },
                    ...(user.role === UserRole.ADMIN ? [{}] : []),
                ],
            },
        },
        include: {
            rubric: true,
        },
    });

    if (!assignment) {
        return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ rubric: assignment.rubric });
}