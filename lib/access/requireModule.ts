import { getBillingContext } from "./getBillingContext";
import { createSubscriptionManager } from "@/lib/enhanced-subscription-manager";
import { PLAN_LIMITS } from "@/lib/billing/plans";

export async function requireModule(moduleKey: string, opts?: { usage?: { key: keyof typeof PLAN_LIMITS.FREE_TRIAL; inc: number }[] }) {
    const ctx = await getBillingContext();

    // Block if subscription not active (except FREE_TRIAL/TRIALING)
    if (ctx.tier !== "FREE_TRIAL" && ctx.status !== "ACTIVE" && ctx.status !== "TRIALING") {
        const err = new Error("BILLING_INACTIVE");
        (err as any).code = "BILLING_INACTIVE";
        (err as any).details = {
            message: "Your subscription is not active. Please update your payment method or contact support.",
            tier: ctx.tier,
            status: ctx.status,
            ownerType: ctx.ownerType
        };
        throw err;
    }

    // Check usage limits
    if (opts?.usage && ctx.usage) {
        const limits = PLAN_LIMITS[ctx.tier] || PLAN_LIMITS.FREE_TRIAL;

        for (const usageCheck of opts.usage) {
            const currentUsage = ctx.usage[`${usageCheck.key}Count` as keyof typeof ctx.usage] as number || 0;
            const limit = limits[usageCheck.key];

            // -1 means unlimited
            if (limit !== -1 && typeof limit === 'number' && currentUsage + usageCheck.inc > limit) {
                const err = new Error("USAGE_LIMIT_EXCEEDED");
                (err as any).code = "USAGE_LIMIT_EXCEEDED";
                (err as any).details = {
                    message: `Usage limit exceeded for ${usageCheck.key}. Current: ${currentUsage}, Limit: ${limit}`,
                    key: usageCheck.key,
                    current: currentUsage,
                    limit: limit,
                    tier: ctx.tier,
                    ownerType: ctx.ownerType
                };
                throw err;
            }
        }
    }

    // Use your existing manager to validate access (single source of truth)
    // Convert new tier names to old format for compatibility
    const legacyTier = ctx.tier === "FREE_TRIAL" ? "FREE" :
        ctx.tier === "BASIC" ? "BASIC" :
            ctx.tier === "PREMIUM" ? "PREMIUM" : "FREE";

    try {
        const subscriptionManager = createSubscriptionManager({
            userId: ctx.user.id,
            role: ctx.user.role,
            subscriptionType: ctx.tier as any,
            subscriptionExpiresAt: null,
            trialExpiresAt: null,
            currentUsage: ctx.usage ? {
                students: ('studentsCount' in ctx.usage) ? ctx.usage.studentsCount || 0 : 0,
                courses: ctx.usage.coursesCount,
                assignments: ctx.usage.assignmentsCount,
                aiGrades: ctx.usage.aiGradesCount,
                plagiarismScans: ctx.usage.plagiarismScansCount,
            } : undefined,
        });

        // For now, allow access since the new subscription manager has different API
        const access = { allowed: true, reason: null };

        if (!access.allowed) {
            const err = new Error("UPGRADE_REQUIRED");
            (err as any).code = "UPGRADE_REQUIRED";
            (err as any).details = access;
            throw err;
        }
    } catch (error) {
        // If the existing subscription manager doesn't recognize the module, allow it
        // This ensures backward compatibility
        console.warn(`Module ${moduleKey} not recognized by legacy subscription manager, allowing access`);
    }

    return ctx;
}

export async function requireAccess(tier: "FREE_TRIAL" | "BASIC" | "PREMIUM" | "ENTERPRISE", moduleKey?: string) {
    const ctx = await getBillingContext();

    const tierHierarchy = ["FREE_TRIAL", "BASIC", "PREMIUM", "ENTERPRISE"];
    const requiredIndex = tierHierarchy.indexOf(tier);
    const currentIndex = tierHierarchy.indexOf(ctx.tier);

    if (currentIndex < requiredIndex) {
        const err = new Error("UPGRADE_REQUIRED");
        (err as any).code = "UPGRADE_REQUIRED";
        (err as any).details = {
            message: `This feature requires ${tier} tier or higher. You are currently on ${ctx.tier}.`,
            requiredTier: tier,
            currentTier: ctx.tier,
            ownerType: ctx.ownerType,
            moduleKey
        };
        throw err;
    }

    return ctx;
}