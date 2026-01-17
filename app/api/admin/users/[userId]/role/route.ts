import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

// POST /api/admin/users/:id/role
export async function POST(req: NextRequest, { params }: RouteParams) {
    const session = await requireSession();
    const { userId } = await params;
    const body = await req.json();

    const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Validate role
    const validRoles = [UserRole.ADMIN, UserRole.PROFESSOR, UserRole.STUDENT];
    // Validate the incoming role value exists and is of correct type
    if (!body.role || typeof body.role !== 'string') {
        return NextResponse.json({ error: "Role is required and must be a string" }, { status: 400 });
    }
    if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: body.role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({
        message: "User role updated successfully",
        user: updatedUser
    });
}