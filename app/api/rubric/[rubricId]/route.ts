import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        rubricId: string;
    }>;
}

// PUT /api/rubric/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { rubricId } = await params;
    const body = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only instructor or admin can update rubrics
    const rubric = await prisma.rubric.findFirst({
        where: {
            id: rubricId,
            assignment: {
                course: {
                    OR: [
                        { instructorId: user.id },
                        ...(user.role === UserRole.ADMIN ? [{}] : []),
                    ],
                },
            },
        },
    });

    if (!rubric) {
        return NextResponse.json({ error: "Rubric not found or access denied" }, { status: 404 });
    }

    const updatedRubric = await prisma.rubric.update({
        where: { id: rubricId },
        data: {
            // Update rubric here - the criteria need to be handled separately
        },
    });

    return NextResponse.json({ rubric: updatedRubric });
}