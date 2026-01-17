import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function getBillingContext() {
    const session = await requireSession();
    const email = session.user.email!;
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, email: true, name: true },
    });
    if (!user) throw new Error("UNAUTHORIZED");

    // 1) Check org subscription (if user belongs to an org with active subscription)
    const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: {
            org: { include: { subscription: true, usage: true } },
        },
        orderBy: {
            org: {
                subscription: {
                    createdAt: "desc" // Get most recent org subscription
                }
            }
        }
    });

    const orgSub = membership?.org.subscription;
    if (orgSub && (orgSub.status === "ACTIVE" || orgSub.status === "TRIALING")) {
        return {
            ownerType: "ORG" as const,
            ownerId: membership!.orgId,
            user,
            tier: orgSub.tier,
            status: orgSub.status,
            usage: membership!.org.usage,
            orgRole: membership!.orgRole,
            stripeCustomerId: orgSub.stripeCustomerId,
            stripeSubscriptionId: orgSub.stripeSubscriptionId,
            currentPeriodEnd: orgSub.currentPeriodEnd,
            cancelAtPeriodEnd: orgSub.cancelAtPeriodEnd,
        };
    }

    // 2) Fall back to user subscription
    const userSub = await prisma.userSubscription.findUnique({
        where: { userId: user.id },
    });
    const userUsage = await prisma.userUsageCounter.findUnique({
        where: { userId: user.id },
    });

    if (userSub && (userSub.status === "ACTIVE" || userSub.status === "TRIALING")) {
        return {
            ownerType: "USER" as const,
            ownerId: user.id,
            user,
            tier: userSub.tier,
            status: userSub.status,
            usage: userUsage,
            stripeCustomerId: userSub.stripeCustomerId,
            stripeSubscriptionId: userSub.stripeSubscriptionId,
            currentPeriodEnd: userSub.currentPeriodEnd,
            cancelAtPeriodEnd: userSub.cancelAtPeriodEnd,
        };
    }

    // 3) Default to FREE_TRIAL for users without subscriptions
    return {
        ownerType: "USER" as const,
        ownerId: user.id,
        user,
        tier: "FREE_TRIAL" as const,
        status: "TRIALING" as const,
        usage: userUsage,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
    };
}

export type BillingContext = Awaited<ReturnType<typeof getBillingContext>>;

// Helper function to ensure user has subscription records
export async function ensureUserSubscription(userId: string) {
    // Create UserSubscription if it doesn't exist
    await prisma.userSubscription.upsert({
        where: { userId },
        create: { userId, tier: "FREE_TRIAL", status: "TRIALING" },
        update: {}, // Don't change existing subscription
    });

    // Create UserUsageCounter if it doesn't exist
    await prisma.userUsageCounter.upsert({
        where: { userId },
        create: { userId },
        update: {}, // Don't reset existing usage
    });
}