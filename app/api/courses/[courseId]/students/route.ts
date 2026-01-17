import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        courseId: string;
    }>;
}

// GET /api/courses/:id/students
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructor or admin can view students
    const course = await prisma.course.findFirst({
        where: {
            id: courseId,
            OR: [
                { instructorId: user.id },
                ...(user.role === "ADMIN" ? [{}] : []),
            ],
        },
    });

    if (!course) {
        return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    // Get enrolled students
    const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { user: { name: "asc" } },
    });

    const students = enrollments.map((enrollment) => ({
        ...enrollment.user,
    }));

    return NextResponse.json({ students });
}