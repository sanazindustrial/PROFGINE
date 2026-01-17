import { getBillingContext, type BillingContext } from "@/lib/access/getBillingContext";
import { PLAN_LIMITS, PLAN_FEATURES } from "@/lib/billing/plans";

export interface ModuleAccessRequest {
    tier: "FREE_TRIAL" | "BASIC" | "PREMIUM" | "ENTERPRISE";
    role: "ADMIN" | "PROFESSOR" | "STUDENT";
    moduleKey: string;
    usage?: {
        students: number;
        courses: number;
        assignments: number;
        aiGrades: number;
        plagiarismScans: number;
    };
}

export interface ModuleAccessResult {
    allowed: boolean;
    reason?: string;
    limit?: number;
    current?: number;
    upgradeRequired?: "BASIC" | "PREMIUM" | "ENTERPRISE";
}

export class NewSubscriptionManager {
    private context: BillingContext;

    constructor(context: BillingContext) {
        this.context = context;
    }

    canAccessModule(request: ModuleAccessRequest): ModuleAccessResult {
        // Admin users can access everything
        if (request.role === "ADMIN") {
            return { allowed: true };
        }

        const tier = this.context.tier;
        const limits = PLAN_LIMITS[tier];
        const features = PLAN_FEATURES[tier];

        // Check feature access based on module
        switch (request.moduleKey) {
            case "AI_GRADING_ENGINE":
                if (!features?.canUseAIFeatures) {
                    return {
                        allowed: false,
                        reason: "AI features require BASIC tier or higher",
                        upgradeRequired: "BASIC"
                    };
                }

                if (request.usage && limits.creditsPerMonth !== -1 && request.usage.aiGrades >= limits.creditsPerMonth) {
                    return {
                        allowed: false,
                        reason: `AI grading limit reached (${limits.creditsPerMonth} max)`,
                        limit: limits.creditsPerMonth,
                        current: request.usage.aiGrades,
                        upgradeRequired: tier === "BASIC" ? "PREMIUM" : "ENTERPRISE"
                    };
                }
                break;

            case "ADVANCED_ANALYTICS":
                if (!features?.canUseAdvancedAnalytics) {
                    return {
                        allowed: false,
                        reason: "Advanced analytics requires BASIC tier or higher",
                        upgradeRequired: "BASIC"
                    };
                }
                break;

            case "BULK_OPERATIONS":
                if (!features?.canUseBulkOperations) {
                    return {
                        allowed: false,
                        reason: "Bulk operations require PREMIUM tier or higher",
                        upgradeRequired: "PREMIUM"
                    };
                }
                break;

            case "CUSTOM_BRANDING":
                if (!features?.canUseCustomBranding) {
                    return {
                        allowed: false,
                        reason: "Custom branding requires PREMIUM tier or higher",
                        upgradeRequired: "PREMIUM"
                    };
                }
                break;

            case "COURSE_MANAGEMENT":
                if (request.usage && limits.courses !== -1 && request.usage.courses >= limits.courses) {
                    return {
                        allowed: false,
                        reason: `Course limit reached (${limits.courses} max)`,
                        limit: limits.courses,
                        current: request.usage.courses,
                        upgradeRequired: tier === "FREE_TRIAL" ? "BASIC" : tier === "BASIC" ? "PREMIUM" : "ENTERPRISE"
                    };
                }
                break;

            case "ASSIGNMENT_SYSTEM":
                if (request.usage && limits.assignments !== -1 && request.usage.assignments >= limits.assignments) {
                    return {
                        allowed: false,
                        reason: `Assignment limit reached (${limits.assignments} max)`,
                        limit: limits.assignments,
                        current: request.usage.assignments,
                        upgradeRequired: tier === "FREE_TRIAL" ? "BASIC" : tier === "BASIC" ? "PREMIUM" : "ENTERPRISE"
                    };
                }
                break;

            case "STUDENT_MANAGEMENT":
                if (request.usage && limits.students !== -1 && request.usage.students >= limits.students) {
                    return {
                        allowed: false,
                        reason: `Student limit reached (${limits.students} max)`,
                        limit: limits.students,
                        current: request.usage.students,
                        upgradeRequired: tier === "FREE_TRIAL" ? "BASIC" : tier === "BASIC" ? "PREMIUM" : "ENTERPRISE"
                    };
                }
                break;

            case "ORGANIZATION_MANAGEMENT":
                if (!features?.canCreateOrganizations && this.context.ownerType !== "ORG") {
                    return {
                        allowed: false,
                        reason: "Organization management requires PREMIUM tier or higher",
                        upgradeRequired: "PREMIUM"
                    };
                }
                break;

            default:
                // Allow access to basic modules for all users
                break;
        }

        return { allowed: true };
    }

    // Get current usage summary
    getUsageSummary() {
        const limits = PLAN_LIMITS[this.context.tier];
        const usage = this.context.usage;

        if (!usage) {
            return {
                students: { current: 0, limit: limits.students, percentage: 0 },
                courses: { current: 0, limit: limits.courses, percentage: 0 },
                assignments: { current: 0, limit: limits.assignments, percentage: 0 },
                aiGrades: { current: 0, limit: limits.creditsPerMonth, percentage: 0 },
            };
        }

        const calculatePercentage = (current: number, limit: number): number => {
            if (limit === -1) return 0; // Unlimited
            return Math.round((current / limit) * 100);
        };

        return {
            students: {
                current: (usage as any).studentsCount || 0,
                limit: limits.students,
                percentage: calculatePercentage((usage as any).studentsCount || 0, limits.students)
            },
            courses: {
                current: usage.coursesCount,
                limit: limits.courses,
                percentage: calculatePercentage(usage.coursesCount, limits.courses)
            },
            assignments: {
                current: usage.assignmentsCount,
                limit: limits.assignments,
                percentage: calculatePercentage(usage.assignmentsCount, limits.assignments)
            },
            aiGrades: {
                current: usage.aiGradesCount,
                limit: limits.creditsPerMonth,
                percentage: calculatePercentage(usage.aiGradesCount, limits.creditsPerMonth)
            },
        };
    }

    // Get subscription info
    getSubscriptionInfo() {
        const features = PLAN_FEATURES[this.context.tier];
        const limits = PLAN_LIMITS[this.context.tier];

        return {
            ownerType: this.context.ownerType,
            ownerId: this.context.ownerId,
            tier: this.context.tier,
            status: this.context.status,
            currentPeriodEnd: this.context.currentPeriodEnd,
            cancelAtPeriodEnd: this.context.cancelAtPeriodEnd,
            features,
            limits,
            stripeCustomerId: this.context.stripeCustomerId,
            stripeSubscriptionId: this.context.stripeSubscriptionId,
        };
    }
}

// Factory function to create manager from current context
export async function createNewSubscriptionManager(): Promise<NewSubscriptionManager> {
    const context = await getBillingContext();
    return new NewSubscriptionManager(context);
}

// Helper function for quick access checks
export async function checkModuleAccess(moduleKey: string): Promise<ModuleAccessResult> {
    const context = await getBillingContext();
    const manager = new NewSubscriptionManager(context);

    const usage = context.usage ? {
        students: (context.usage as any).studentsCount || 0,
        courses: context.usage.coursesCount,
        assignments: context.usage.assignmentsCount,
        aiGrades: context.usage.aiGradesCount,
        plagiarismScans: context.usage.plagiarismScansCount,
    } : undefined;

    return manager.canAccessModule({
        tier: context.tier,
        role: context.user.role,
        moduleKey,
        usage,
    });
}