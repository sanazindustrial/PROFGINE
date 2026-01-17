import { FeedbackDepth, GradingDifficulty, ProfessorPersonality, SubscriptionType, UserRole } from '@prisma/client'

// Define AssessmentType enum locally since it's not in Prisma schema
export enum AssessmentType {
    HOMEWORK = 'HOMEWORK',
    QUIZ = 'QUIZ',
    EXAM = 'EXAM',
    PROJECT = 'PROJECT',
    PAPER = 'PAPER',
    DISCUSSION = 'DISCUSSION',
    PRESENTATION = 'PRESENTATION',
    ASSIGNMENT = 'ASSIGNMENT',
    DISSERTATION = 'DISSERTATION'
}

// Enhanced Feature Types with new capabilities
export enum FeatureType {
    COURSE_CREATION = 'COURSE_CREATION',
    ASSIGNMENT_CREATION = 'ASSIGNMENT_CREATION',
    DISCUSSION_CREATION = 'DISCUSSION_CREATION',
    CUSTOM_RUBRICS = 'CUSTOM_RUBRICS',
    AI_GRADING = 'AI_GRADING',
    ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
    BULK_OPERATIONS = 'BULK_OPERATIONS',
    API_ACCESS = 'API_ACCESS',
    PROFESSOR_STYLE_LEARNING = 'PROFESSOR_STYLE_LEARNING',
    ORGANIZATION_MANAGEMENT = 'ORGANIZATION_MANAGEMENT',
    CREDIT_SYSTEM = 'CREDIT_SYSTEM',
    CUSTOM_PROMPTS = 'CUSTOM_PROMPTS'
}

// Professor Style Configuration
export interface ProfessorStyleConfig {
    gradingDifficulty: GradingDifficulty
    feedbackDepth: FeedbackDepth
    personality: ProfessorPersonality
    customPromptTemplate?: string
    keyEvaluationCriteria: string[]
    learningPreferences?: any
}

// Enhanced Grading Request Interface
export interface GradingRequest {
    assessmentType: AssessmentType
    content: string
    rubric?: string
    professorStyle: ProfessorStyleConfig
    customInstructions?: string
}

// Credit System Interface
export interface CreditBalance {
    available: number
    monthly: number
    rollover: number
    total: number
    lastReset: Date
}

export interface FeatureAccess {
    isEnabled: boolean
    usageLimit?: number
    canUpgrade?: boolean
    currentUsage?: number
    creditCost?: number // Credits required per use
    availableCredits?: number
}

export interface UserSubscriptionContext {
    userId: string
    role: UserRole
    subscriptionType: SubscriptionType | null
    subscriptionExpiresAt: Date | null
    trialExpiresAt: Date | null
    creditBalance?: number
    monthlyCredits?: number
    organizationId?: string
    currentUsage?: Record<string, number>
}

export interface SubscriptionLimits {
    maxStudents: number | null
    maxCourses: number | null
    maxAssignments: number | null
    maxStorageGB: number | null
    monthlyCredits: number
    canUseAIFeatures: boolean
    canUseAdvancedAnalytics: boolean
    canUseBulkOperations: boolean
    canUseCustomBranding: boolean
    canUseOrganizationFeatures: boolean
    canUseProfessorStyleLearning: boolean
}

// Enhanced Subscription Features with Credit Costs
export const SUBSCRIPTION_FEATURES: Record<SubscriptionType, Record<FeatureType, FeatureAccess>> = {
    FREE: {
        COURSE_CREATION: { isEnabled: true, usageLimit: 2, canUpgrade: true, creditCost: 5 },
        ASSIGNMENT_CREATION: { isEnabled: true, usageLimit: 5, canUpgrade: true, creditCost: 2 },
        DISCUSSION_CREATION: { isEnabled: true, usageLimit: 3, canUpgrade: true, creditCost: 1 },
        CUSTOM_RUBRICS: { isEnabled: true, usageLimit: 2, canUpgrade: true, creditCost: 3 },
        AI_GRADING: { isEnabled: true, usageLimit: 10, canUpgrade: true, creditCost: 1 },
        ADVANCED_ANALYTICS: { isEnabled: false, canUpgrade: true, creditCost: 5 },
        BULK_OPERATIONS: { isEnabled: false, canUpgrade: true, creditCost: 10 },
        API_ACCESS: { isEnabled: false, canUpgrade: true, creditCost: 15 },
        PROFESSOR_STYLE_LEARNING: { isEnabled: false, canUpgrade: true, creditCost: 8 },
        ORGANIZATION_MANAGEMENT: { isEnabled: false, canUpgrade: true, creditCost: 20 },
        CREDIT_SYSTEM: { isEnabled: false, canUpgrade: true },
        CUSTOM_PROMPTS: { isEnabled: false, canUpgrade: true, creditCost: 3 }
    },
    BASIC: {
        COURSE_CREATION: { isEnabled: true, usageLimit: 10, canUpgrade: true, creditCost: 3 },
        ASSIGNMENT_CREATION: { isEnabled: true, usageLimit: 25, canUpgrade: true, creditCost: 1 },
        DISCUSSION_CREATION: { isEnabled: true, usageLimit: 15, canUpgrade: true, creditCost: 1 },
        CUSTOM_RUBRICS: { isEnabled: true, usageLimit: 10, canUpgrade: true, creditCost: 2 },
        AI_GRADING: { isEnabled: true, usageLimit: 100, canUpgrade: true, creditCost: 1 },
        ADVANCED_ANALYTICS: { isEnabled: true, usageLimit: 50, canUpgrade: true, creditCost: 3 },
        BULK_OPERATIONS: { isEnabled: false, canUpgrade: true, creditCost: 8 },
        API_ACCESS: { isEnabled: true, usageLimit: 1000, canUpgrade: true, creditCost: 10 },
        PROFESSOR_STYLE_LEARNING: { isEnabled: true, usageLimit: 50, canUpgrade: true, creditCost: 5 },
        ORGANIZATION_MANAGEMENT: { isEnabled: false, canUpgrade: true, creditCost: 15 },
        CREDIT_SYSTEM: { isEnabled: true, canUpgrade: false },
        CUSTOM_PROMPTS: { isEnabled: true, usageLimit: 20, canUpgrade: true, creditCost: 2 }
    },
    PREMIUM: {
        COURSE_CREATION: { isEnabled: true, canUpgrade: false, creditCost: 2 },
        ASSIGNMENT_CREATION: { isEnabled: true, canUpgrade: false, creditCost: 1 },
        DISCUSSION_CREATION: { isEnabled: true, canUpgrade: false, creditCost: 1 },
        CUSTOM_RUBRICS: { isEnabled: true, canUpgrade: false, creditCost: 1 },
        AI_GRADING: { isEnabled: true, canUpgrade: false, creditCost: 1 },
        ADVANCED_ANALYTICS: { isEnabled: true, canUpgrade: false, creditCost: 2 },
        BULK_OPERATIONS: { isEnabled: true, canUpgrade: false, creditCost: 5 },
        API_ACCESS: { isEnabled: true, canUpgrade: false, creditCost: 5 },
        PROFESSOR_STYLE_LEARNING: { isEnabled: true, canUpgrade: false, creditCost: 3 },
        ORGANIZATION_MANAGEMENT: { isEnabled: true, canUpgrade: false, creditCost: 10 },
        CREDIT_SYSTEM: { isEnabled: true, canUpgrade: false },
        CUSTOM_PROMPTS: { isEnabled: true, canUpgrade: false, creditCost: 1 }
    }
}

// Monthly Credit Allocations
export const SUBSCRIPTION_CREDITS: Record<SubscriptionType, number> = {
    FREE: 50,
    BASIC: 200,
    PREMIUM: 500
}

export class EnhancedSubscriptionManager {
    private context: UserSubscriptionContext

    constructor(context: UserSubscriptionContext) {
        this.context = context
    }

    /**
     * Check if user has access to a specific feature with credit consideration
     */
    hasFeature(feature: FeatureType): boolean {
        // Admins have access to all features
        if (this.context.role === 'ADMIN') {
            return true
        }

        // Students typically don't have creation features
        if (this.context.role === 'STUDENT') {
            return feature === FeatureType.AI_GRADING // Students can only see grading results
        }

        if (!this.isSubscriptionActive()) {
            return false
        }

        const subscriptionType = this.context.subscriptionType || 'FREE'
        const featureConfig = SUBSCRIPTION_FEATURES[subscriptionType][feature]

        if (!featureConfig?.isEnabled) {
            return false
        }

        // Check credit availability if feature has credit cost
        if (featureConfig.creditCost && this.context.creditBalance !== undefined) {
            return this.context.creditBalance >= featureConfig.creditCost
        }

        return true
    }

    /**
     * Get feature access details including credit costs
     */
    getFeatureAccess(feature: FeatureType, currentUsage: number = 0): FeatureAccess {
        const subscriptionType = this.context.subscriptionType || 'FREE'
        const featureConfig = SUBSCRIPTION_FEATURES[subscriptionType][feature]

        return {
            ...featureConfig,
            currentUsage,
            availableCredits: this.context.creditBalance || 0,
            isEnabled: featureConfig.isEnabled &&
                (featureConfig.usageLimit === undefined || currentUsage < featureConfig.usageLimit) &&
                (featureConfig.creditCost === undefined || (this.context.creditBalance || 0) >= featureConfig.creditCost)
        }
    }

    /**
     * Get credit balance information
     */
    getCreditBalance(): CreditBalance {
        return {
            available: this.context.creditBalance || 0,
            monthly: this.context.monthlyCredits || 0,
            rollover: Math.max(0, (this.context.creditBalance || 0) - (this.context.monthlyCredits || 0)),
            total: this.context.creditBalance || 0,
            lastReset: new Date() // This would come from database
        }
    }

    /**
     * Check if user can use a feature and deduct credits if needed
     */
    canUseFeature(feature: FeatureType): { canUse: boolean; creditCost: number; remainingCredits: number } {
        const subscriptionType = this.context.subscriptionType || 'FREE'
        const featureConfig = SUBSCRIPTION_FEATURES[subscriptionType][feature]
        const creditCost = featureConfig.creditCost || 0
        const availableCredits = this.context.creditBalance || 0

        return {
            canUse: this.hasFeature(feature) && availableCredits >= creditCost,
            creditCost,
            remainingCredits: Math.max(0, availableCredits - creditCost)
        }
    }

    /**
     * Check if subscription is active
     */
    isSubscriptionActive(): boolean {
        const now = new Date()

        if (this.context.subscriptionExpiresAt && this.context.subscriptionExpiresAt < now) {
            return false
        }

        if (this.context.subscriptionType === 'FREE') {
            return !this.context.trialExpiresAt || this.context.trialExpiresAt > now
        }

        return true
    }

    /**
     * Get subscription limits
     */
    getSubscriptionLimits(): SubscriptionLimits {
        const subscriptionType = this.context.subscriptionType || 'FREE'

        switch (subscriptionType) {
            case 'FREE':
                return {
                    maxStudents: 10,
                    maxCourses: 2,
                    maxAssignments: 5,
                    maxStorageGB: 1,
                    monthlyCredits: SUBSCRIPTION_CREDITS.FREE,
                    canUseAIFeatures: true,
                    canUseAdvancedAnalytics: false,
                    canUseBulkOperations: false,
                    canUseCustomBranding: false,
                    canUseOrganizationFeatures: false,
                    canUseProfessorStyleLearning: false
                }
            case 'BASIC':
                return {
                    maxStudents: 50,
                    maxCourses: 10,
                    maxAssignments: 25,
                    maxStorageGB: 5,
                    monthlyCredits: SUBSCRIPTION_CREDITS.BASIC,
                    canUseAIFeatures: true,
                    canUseAdvancedAnalytics: true,
                    canUseBulkOperations: false,
                    canUseCustomBranding: false,
                    canUseOrganizationFeatures: false,
                    canUseProfessorStyleLearning: true
                }
            case 'PREMIUM':
                return {
                    maxStudents: -1, // unlimited
                    maxCourses: -1,
                    maxAssignments: -1,
                    maxStorageGB: 50,
                    monthlyCredits: SUBSCRIPTION_CREDITS.PREMIUM,
                    canUseAIFeatures: true,
                    canUseAdvancedAnalytics: true,
                    canUseBulkOperations: true,
                    canUseCustomBranding: true,
                    canUseOrganizationFeatures: true,
                    canUseProfessorStyleLearning: true
                }
        }
    }

    /**
     * Get subscription info for display
     */
    getSubscriptionInfo() {
        const isActive = this.isSubscriptionActive()
        const limits = this.getSubscriptionLimits()
        const credits = this.getCreditBalance()

        return {
            type: this.context.subscriptionType || 'FREE',
            isActive,
            expiresAt: this.context.subscriptionExpiresAt,
            trialExpiresAt: this.context.trialExpiresAt,
            limits,
            credits,
            needsUpgrade: !isActive || this.context.subscriptionType === 'FREE'
        }
    }
}

/**
 * Create subscription manager instance
 */
export function createEnhancedSubscriptionManager(context: UserSubscriptionContext): EnhancedSubscriptionManager {
    return new EnhancedSubscriptionManager(context)
}

// Default Professor Style Configurations
export const DEFAULT_PROFESSOR_STYLES: Record<string, Partial<ProfessorStyleConfig>> = {
    EASY: {
        gradingDifficulty: 'EASY',
        feedbackDepth: 'LIGHT',
        personality: 'ENCOURAGING',
        keyEvaluationCriteria: ['Understanding', 'Effort', 'Participation']
    },
    MEDIUM: {
        gradingDifficulty: 'MEDIUM',
        feedbackDepth: 'MODERATE',
        personality: 'SUPPORTIVE',
        keyEvaluationCriteria: ['Understanding', 'Analysis', 'Organization', 'Writing Quality']
    },
    HARD: {
        gradingDifficulty: 'HARD',
        feedbackDepth: 'DEEP',
        personality: 'CRITICAL',
        keyEvaluationCriteria: ['Critical Thinking', 'Originality', 'Research Quality', 'Argumentation', 'Evidence']
    },
    DEEP: {
        gradingDifficulty: 'MEDIUM',
        feedbackDepth: 'COMPREHENSIVE',
        personality: 'ANALYTICAL',
        keyEvaluationCriteria: ['Depth of Analysis', 'Theoretical Understanding', 'Application', 'Synthesis']
    }
}

// Grading Prompt Templates
export const GRADING_PROMPT_TEMPLATES = {
    ASSIGNMENT: {
        EASY: "Provide encouraging feedback focusing on the student's effort and understanding. Highlight positive aspects while gently suggesting improvements.",
        MEDIUM: "Evaluate the assignment against standard criteria. Provide balanced feedback with specific suggestions for improvement.",
        HARD: "Apply rigorous academic standards. Provide detailed critique with high expectations for quality and depth."
    },
    PAPER: {
        LIGHT: "Focus on main ideas and overall structure. Provide brief, constructive comments.",
        MODERATE: "Evaluate argument quality, evidence, and organization. Provide detailed feedback on strengths and areas for improvement.",
        DEEP: "Conduct comprehensive analysis of thesis, methodology, evidence, argumentation, and contribution to field.",
        COMPREHENSIVE: "Provide extensive feedback covering all aspects including theoretical framework, literature review, methodology, analysis, conclusions, and future research directions."
    },
    DISSERTATION: {
        DEEP: "Evaluate as a significant scholarly work. Assess originality, methodological rigor, contribution to knowledge, and academic writing quality.",
        COMPREHENSIVE: "Provide exhaustive review covering research design, literature review, theoretical framework, methodology, data analysis, findings, implications, and recommendations for revision."
    }
}