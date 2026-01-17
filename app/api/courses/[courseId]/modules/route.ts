import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        courseId: string;
    }>;
}

// POST /api/courses/:id/modules
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { courseId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user is instructor or admin
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

    // Get the next weekNo
    const lastModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { weekNo: "desc" },
    });

    const nextWeekNo = lastModule?.weekNo ? lastModule.weekNo + 1 : 1;

    const createdModule = await prisma.module.create({
        data: {
            title: body.title,
            content: body.description,
            weekNo: body.weekNo ?? nextWeekNo,
            courseId: courseId,
        },
    });

    return NextResponse.json({ module: createdModule }, { status: 201 });
}

// GET /api/courses/:id/modules
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check access to course
    const course = await prisma.course.findFirst({
        where: {
            id: courseId,
            OR: [
                { instructorId: user.id },
                { enrollments: { some: { userId: user.id } } },
                ...(user.role === "ADMIN" ? [{}] : []),
            ],
        },
    });

    if (!course) {
        return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    const modules = await prisma.module.findMany({
        where: { courseId },
        orderBy: { weekNo: "asc" },
    });

    return NextResponse.json({ modules });
}