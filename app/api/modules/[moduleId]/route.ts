import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    moduleId: string;
  }>;
}

// PUT /api/modules/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  const { moduleId } = await params;
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if user has permission to edit this module
  const courseModule = await prisma.module.findFirst({
    where: {
      id: moduleId,
      course: {
        OR: [
          { instructorId: user.id },
          ...(user.role === "ADMIN" ? [{}] : []),
        ],
      },
    },
  });

  if (!courseModule) {
    return NextResponse.json({ error: "Module not found or access denied" }, { status: 404 });
  }

  const updatedModule = await prisma.module.update({
    where: { id: moduleId },
    data: {
      title: body.title,
      content: body.content,
      weekNo: body.weekNo,
    },
  });

  return NextResponse.json({ module: updatedModule });
}

// DELETE /api/modules/:id
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await requireSession();
  const { moduleId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if user has permission to delete this module
  const courseModuleDel = await prisma.module.findFirst({
    where: {
      id: moduleId,
      course: {
        OR: [
          { instructorId: user.id },
          ...(user.role === "ADMIN" ? [{}] : []),
        ],
      },
    },
  });

  if (!courseModuleDel) {
    return NextResponse.json({ error: "Module not found or access denied" }, { status: 404 });
  }

  await prisma.module.delete({
    where: { id: moduleId },
  });

  return NextResponse.json({ message: "Module deleted successfully" });
}