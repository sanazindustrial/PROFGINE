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
        { instructor: { role: "ADMIN" } }, // Admin access
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
}

// PUT /api/courses/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
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
}

// DELETE /api/courses/:id
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  const { courseId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only instructor or admin can delete
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
}