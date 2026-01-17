import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        discussionId: string;
    }>;
}

// POST /api/discussions/:id/posts
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { discussionId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this discussion
    const discussion = await prisma.discussionThread.findFirst({
        where: {
            id: discussionId,
            course: {
                OR: [
                    { instructorId: user.id },
                    { enrollments: { some: { userId: user.id } } },
                    ...(user.role === UserRole.ADMIN ? [{}] : []),
                ],
            },
        },
    });

    if (!discussion) {
        return NextResponse.json({ error: "Discussion not found or access denied" }, { status: 404 });
    }

    const post = await prisma.discussionPost.create({
        data: {
            threadId: discussionId,
            authorId: user.id,
            body: body.content,
        },
        include: {
            author: { select: { name: true, role: true } },
        },
    });

    return NextResponse.json({ post }, { status: 201 });
}

// GET /api/discussions/:id/posts
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { discussionId } = await params;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user has access to this discussion
    const discussion = await prisma.discussionThread.findFirst({
        where: {
            id: discussionId,
            course: {
                OR: [
                    { instructorId: user.id },
                    { enrollments: { some: { userId: user.id } } },
                    ...(user.role === UserRole.ADMIN ? [{}] : []),
                ],
            },
        },
        include: {
            course: { select: { title: true } },
        },
    });

    if (!discussion) {
        return NextResponse.json({ error: "Discussion not found or access denied" }, { status: 404 });
    }

    const posts = await prisma.discussionPost.findMany({
        where: { threadId: discussionId },
        include: {
            author: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
        discussion: {
            id: discussion.id,
            title: discussion.title,
            prompt: discussion.prompt,
            course: discussion.course,
        },
        posts
    });
}