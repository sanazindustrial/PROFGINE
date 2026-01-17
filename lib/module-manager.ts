// LMS Module Registration and Access Control System
import { SubscriptionManager, UserSubscription, FeatureType } from './subscription-manager';
import { UserRole } from '@prisma/client';

export enum LMSModule {
    // Core Learning Modules
    COURSE_MANAGEMENT = 'COURSE_MANAGEMENT',
    STUDENT_ENROLLMENT = 'STUDENT_ENROLLMENT',
    ASSIGNMENT_SYSTEM = 'ASSIGNMENT_SYSTEM',
    DISCUSSION_FORUMS = 'DISCUSSION_FORUMS',
    GRADING_SYSTEM = 'GRADING_SYSTEM',

    // Advanced Modules
    RUBRIC_BUILDER = 'RUBRIC_BUILDER',
    AI_GRADING_ENGINE = 'AI_GRADING_ENGINE',
    ANALYTICS_DASHBOARD = 'ANALYTICS_DASHBOARD',
    BULK_OPERATIONS = 'BULK_OPERATIONS',

    // Student-Specific Modules
    STUDENT_DASHBOARD = 'STUDENT_DASHBOARD',
    SUBMISSION_SYSTEM = 'SUBMISSION_SYSTEM',
    GRADE_VIEWER = 'GRADE_VIEWER',
    DISCUSSION_PARTICIPATION = 'DISCUSSION_PARTICIPATION',

    // Administrative Modules
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    SYSTEM_ADMINISTRATION = 'SYSTEM_ADMINISTRATION',
    API_ACCESS = 'API_ACCESS'
}

interface ModuleConfig {
    name: string;
    description: string;
    requiredFeatures: FeatureType[];
    allowedRoles: UserRole[];
    component?: string;
    route?: string;
}

// Module Registry - Maps each LMS module to its requirements
export const MODULE_REGISTRY: Record<LMSModule, ModuleConfig> = {
    // Core Learning Modules
    [LMSModule.COURSE_MANAGEMENT]: {
        name: 'Course Management',
        description: 'Create, edit, and manage courses',
        requiredFeatures: [FeatureType.COURSE_CREATION],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'CourseManagement',
        route: '/dashboard/courses'
    },

    [LMSModule.STUDENT_ENROLLMENT]: {
        name: 'Student Enrollment',
        description: 'Enroll and manage students in courses',
        requiredFeatures: [FeatureType.COURSE_CREATION],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'EnrollmentManagement',
        route: '/dashboard/enrollment'
    },

    [LMSModule.ASSIGNMENT_SYSTEM]: {
        name: 'Assignment System',
        description: 'Create and manage course assignments',
        requiredFeatures: [FeatureType.ASSIGNMENT_CREATION],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'AssignmentManagement',
        route: '/dashboard/assignments'
    },

    [LMSModule.DISCUSSION_FORUMS]: {
        name: 'Discussion Forums',
        description: 'Create and moderate discussion forums',
        requiredFeatures: [FeatureType.DISCUSSION_CREATION],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'DiscussionManagement',
        route: '/dashboard/discussions'
    },

    [LMSModule.GRADING_SYSTEM]: {
        name: 'Grading System',
        description: 'Grade assignments and provide feedback',
        requiredFeatures: [FeatureType.ASSIGNMENT_CREATION],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'GradingSystem',
        route: '/dashboard/grading'
    },

    // Advanced Modules
    [LMSModule.RUBRIC_BUILDER]: {
        name: 'Rubric Builder',
        description: 'Create custom grading rubrics',
        requiredFeatures: [FeatureType.CUSTOM_RUBRICS],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'RubricBuilder',
        route: '/dashboard/rubrics'
    },

    [LMSModule.AI_GRADING_ENGINE]: {
        name: 'AI Grading Engine',
        description: 'Automated assignment grading with AI',
        requiredFeatures: [FeatureType.AI_GRADING],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'AIGradingEngine',
        route: '/dashboard/ai-grading'
    },

    [LMSModule.ANALYTICS_DASHBOARD]: {
        name: 'Analytics Dashboard',
        description: 'Advanced analytics and reporting',
        requiredFeatures: [FeatureType.ADVANCED_ANALYTICS],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'AnalyticsDashboard',
        route: '/dashboard/analytics'
    },

    [LMSModule.BULK_OPERATIONS]: {
        name: 'Bulk Operations',
        description: 'Perform operations on multiple items',
        requiredFeatures: [FeatureType.BULK_OPERATIONS],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'BulkOperations',
        route: '/dashboard/bulk'
    },

    // Student-Specific Modules
    [LMSModule.STUDENT_DASHBOARD]: {
        name: 'Student Dashboard',
        description: 'Student overview and course access',
        requiredFeatures: [],
        allowedRoles: [UserRole.STUDENT],
        component: 'StudentDashboard',
        route: '/dashboard/student'
    },

    [LMSModule.SUBMISSION_SYSTEM]: {
        name: 'Submission System',
        description: 'Submit assignments and view feedback',
        requiredFeatures: [],
        allowedRoles: [UserRole.STUDENT],
        component: 'SubmissionSystem',
        route: '/dashboard/submissions'
    },

    [LMSModule.GRADE_VIEWER]: {
        name: 'Grade Viewer',
        description: 'View grades and feedback',
        requiredFeatures: [],
        allowedRoles: [UserRole.STUDENT],
        component: 'GradeViewer',
        route: '/dashboard/grades'
    },

    [LMSModule.DISCUSSION_PARTICIPATION]: {
        name: 'Discussion Participation',
        description: 'Participate in course discussions',
        requiredFeatures: [],
        allowedRoles: [UserRole.STUDENT],
        component: 'DiscussionParticipation',
        route: '/dashboard/discussions/student'
    },

    // Administrative Modules
    [LMSModule.USER_MANAGEMENT]: {
        name: 'User Management',
        description: 'Manage system users and permissions',
        requiredFeatures: [],
        allowedRoles: [UserRole.ADMIN],
        component: 'UserManagement',
        route: '/dashboard/admin/users'
    },

    [LMSModule.SYSTEM_ADMINISTRATION]: {
        name: 'System Administration',
        description: 'System-wide administration tools',
        requiredFeatures: [],
        allowedRoles: [UserRole.ADMIN],
        component: 'SystemAdmin',
        route: '/dashboard/admin/system'
    },

    [LMSModule.API_ACCESS]: {
        name: 'API Access',
        description: 'Programmatic access to system data',
        requiredFeatures: [FeatureType.API_ACCESS],
        allowedRoles: [UserRole.ADMIN, UserRole.PROFESSOR],
        component: 'APIAccess',
        route: '/dashboard/api'
    }
};

export class LMSModuleManager {
    private subscriptionManager: SubscriptionManager;
    private userSubscription: UserSubscription;

    constructor(userSubscription: UserSubscription) {
        this.userSubscription = userSubscription;
        this.subscriptionManager = new SubscriptionManager(userSubscription);
    }

    /**
     * Check if user has access to a specific module
     */
    hasModuleAccess(module: LMSModule): boolean {
        const moduleConfig = MODULE_REGISTRY[module];

        // Check if user role is allowed
        if (!moduleConfig.allowedRoles.includes(this.userSubscription.role)) {
            return false;
        }

        // Admins have access to all modules
        if (this.userSubscription.role === UserRole.ADMIN) {
            return true;
        }

        // Check if all required features are available
        return moduleConfig.requiredFeatures.every(feature =>
            this.subscriptionManager.hasFeature(feature)
        );
    }

    /**
     * Get all modules accessible by the user
     */
    getAccessibleModules(): LMSModule[] {
        return Object.keys(MODULE_REGISTRY)
            .filter(module => this.hasModuleAccess(module as LMSModule))
            .map(module => module as LMSModule);
    }

    /**
     * Get modules by role
     */
    getModulesByRole(role: UserRole): LMSModule[] {
        return Object.entries(MODULE_REGISTRY)
            .filter(([_, config]) => config.allowedRoles.includes(role))
            .map(([module]) => module as LMSModule);
    }

    /**
     * Get module configuration
     */
    getModuleConfig(module: LMSModule): ModuleConfig {
        return MODULE_REGISTRY[module];
    }

    /**
     * Get navigation items based on accessible modules
     */
    getNavigationItems(): Array<{
        module: LMSModule;
        name: string;
        route: string;
        accessible: boolean;
        requiresUpgrade?: boolean;
    }> {
        return Object.entries(MODULE_REGISTRY)
            .filter(([_, config]) => config.route) // Only include modules with routes
            .map(([module, config]) => {
                const accessible = this.hasModuleAccess(module as LMSModule);
                const requiresUpgrade = !accessible &&
                    config.allowedRoles.includes(this.userSubscription.role) &&
                    config.requiredFeatures.some(feature => !this.subscriptionManager.hasFeature(feature));

                return {
                    module: module as LMSModule,
                    name: config.name,
                    route: config.route!,
                    accessible,
                    requiresUpgrade
                };
            });
    }

    /**
     * Get upgrade suggestions for blocked modules
     */
    getUpgradeSuggestions(): Array<{
        module: LMSModule;
        name: string;
        missingFeatures: FeatureType[];
        upgradeMessage: string;
    }> {
        return Object.entries(MODULE_REGISTRY)
            .filter(([module, config]) =>
                !this.hasModuleAccess(module as LMSModule) &&
                config.allowedRoles.includes(this.userSubscription.role)
            )
            .map(([module, config]) => {
                const missingFeatures = config.requiredFeatures.filter(feature =>
                    !this.subscriptionManager.hasFeature(feature)
                );

                const getFeatureKey = (feature: FeatureType): "courses" | "assignments" | "discussions" | "students" => {
                    switch (feature) {
                        case FeatureType.COURSE_CREATION:
                            return "courses";
                        case FeatureType.ASSIGNMENT_CREATION:
                            return "assignments";
                        case FeatureType.DISCUSSION_CREATION:
                            return "discussions";
                        default:
                            return "students";
                    }
                };

                return {
                    module: module as LMSModule,
                    name: config.name,
                    missingFeatures,
                    upgradeMessage: missingFeatures.length > 0
                        ? this.subscriptionManager.getUpgradeMessage(getFeatureKey(missingFeatures[0]))
                        : 'Access restricted by role'
                };
            });
    }

    /**
     * Check if user can perform specific actions within a module
     */
    canPerformAction(module: LMSModule, action: string, context?: any): {
        canPerform: boolean;
        reason?: string;
        upgradeRequired?: boolean;
    } {
        // First check basic module access
        if (!this.hasModuleAccess(module)) {
            return {
                canPerform: false,
                reason: 'Module access not available',
                upgradeRequired: true
            };
        }

        // Module-specific action checks
        switch (module) {
            case LMSModule.COURSE_MANAGEMENT:
                if (action === 'create' && context?.currentCount) {
                    const courseLimit = this.subscriptionManager.getFeatures().maxCourses;
                    if (courseLimit && context.currentCount >= courseLimit) {
                        return {
                            canPerform: false,
                            reason: `Course limit reached (${courseLimit})`,
                            upgradeRequired: true
                        };
                    }
                }
                break;

            case LMSModule.ASSIGNMENT_SYSTEM:
                if (action === 'create' && context?.currentCount) {
                    const assignmentLimit = this.subscriptionManager.getFeatures().maxAssignments;
                    if (assignmentLimit && context.currentCount >= assignmentLimit) {
                        return {
                            canPerform: false,
                            reason: `Assignment limit reached (${assignmentLimit})`,
                            upgradeRequired: true
                        };
                    }
                }
                break;

            case LMSModule.AI_GRADING_ENGINE:
                if (action === 'grade' && context?.currentUsage) {
                    const aiGradingEnabled = this.subscriptionManager.getFeatures().aiGrading;
                    if (!aiGradingEnabled) {
                        return {
                            canPerform: false,
                            reason: 'AI grading feature not available',
                            upgradeRequired: true
                        };
                    }
                }
                break;
        }

        return { canPerform: true };
    }

    /**
     * Get module-specific limits
     */
    getModuleLimits(module: LMSModule): { maxAssignments?: number; maxCourses?: number; maxStudents?: number; maxDiscussions?: number; maxRubrics?: number; maxAnalytics?: number } | null {
        if (!this.hasModuleAccess(module)) {
            return null;
        }

        switch (module) {
            case LMSModule.ASSIGNMENT_SYSTEM:
                const assignmentLimit = this.subscriptionManager.getFeatures().maxAssignments;
                return { maxAssignments: assignmentLimit };

            case LMSModule.COURSE_MANAGEMENT:
                const courseLimit = this.subscriptionManager.getFeatures().maxCourses;
                return { maxCourses: courseLimit };

            case LMSModule.STUDENT_ENROLLMENT:
                const studentLimit = this.subscriptionManager.getFeatures().maxStudentsPerCourse;
                return { maxStudents: studentLimit };

            case LMSModule.DISCUSSION_FORUMS:
                const discussionLimit = this.subscriptionManager.getFeatures().maxDiscussions;
                return { maxDiscussions: discussionLimit };

            case LMSModule.RUBRIC_BUILDER:
                const customRubricsEnabled = this.subscriptionManager.getFeatures().customRubrics;
                return customRubricsEnabled ? {} : null;

            case LMSModule.ANALYTICS_DASHBOARD:
                const analyticsLimit = this.subscriptionManager.getFeatures().maxAnalytics;
                return { maxAnalytics: analyticsLimit };

            default:
                return {};
        }
    }
}

// Helper function to create module manager from user data
export function createModuleManager(userSubscription: UserSubscription): LMSModuleManager {
    return new LMSModuleManager(userSubscription);
}

// Export for use in components
export { FeatureType } from './subscription-manager';
export { UserRole } from '@prisma/client';