import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
    params: Promise<{ userId: string }>;
}

async function requireOwnerAdmin() {
    const session = await requireSession();
    const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true, isOwner: true },
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN || !adminUser.isOwner) {
        return null;
    }

    return adminUser;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
    const adminUser = await requireOwnerAdmin();
    if (!adminUser) {
        return NextResponse.json({ error: "Owner admin access required" }, { status: 403 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            creditBalance: true,
            monthlyCredits: true,
            creditTransactions: {
                orderBy: { createdAt: "desc" },
                take: 30,
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const monthlyUsage = await prisma.creditTransaction.groupBy({
        by: ["featureType"],
        where: {
            userId: user.id,
            amount: { lt: 0 },
            createdAt: { gte: currentMonthStart },
        },
        _sum: { amount: true },
    });

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            creditBalance: user.creditBalance,
            monthlyCredits: user.monthlyCredits,
        },
        monthlyUsage: monthlyUsage.map((usage) => ({
            feature: usage.featureType,
            used: Math.abs(usage._sum.amount || 0),
        })),
        recentTransactions: user.creditTransactions,
    });
}
