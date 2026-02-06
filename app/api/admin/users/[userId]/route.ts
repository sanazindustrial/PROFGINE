import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { SubscriptionStatus, SubscriptionTier, SubscriptionType, UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
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

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const adminUser = await requireOwnerAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Owner admin access required" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json();

  const updates: any = {};

  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.role === "string" && Object.values(UserRole).includes(body.role)) {
    updates.role = body.role as UserRole;
  }
  if (typeof body.isOwner === "boolean") updates.isOwner = body.isOwner;
  if (typeof body.subscriptionType === "string" && Object.values(SubscriptionType).includes(body.subscriptionType)) {
    updates.subscriptionType = body.subscriptionType as SubscriptionType;
  }
  if (typeof body.subscriptionExpiresAt === "string" || body.subscriptionExpiresAt === null) {
    updates.subscriptionExpiresAt = body.subscriptionExpiresAt ? new Date(body.subscriptionExpiresAt) : null;
  }
  if (typeof body.trialExpiresAt === "string" || body.trialExpiresAt === null) {
    updates.trialExpiresAt = body.trialExpiresAt ? new Date(body.trialExpiresAt) : null;
  }
  if (typeof body.creditBalance === "number") updates.creditBalance = body.creditBalance;
  if (typeof body.monthlyCredits === "number") updates.monthlyCredits = body.monthlyCredits;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
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

  if (body.subscriptionTier || body.subscriptionStatus || body.currentPeriodEnd || body.currentPeriodEnd === null) {
    const tier = Object.values(SubscriptionTier).includes(body.subscriptionTier)
      ? (body.subscriptionTier as SubscriptionTier)
      : SubscriptionTier.FREE_TRIAL;
    const status = Object.values(SubscriptionStatus).includes(body.subscriptionStatus)
      ? (body.subscriptionStatus as SubscriptionStatus)
      : SubscriptionStatus.TRIALING;
    const currentPeriodEnd = body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null;

    await prisma.userSubscription.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        tier,
        status,
        currentPeriodEnd: currentPeriodEnd ?? undefined,
      },
      update: {
        tier,
        status,
        currentPeriodEnd: currentPeriodEnd ?? undefined,
      },
    });
  }

  return NextResponse.json({
    message: "User updated",
    user: updatedUser,
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const adminUser = await requireOwnerAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Owner admin access required" }, { status: 403 });
  }

  const { userId } = await params;

  if (adminUser.id === userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ message: "User deleted" });
}import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await requireSession()

        // Only allow ADMIN role
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { userId } = await params

        // Prevent admin from deleting themselves
        if (userId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            )
        }

        // Delete user (cascade will handle related records)
        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({
            success: true,
            message: "User deleted successfully"
        })
    } catch (error) {
        console.error("User deletion error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
