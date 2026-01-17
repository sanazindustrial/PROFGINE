import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        courseId: string;
    }>;
}

// POST /api/courses/:id/discussions
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { courseId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this course
    const course = await prisma.course.findFirst({
        where: {
            id: courseId,
            OR: [
                { instructorId: user.id }, // Instructor
                { enrollments: { some: { userId: user.id } } }, // Enrolled student
                ...(user.role === UserRole.ADMIN ? [{}] : []), // Admin
            ],
        },
    });

    if (!course) {
        return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    const discussion = await prisma.discussionThread.create({
        data: {
            courseId,
            title: body.title,
            prompt: body.content,
        },
        include: {
            course: { select: { title: true } },
            _count: { select: { posts: true } },
        },
    });

    return NextResponse.json({ discussion }, { status: 201 });
}

// GET /api/courses/:id/discussions
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this course
    const course = await prisma.course.findFirst({
        where: {
            id: courseId,
            OR: [
                { instructorId: user.id },
                { enrollments: { some: { userId: user.id } } },
                ...(user.role === UserRole.ADMIN ? [{}] : []),
            ],
        },
    });

    if (!course) {
        return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    const discussions = await prisma.discussionThread.findMany({
        where: { courseId },
        include: {
            posts: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                    author: { select: { name: true, role: true } },
                },
            },
            _count: { select: { posts: true } },
        },
    });

    return NextResponse.json({ discussions });
}