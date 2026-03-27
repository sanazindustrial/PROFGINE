import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET /api/courses/:id
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { instructorId: user.id },
          { enrollments: { some: { userId: user.id } } },
          { instructor: { role: "ADMIN" } },
        ],
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        modules: { orderBy: { weekNo: "asc" } },
        assignments: { orderBy: { createdAt: "desc" } },
        enrollments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Course GET error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PUT /api/courses/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { courseId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: body.title,
        code: body.code,
        term: body.term,
        description: body.description,
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ course: updatedCourse });
  } catch (error) {
    console.error("Course PUT error:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/courses/:id
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { courseId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Course DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}