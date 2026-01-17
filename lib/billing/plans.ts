export type PaidTier = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type OwnerType = "USER" | "ORG";

export function priceIdForTier(tier: PaidTier): string {
    const map: Record<PaidTier, string | undefined> = {
        BASIC: process.env.STRIPE_PRICE_BASIC,
        PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
        ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
    };
    const priceId = map[tier];
    if (!priceId) throw new Error(`Missing Stripe price env var for ${tier}`);
    return priceId;
}

export const PLAN_FEATURES = {
    FREE_TRIAL: {
        canUseAIFeatures: true, // Limited
        canUseAdvancedAnalytics: false,
        canUseBulkOperations: false,
        canUseCustomBranding: false,
        canCreateOrganizations: false,
        descriptions: [
            '50 credits per month',
            'AI grading assistance',
            'Basic discussion responses',
            'Unlimited students',
            'Community support',
            'Perfect for trial and testing'
        ]
    },
    BASIC: {
        canUseAIFeatures: true,
        canUseAdvancedAnalytics: true,
        canUseBulkOperations: false,
        canUseCustomBranding: false,
        canCreateOrganizations: false,
        descriptions: [
            '200 credits per month',
            'AI-powered grading assistance',
            'Discussion response generation',
            'Unlimited students',
            'Basic analytics',
            'Email support'
        ]
    },
    PREMIUM: {
        canUseAIFeatures: true,
        canUseAdvancedAnalytics: true,
        canUseBulkOperations: true,
        canUseCustomBranding: true,
        canCreateOrganizations: true,
        descriptions: [
            '500 credits per month',
            'Advanced AI models',
            'Unlimited students',
            'Custom rubrics',
            'Bulk grading operations',
            'Priority support',
            'Advanced analytics'
        ]
    },
    ENTERPRISE: {
        canUseAIFeatures: true,
        canUseAdvancedAnalytics: true,
        canUseBulkOperations: true,
        canUseCustomBranding: true,
        canCreateOrganizations: true,
        descriptions: [
            'Unlimited credits',
            'Institution-wide deployment',
            'Custom integrations',
            'Dedicated support manager',
            'SSO integration',
            'Advanced security features',
            'Custom training and onboarding'
        ]
    }
} as const;

export const PLAN_LIMITS = {
    FREE_TRIAL: {
        students: -1, // unlimited
        courses: -1, // unlimited
        assignments: -1, // unlimited
        aiGrades: 50, // Keep for backward compatibility
        creditsPerMonth: 50,
        monthlyPrice: 0,
        targetUsers: "Trial users, individual testing"
    },
    BASIC: {
        students: -1, // unlimited
        courses: -1, // unlimited
        assignments: -1, // unlimited
        aiGrades: 200, // Keep for backward compatibility
        creditsPerMonth: 200,
        monthlyPrice: 29,
        targetUsers: "Individual professors, adjuncts"
    },
    PREMIUM: {
        students: -1, // unlimited
        courses: -1, // unlimited
        assignments: -1, // unlimited
        aiGrades: 500, // Keep for backward compatibility
        creditsPerMonth: 500,
        monthlyPrice: 79,
        targetUsers: "Full-time professors, coordinators"
    },
    ENTERPRISE: {
        students: -1, // unlimited
        courses: -1, // unlimited
        assignments: -1, // unlimited
        aiGrades: -1, // unlimited
        creditsPerMonth: -1, // unlimited
        monthlyPrice: null, // custom quote
        targetUsers: "Universities, departments"
    }
} as const;