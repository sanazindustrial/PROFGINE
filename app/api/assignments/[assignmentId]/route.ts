import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        assignmentId: string;
    }>;
}

// GET /api/assignments/:id
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
                    { instructorId: user.id }, // User is instructor
                    { enrollments: { some: { userId: user.id } } }, // User is enrolled
                    ...(user.role === UserRole.ADMIN ? [{}] : []), // Admin access
                ],
            },
        },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    instructor: { select: { name: true, email: true } },
                },
            },
            rubric: true,
            submissions: {
                where: { studentId: user.id }, // Only user's own submissions
                include: {
                    grade: true,
                    // feedbacks: {
                    //     orderBy: { createdAt: "desc" },
                    //     include: { author: { select: { name: true, role: true } } },
                    // },
                },
            },
            _count: { select: { submissions: true } },
        },
    });

    if (!assignment) {
        return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ assignment });
}

// PUT /api/assignments/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { assignmentId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructor or admin can update assignments
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

    const updatedAssignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
            title: body.title,
            type: body.type,
            instructions: body.instructions,
            points: body.points,
            dueAt: body.dueAt ? new Date(body.dueAt) : null,
        },
        include: {
            course: { select: { title: true } },
            rubric: true,
        },
    });

    return NextResponse.json({ assignment: updatedAssignment });
}

// DELETE /api/assignments/:id
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { assignmentId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructor or admin can delete assignments
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

    await prisma.assignment.delete({
        where: { id: assignmentId },
    });

    return NextResponse.json({ message: "Assignment deleted successfully" });
}