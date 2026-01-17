import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// GET /api/admin/audit-log
export async function GET(req: NextRequest) {
    const session = await requireSession();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // For now, return recent activity from various tables
    // You might want to create a dedicated audit log table in production
    const recentActivity = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    courses: true,
                    enrollments: true,
                    submissions: true,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
    });

    const totalUsers = await prisma.user.count();

    return NextResponse.json({
        activity: recentActivity,
        pagination: {
            page,
            limit,
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit),
        },
    });
}