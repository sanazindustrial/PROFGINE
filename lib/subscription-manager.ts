import { UserRole, SubscriptionType } from '@prisma/client';
// Remove circular import - will be defined here
// import { LMSModule, createModuleManager } from './module-manager';

// Define feature types and access control
export enum FeatureType {
  COURSE_CREATION = 'COURSE_CREATION',
  ASSIGNMENT_CREATION = 'ASSIGNMENT_CREATION',
  DISCUSSION_CREATION = 'DISCUSSION_CREATION',
  CUSTOM_RUBRICS = 'CUSTOM_RUBRICS',
  AI_GRADING = 'AI_GRADING',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  BULK_OPERATIONS = 'BULK_OPERATIONS',
  API_ACCESS = 'API_ACCESS'
}

export interface FeatureAccess {
  isEnabled: boolean;
  usageLimit?: number; // null/undefined = unlimited
  canUpgrade?: boolean;
  currentUsage?: number; // Current usage count
}

export interface UserSubscriptionContext {
  userId: string;
  role: UserRole;
  subscriptionType: SubscriptionType | null;
  subscriptionExpiresAt: Date | null;
  trialExpiresAt: Date | null;
  currentUsage?: Record<string, number>;
}

export interface SubscriptionLimits {
  maxStudents: number | null; // null = unlimited
  maxCourses: number | null;
  maxAssignments: number | null;
  maxStorageGB: number | null;
  canUseAIFeatures: boolean;
  canUseAdvancedAnalytics: boolean;
  canUseBulkOperations: boolean;
  canUseCustomBranding: boolean;
}

export interface FeatureUsage {
  students: number;
  courses: number;
  assignments: number;
  storageUsedMB: number;
  aiGradingRequestsThisMonth: number;
  reportsGeneratedThisMonth: number;
}

// Create a type alias for UserSubscription to match what module-manager expects
export type UserSubscription = UserSubscriptionContext;

export const SUBSCRIPTION_FEATURES: Record<SubscriptionType, Record<FeatureType, FeatureAccess>> = {
  FREE: {
    COURSE_CREATION: { isEnabled: true, usageLimit: 2, canUpgrade: true },
    ASSIGNMENT_CREATION: { isEnabled: true, usageLimit: 5, canUpgrade: true },
    DISCUSSION_CREATION: { isEnabled: true, usageLimit: 3, canUpgrade: true },
    CUSTOM_RUBRICS: { isEnabled: true, usageLimit: 2, canUpgrade: true },
    AI_GRADING: { isEnabled: true, usageLimit: 10, canUpgrade: true },
    ADVANCED_ANALYTICS: { isEnabled: false, canUpgrade: true },
    BULK_OPERATIONS: { isEnabled: false, canUpgrade: true },
    API_ACCESS: { isEnabled: false, canUpgrade: true },
  },
  BASIC: {
    COURSE_CREATION: { isEnabled: true, usageLimit: 10, canUpgrade: true },
    ASSIGNMENT_CREATION: { isEnabled: true, usageLimit: 50, canUpgrade: true },
    DISCUSSION_CREATION: { isEnabled: true, usageLimit: 25, canUpgrade: true },
    CUSTOM_RUBRICS: { isEnabled: true, usageLimit: 10, canUpgrade: true },
    AI_GRADING: { isEnabled: true, usageLimit: 100, canUpgrade: true },
    ADVANCED_ANALYTICS: { isEnabled: true, usageLimit: 5, canUpgrade: true },
    BULK_OPERATIONS: { isEnabled: false, canUpgrade: true },
    API_ACCESS: { isEnabled: false, canUpgrade: true },
  },
  PREMIUM: {
    COURSE_CREATION: { isEnabled: true, canUpgrade: false },
    ASSIGNMENT_CREATION: { isEnabled: true, canUpgrade: false },
    DISCUSSION_CREATION: { isEnabled: true, canUpgrade: false },
    CUSTOM_RUBRICS: { isEnabled: true, canUpgrade: false },
    AI_GRADING: { isEnabled: true, canUpgrade: false },
    ADVANCED_ANALYTICS: { isEnabled: true, canUpgrade: true },
    BULK_OPERATIONS: { isEnabled: true, usageLimit: 50, canUpgrade: true },
    API_ACCESS: { isEnabled: true, usageLimit: 1000, canUpgrade: true },
  },
}

export class SubscriptionManager {
  private user: UserSubscription;

  constructor(user: UserSubscription) {
    this.user = user;
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeature(feature: FeatureType): boolean {
    // Admins have access to all features
    if (this.user.role === 'PROFESSOR') {
      return true;
    }

    // Students typically don't have creation features
    if (this.user.role === 'STUDENT') {
      return false;
    }

    // Check subscription status
    if (!this.isSubscriptionActive()) {
      return false;
    }

    // Handle null subscriptionType by defaulting to FREE
    const subscriptionType = this.user.subscriptionType || 'FREE';
    const featureConfig = SUBSCRIPTION_FEATURES[subscriptionType][feature];
    return featureConfig?.isEnabled || false;
  }

  /**
   * Check if subscription is active (not expired)
   */
  isSubscriptionActive(): boolean {
    const now = new Date();

    // Check subscription expiration
    if (this.user.subscriptionExpiresAt && this.user.subscriptionExpiresAt < now) {
      return false;
    }

    // Check trial expiration for trial users
    if (this.user.subscriptionType === 'FREE') {
      return !this.user.trialExpiresAt || this.user.trialExpiresAt > now;
    }

    return true;
  }

  /**
   * Get current feature set based on role and subscription
   */
  getFeatures() {
    if (this.user.role === UserRole.ADMIN) {
      return {
        maxCourses: -1,
        maxAssignments: -1,
        maxDiscussions: -1,
        maxStudentsPerCourse: -1,
        maxStudents: -1,
        maxRubrics: -1,
        maxAnalytics: -1,
        customRubrics: true,
        aiGrading: true,
        advancedAnalytics: true,
        bulkOperations: true,
        apiAccess: true
      };
    }

    if (this.user.role === UserRole.STUDENT) {
      return {
        maxCourses: 0,
        maxAssignments: 0,
        maxDiscussions: 0,
        maxStudentsPerCourse: 0,
        maxStudents: 0,
        maxRubrics: 0,
        maxAnalytics: 0,
        customRubrics: false,
        aiGrading: false,
        advancedAnalytics: false,
        bulkOperations: false,
        apiAccess: false
      };
    }

    // Professor features based on subscription
    const subscriptionType = this.user.subscriptionType || 'FREE';
    const subscriptionFeatures = SUBSCRIPTION_FEATURES[subscriptionType];
    return {
      maxCourses: subscriptionFeatures.COURSE_CREATION.usageLimit || -1,
      maxAssignments: subscriptionFeatures.ASSIGNMENT_CREATION.usageLimit || -1,
      maxDiscussions: subscriptionFeatures.DISCUSSION_CREATION.usageLimit || -1,
      maxStudentsPerCourse: 50, // Default student limit per course
      maxStudents: subscriptionFeatures.COURSE_CREATION.usageLimit ? subscriptionFeatures.COURSE_CREATION.usageLimit * 50 : -1, // Students = courses * 50
      maxRubrics: subscriptionFeatures.CUSTOM_RUBRICS.usageLimit || (subscriptionFeatures.CUSTOM_RUBRICS.isEnabled ? -1 : 0),
      maxAnalytics: subscriptionFeatures.ADVANCED_ANALYTICS.isEnabled ? -1 : 0,
      customRubrics: subscriptionFeatures.CUSTOM_RUBRICS.isEnabled,
      aiGrading: subscriptionFeatures.AI_GRADING.isEnabled,
      advancedAnalytics: subscriptionFeatures.ADVANCED_ANALYTICS.isEnabled,
      bulkOperations: subscriptionFeatures.BULK_OPERATIONS.isEnabled,
      apiAccess: subscriptionFeatures.API_ACCESS.isEnabled
    };
  }

  /**
   * Get subscription status info
   */
  getSubscriptionInfo() {
    const features = this.getFeatures();
    const isActive = this.isSubscriptionActive();

    return {
      type: this.user.subscriptionType,
      role: this.user.role,
      isActive,
      features,
      expiresAt: this.user.subscriptionExpiresAt,
      trialExpiresAt: this.user.trialExpiresAt,
      daysRemaining: this.getDaysRemaining(),
      needsUpgrade: !isActive || this.user.subscriptionType === 'FREE'
    };
  }

  /**
   * Get days remaining on subscription/trial
   */
  private getDaysRemaining(): number | null {
    const now = new Date();
    const expirationDate = this.user.subscriptionExpiresAt || this.user.trialExpiresAt;

    if (!expirationDate) return null;

    const timeDiff = expirationDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Check usage limits
   */
  canCreateCourse(currentCourseCount: number): boolean {
    if (this.user.role === 'ADMIN') return true;
    if (this.user.role === 'PROFESSOR') return false;
    if (!this.isSubscriptionActive()) return false;

    const features = this.getFeatures();
    return features.maxCourses === -1 || currentCourseCount < features.maxCourses;
  }

  canCreateAssignment(currentAssignmentCount: number): boolean {
    if (this.user.role === 'ADMIN') return true;
    if (this.user.role === 'PROFESSOR') return false;
    if (!this.isSubscriptionActive()) return false;

    const features = this.getFeatures();
    return features.maxAssignments === -1 || currentAssignmentCount < features.maxAssignments;
  }

  canCreateDiscussion(currentDiscussionCount: number): boolean {
    if (this.user.role === 'ADMIN') return true;
    if (this.user.role === 'PROFESSOR') return false;
    if (!this.isSubscriptionActive()) return false;

    const features = this.getFeatures();
    return features.maxDiscussions === -1 || currentDiscussionCount < features.maxDiscussions;
  }

  /**
   * Get upgrade message when limits are reached
   */
  getUpgradeMessage(limitType: 'courses' | 'assignments' | 'discussions' | 'students'): string {
    const messages = {
      courses: 'You\'ve reached your course limit. Upgrade your subscription to create more courses.',
      assignments: 'You\'ve reached your assignment limit. Upgrade your subscription to create more assignments.',
      discussions: 'You\'ve reached your discussion limit. Upgrade your subscription to create more discussions.',
      students: 'You\'ve reached your student limit for this course. Upgrade your subscription to add more students.'
    };

    return messages[limitType];
  }

  static hasFeatureAccess(
    subscriptionType: SubscriptionType,
    feature: FeatureType,
    currentUsage: number = 0
  ): FeatureAccess {
    const featureConfig = SUBSCRIPTION_FEATURES[subscriptionType][feature]

    return {
      ...featureConfig,
      currentUsage,
      isEnabled: featureConfig.isEnabled &&
        (featureConfig.usageLimit === undefined || currentUsage < featureConfig.usageLimit)
    }
  }

  static getFeatureLimits(subscriptionType: SubscriptionType): Record<FeatureType, FeatureAccess> {
    return SUBSCRIPTION_FEATURES[subscriptionType]
  }

  static canCreateCourse(subscriptionType: SubscriptionType, currentCourses: number): boolean {
    const access = this.hasFeatureAccess(subscriptionType, FeatureType.COURSE_CREATION, currentCourses)
    return access.isEnabled
  }

  static canCreateAssignment(subscriptionType: SubscriptionType, currentAssignments: number): boolean {
    const access = this.hasFeatureAccess(subscriptionType, FeatureType.ASSIGNMENT_CREATION, currentAssignments)
    return access.isEnabled
  }

  static canUseAiGrading(subscriptionType: SubscriptionType, currentUsage: number): boolean {
    const access = this.hasFeatureAccess(subscriptionType, FeatureType.AI_GRADING, currentUsage)
    return access.isEnabled
  }

  static getRemainingUsage(
    subscriptionType: SubscriptionType,
    feature: FeatureType,
    currentUsage: number
  ): number | null {
    const featureConfig = SUBSCRIPTION_FEATURES[subscriptionType][feature]
    if (!featureConfig.usageLimit) return null // Unlimited
    return Math.max(0, featureConfig.usageLimit - currentUsage)
  }

  static getUpgradeMessage(currentSubscription: SubscriptionType, feature: FeatureType): string {
    const messages = {
      [FeatureType.COURSE_CREATION]: "Upgrade to create more courses",
      [FeatureType.ASSIGNMENT_CREATION]: "Upgrade to create unlimited assignments",
      [FeatureType.DISCUSSION_CREATION]: "Upgrade to create more discussions",
      [FeatureType.CUSTOM_RUBRICS]: "Upgrade to create custom rubrics",
      [FeatureType.AI_GRADING]: "Upgrade for more AI grading capacity",
      [FeatureType.ADVANCED_ANALYTICS]: "Upgrade to access advanced analytics",
      [FeatureType.BULK_OPERATIONS]: "Upgrade to access bulk operations",
      [FeatureType.API_ACCESS]: "Upgrade to access API features",
    }

    return messages[feature] || "Upgrade to access this feature"
  }
}

/**
 * Helper function to create SubscriptionManager from user data
 */
export function createSubscriptionManager(user: UserSubscription): SubscriptionManager {
  return new SubscriptionManager(user);
}