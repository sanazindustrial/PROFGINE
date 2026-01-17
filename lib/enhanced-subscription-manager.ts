import { UserRole, SubscriptionType } from '@prisma/client';
import { LMSModule, createModuleManager } from './module-manager';

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

// Default limits for free trial users (when no subscription type is set)
const FREE_TRIAL_LIMITS: SubscriptionLimits = {
  maxStudents: null, // unlimited
  maxCourses: null, // unlimited
  maxAssignments: null, // unlimited
  maxStorageGB: 5,
  canUseAIFeatures: true, // 50 credits/month
  canUseAdvancedAnalytics: false,
  canUseBulkOperations: false,
  canUseCustomBranding: false
};

// Subscription tier limits - All plans now have unlimited students
const SUBSCRIPTION_LIMITS: Record<SubscriptionType, SubscriptionLimits> = {
  FREE: {
    maxStudents: null, // unlimited
    maxCourses: null, // unlimited
    maxAssignments: null, // unlimited
    maxStorageGB: 5,
    canUseAIFeatures: true, // 50 credits/month
    canUseAdvancedAnalytics: false,
    canUseBulkOperations: false,
    canUseCustomBranding: false
  },
  BASIC: {
    maxStudents: null, // unlimited
    maxCourses: null, // unlimited
    maxAssignments: null, // unlimited
    maxStorageGB: 25,
    canUseAIFeatures: true, // 200 credits/month
    canUseAdvancedAnalytics: true,
    canUseBulkOperations: false,
    canUseCustomBranding: false
  },
  PREMIUM: {
    maxStudents: null, // unlimited
    maxCourses: null, // unlimited
    maxAssignments: null, // unlimited
    maxStorageGB: 100,
    canUseAIFeatures: true, // 500 credits/month
    canUseAdvancedAnalytics: true,
    canUseBulkOperations: true,
    canUseCustomBranding: true
  }
};

export class SubscriptionManager {
  private context: UserSubscriptionContext;
  private limits: SubscriptionLimits;
  private moduleManager: any;

  constructor(context: UserSubscriptionContext) {
    this.context = context;
    this.limits = this.calculateLimits();
    this.moduleManager = createModuleManager({
      userId: context.userId,
      role: context.role,
      subscriptionType: context.subscriptionType,
      subscriptionExpiresAt: context.subscriptionExpiresAt,
      trialExpiresAt: context.trialExpiresAt
    });
  }

  private calculateLimits(): SubscriptionLimits {
    // Check if subscription is expired or no subscription type
    if (this.isSubscriptionExpired() || !this.context.subscriptionType) {
      return FREE_TRIAL_LIMITS;
    }

    return SUBSCRIPTION_LIMITS[this.context.subscriptionType];
  }

  private isSubscriptionExpired(): boolean {
    const now = new Date();
    
    // Check trial expiration
    if (this.context.trialExpiresAt && this.context.trialExpiresAt < now) {
      return true;
    }
    
    // Check subscription expiration
    if (this.context.subscriptionExpiresAt && this.context.subscriptionExpiresAt < now) {
      return true;
    }
    
    return false;
  }

  // Module Access Methods - Integration with module-manager.ts
  public hasModuleAccess(module: LMSModule): boolean {
    return this.moduleManager.hasModuleAccess(module);
  }

  public canPerformAction(module: LMSModule, action: string, context?: any): { canPerform: boolean; reason?: string; limit?: number } {
    return this.moduleManager.canPerformAction(module, action, context);
  }

  public getAccessibleModules(): LMSModule[] {
    return Object.values(LMSModule).filter(module => this.hasModuleAccess(module));
  }

  public getRestrictedModules(): LMSModule[] {
    return Object.values(LMSModule).filter(module => !this.hasModuleAccess(module));
  }

  // Subscription Limit Checks
  public canAddStudent(currentCount: number): { canAdd: boolean; reason?: string; limit?: number } {
    const limit = this.limits.maxStudents;
    if (limit === null) return { canAdd: true };
    
    if (currentCount >= limit) {
      return {
        canAdd: false,
        reason: `Student limit reached (${limit} max)`,
        limit
      };
    }
    
    return { canAdd: true, limit };
  }

  public canCreateCourse(currentCount: number): { canAdd: boolean; reason?: string; limit?: number } {
    const limit = this.limits.maxCourses;
    if (limit === null) return { canAdd: true };
    
    if (currentCount >= limit) {
      return {
        canAdd: false,
        reason: `Course limit reached (${limit} max)`,
        limit
      };
    }
    
    return { canAdd: true, limit };
  }

  public canCreateAssignment(currentCount: number): { canAdd: boolean; reason?: string; limit?: number } {
    const limit = this.limits.maxAssignments;
    if (limit === null) return { canAdd: true };
    
    if (currentCount >= limit) {
      return {
        canAdd: false,
        reason: `Assignment limit reached (${limit} max)`,
        limit
      };
    }
    
    return { canAdd: true, limit };
  }

  // Feature Access Checks
  public canUseAIFeatures(): boolean {
    return this.limits.canUseAIFeatures;
  }

  public canUseAdvancedAnalytics(): boolean {
    return this.limits.canUseAdvancedAnalytics;
  }

  public canUseBulkOperations(): boolean {
    return this.limits.canUseBulkOperations;
  }

  // Subscription Information
  public getSubscriptionInfo(): {
    type: SubscriptionType | null;
    status: 'active' | 'expired' | 'trial';
    daysRemaining: number | null;
    limits: SubscriptionLimits;
    features: string[];
  } {
    const now = new Date();
    let status: 'active' | 'expired' | 'trial' = 'expired';
    let daysRemaining: number | null = null;

    // Determine status and days remaining
    if (this.context.subscriptionExpiresAt && this.context.subscriptionExpiresAt > now) {
      status = 'active';
      daysRemaining = Math.ceil((this.context.subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (this.context.trialExpiresAt && this.context.trialExpiresAt > now) {
      status = 'trial';
      daysRemaining = Math.ceil((this.context.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // List available features
    const features: string[] = [];
    if (this.limits.canUseAIFeatures) features.push('AI Grading & Analysis');
    if (this.limits.canUseAdvancedAnalytics) features.push('Advanced Analytics');
    if (this.limits.canUseBulkOperations) features.push('Bulk Operations');
    if (this.limits.canUseCustomBranding) features.push('Custom Branding');
    if (this.limits.maxStudents === null) features.push('Unlimited Students');
    if (this.limits.maxCourses === null) features.push('Unlimited Courses');

    return {
      type: this.context.subscriptionType,
      status,
      daysRemaining,
      limits: this.limits,
      features
    };
  }

  // Usage Summary
  public getUsageSummary(currentUsage: FeatureUsage): {
    students: { current: number; limit: number | null; percentage?: number };
    courses: { current: number; limit: number | null; percentage?: number };
    assignments: { current: number; limit: number | null; percentage?: number };
    storage: { currentMB: number; limitMB: number | null; percentage?: number };
  } {
    const calculatePercentage = (current: number, limit: number | null): number | undefined => {
      if (limit === null) return undefined;
      return Math.round((current / limit) * 100);
    };

    return {
      students: {
        current: currentUsage.students,
        limit: this.limits.maxStudents,
        percentage: calculatePercentage(currentUsage.students, this.limits.maxStudents)
      },
      courses: {
        current: currentUsage.courses,
        limit: this.limits.maxCourses,
        percentage: calculatePercentage(currentUsage.courses, this.limits.maxCourses)
      },
      assignments: {
        current: currentUsage.assignments,
        limit: this.limits.maxAssignments,
        percentage: calculatePercentage(currentUsage.assignments, this.limits.maxAssignments)
      },
      storage: {
        currentMB: currentUsage.storageUsedMB,
        limitMB: this.limits.maxStorageGB ? this.limits.maxStorageGB * 1024 : null,
        percentage: calculatePercentage(currentUsage.storageUsedMB, this.limits.maxStorageGB ? this.limits.maxStorageGB * 1024 : null)
      }
    };
  }
}

// Helper function to create subscription manager
export function createSubscriptionManager(context: UserSubscriptionContext): SubscriptionManager {
  return new SubscriptionManager(context);
}

// Utility function to get subscription limits for display
export function getSubscriptionLimits(subscriptionType: SubscriptionType): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[subscriptionType];
}