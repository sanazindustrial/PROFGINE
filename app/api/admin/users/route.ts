import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { SubscriptionType, UserRole } from "@prisma/client";

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

// POST /api/admin/users - Create a new user manually
export async function POST(req: NextRequest) {
    try {
        const adminUser = await requireOwnerAdmin();
        if (!adminUser) {
            return NextResponse.json({ error: "Owner admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { email, name, role, isOwner, subscriptionType } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existing) {
            return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
        }

        // Validate role
        const validRoles = Object.values(UserRole);
        const userRole = role && validRoles.includes(role) ? (role as UserRole) : UserRole.PROFESSOR;

        // Validate subscription type
        const validSubTypes = Object.values(SubscriptionType);
        const subType = subscriptionType && validSubTypes.includes(subscriptionType)
            ? (subscriptionType as SubscriptionType)
            : SubscriptionType.FREE;

        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: name?.trim() || null,
                role: userRole,
                isOwner: isOwner === true,
                subscriptionType: subType,
                // Give unlimited credits to owners
                creditBalance: isOwner === true ? 999999 : 0,
                monthlyCredits: isOwner === true ? 999999 : 0,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isOwner: true,
                subscriptionType: true,
                subscriptionExpiresAt: true,
                trialExpiresAt: true,
                creditBalance: true,
                monthlyCredits: true,
            },
        });

        console.log(`✅ User created manually by ${adminUser.id}: ${newUser.email} (${newUser.role}${newUser.isOwner ? ", OWNER" : ""})`);

        return NextResponse.json({
            message: "User created successfully",
            user: {
                ...newUser,
                subscriptionExpiresAt: newUser.subscriptionExpiresAt?.toISOString() || null,
                trialExpiresAt: newUser.trialExpiresAt?.toISOString() || null,
                subscriptionTier: null,
                subscriptionStatus: null,
                currentPeriodEnd: null,
            },
        }, { status: 201 });
    } catch (error: any) {
        if (error?.message === "Not authenticated") {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        console.error("[POST /api/admin/users]", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
