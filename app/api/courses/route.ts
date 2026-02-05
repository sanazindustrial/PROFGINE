import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const courses = await prisma.course.findMany({
    where: user.role === UserRole.ADMIN ? undefined : { instructorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.create({
    data: {
      title: body.title,
      code: body.code ?? null,
      term: body.term ?? null,
      description: body.description ?? null,
      instructorId: user.id,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}