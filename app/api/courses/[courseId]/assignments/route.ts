import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const session = await requireSession();
    const body = await req.json();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ensure course belongs to instructor
    const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.id },
        select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "Course not found/forbidden" }, { status: 404 });

    const assignment = await prisma.assignment.create({
        data: {
            courseId: course.id,
            title: body.title,
            type: body.type ?? "OTHER",
            instructions: body.instructions ?? null,
            points: body.points ?? 100,
            dueAt: body.dueAt ? new Date(body.dueAt) : null,
        },
    });

    return NextResponse.json({ assignment }, { status: 201 });
}

// GET /api/courses/:id/assignments
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this course (instructor or enrolled student)
    const course = await prisma.course.findFirst({
        where: {
            id: courseId,
            OR: [
                { instructorId: user.id }, // User is instructor
                { enrollments: { some: { userId: user.id } } }, // User is enrolled
                ...(user.role === UserRole.ADMIN ? [{}] : []), // Admin access
            ],
        },
    });

    if (!course) {
        return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    const assignments = await prisma.assignment.findMany({
        where: { courseId: courseId },
        orderBy: { createdAt: "desc" },
        include: {
            submissions: {
                where: { studentId: user.id }, // Only include user's own submissions
                select: {
                    id: true,
                    status: true,
                    submittedAt: true,
                    grade: true,
                },
            },
            _count: {
                select: { submissions: true },
            },
        },
    });

    return NextResponse.json({ assignments });
}