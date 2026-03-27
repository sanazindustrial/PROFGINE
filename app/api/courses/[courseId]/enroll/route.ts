import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

interface RouteParams {
    params: Promise<{
        courseId: string;
    }>;
}

// POST /api/courses/:id/enroll
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if course exists
    const course = await prisma.course.findUnique({
        where: { id: courseId },
    });

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
            userId: user.id,
            courseId: courseId,
        },
    });

    if (existingEnrollment) {
        return NextResponse.json({ error: "Already enrolled in this course" }, { status: 409 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
        data: {
            userId: user.id,
            courseId: courseId,
        },
        include: {
            course: { select: { title: true, code: true } },
            user: { select: { name: true, email: true } },
        },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
    } catch (error: any) {
        if (error?.message === 'Not authenticated') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        console.error('[POST /api/courses/:id/enroll]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/courses/:id/unenroll
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if enrolled
    const enrollment = await prisma.enrollment.findFirst({
        where: {
            userId: user.id,
            courseId: courseId,
        },
    });

    if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled in this course" }, { status: 404 });
    }

    // Remove enrollment
    await prisma.enrollment.deleteMany({
        where: {
            userId: user.id,
            courseId: courseId,
        },
    });

    return NextResponse.json({ message: "Successfully unenrolled from course" });
    } catch (error: any) {
        if (error?.message === 'Not authenticated') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        console.error('[DELETE /api/courses/:id/enroll]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}