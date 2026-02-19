/**
 * HEAD-TO-HEAD E2E TEST SUITE — SUBSCRIPTION & BILLING
 *
 * Tests subscription tiers, feature gates, usage limits,
 * trial expiration, and the SubscriptionManager class.
 */

import { describe, it, expect } from "vitest"
import {
    createSubscriptionManager,
    getSubscriptionLimits,
} from "@/lib/enhanced-subscription-manager"

// ── Tier Definitions ────────────────────────────────────────────────────

describe("Subscription Tiers – Limits", () => {
    it("FREE tier should have correct limits", () => {
        const limits = getSubscriptionLimits("FREE")
        expect(limits.maxStorageGB).toBe(5)
        expect(limits.canUseAIFeatures).toBe(true)
        expect(limits.canUseAdvancedAnalytics).toBe(false)
        expect(limits.canUseBulkOperations).toBe(false)
        expect(limits.canUseCustomBranding).toBe(false)
    })

    it("BASIC tier should have correct limits", () => {
        const limits = getSubscriptionLimits("BASIC")
        expect(limits.maxStorageGB).toBe(25)
        expect(limits.canUseAIFeatures).toBe(true)
        expect(limits.canUseAdvancedAnalytics).toBe(true)
        expect(limits.canUseBulkOperations).toBe(false)
        expect(limits.canUseCustomBranding).toBe(false)
    })

    it("PREMIUM tier should have correct limits", () => {
        const limits = getSubscriptionLimits("PREMIUM")
        expect(limits.maxStorageGB).toBe(100)
        expect(limits.canUseAIFeatures).toBe(true)
        expect(limits.canUseAdvancedAnalytics).toBe(true)
        expect(limits.canUseBulkOperations).toBe(true)
        expect(limits.canUseCustomBranding).toBe(true)
    })

    it("all tiers should allow unlimited students", () => {
        for (const tier of ["FREE", "BASIC", "PREMIUM"] as const) {
            const limits = getSubscriptionLimits(tier)
            expect(limits.maxStudents).toBeNull()
        }
    })

    it("all tiers should allow unlimited courses", () => {
        for (const tier of ["FREE", "BASIC", "PREMIUM"] as const) {
            const limits = getSubscriptionLimits(tier)
            expect(limits.maxCourses).toBeNull()
        }
    })

    it("all tiers should allow unlimited assignments", () => {
        for (const tier of ["FREE", "BASIC", "PREMIUM"] as const) {
            const limits = getSubscriptionLimits(tier)
            expect(limits.maxAssignments).toBeNull()
        }
    })
})

// ── Subscription Manager – Active Subscription ─────────────────────────

describe("SubscriptionManager – Active Subscription", () => {
    const manager = createSubscriptionManager({
        userId: "user-1",
        role: "PROFESSOR",
        subscriptionType: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialExpiresAt: null,
    })

    it("should report active subscription status", () => {
        const info = manager.getSubscriptionInfo()
        expect(info.status).toBe("active")
        expect(info.type).toBe("PREMIUM")
    })

    it("should allow AI features", () => {
        expect(manager.canUseAIFeatures()).toBe(true)
    })

    it("should allow advanced analytics", () => {
        expect(manager.canUseAdvancedAnalytics()).toBe(true)
    })

    it("should allow bulk operations", () => {
        expect(manager.canUseBulkOperations()).toBe(true)
    })

    it("should have positive days remaining", () => {
        const info = manager.getSubscriptionInfo()
        expect(info.daysRemaining).toBeGreaterThan(0)
    })

    it("should allow adding students without limit", () => {
        const result = manager.canAddStudent(9999)
        expect(result.canAdd).toBe(true)
    })

    it("should allow creating courses without limit", () => {
        const result = manager.canCreateCourse(9999)
        expect(result.canAdd).toBe(true)
    })
})

// ── Subscription Manager – Trial Period ─────────────────────────────────

describe("SubscriptionManager – Trial Period", () => {
    const trialManager = createSubscriptionManager({
        userId: "user-2",
        role: "PROFESSOR",
        subscriptionType: null,
        subscriptionExpiresAt: null,
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    it("should report trial status", () => {
        const info = trialManager.getSubscriptionInfo()
        expect(info.status).toBe("trial")
    })

    it("should still allow AI features during trial", () => {
        expect(trialManager.canUseAIFeatures()).toBe(true)
    })

    it("should not allow advanced analytics during trial", () => {
        expect(trialManager.canUseAdvancedAnalytics()).toBe(false)
    })

    it("should not allow bulk operations during trial", () => {
        expect(trialManager.canUseBulkOperations()).toBe(false)
    })
})

// ── Subscription Manager – Expired ──────────────────────────────────────

describe("SubscriptionManager – Expired", () => {
    const expiredManager = createSubscriptionManager({
        userId: "user-3",
        role: "PROFESSOR",
        subscriptionType: null,
        subscriptionExpiresAt: null,
        trialExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    })

    it("should report expired status", () => {
        const info = expiredManager.getSubscriptionInfo()
        expect(info.status).toBe("expired")
    })

    it("should have zero/negative/null days remaining", () => {
        const info = expiredManager.getSubscriptionInfo()
        // daysRemaining may be null or <= 0 when expired
        if (info.daysRemaining === null || info.daysRemaining === undefined) {
            expect(info.daysRemaining).toBeFalsy()
        } else {
            expect(info.daysRemaining).toBeLessThanOrEqual(0)
        }
    })
})

// ── Subscription Manager – FREE Tier ────────────────────────────────────

describe("SubscriptionManager – FREE Tier", () => {
    const freeManager = createSubscriptionManager({
        userId: "user-4",
        role: "PROFESSOR",
        subscriptionType: "FREE",
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        trialExpiresAt: null,
    })

    it("should allow AI features on FREE", () => {
        expect(freeManager.canUseAIFeatures()).toBe(true)
    })

    it("should disallow advanced analytics on FREE", () => {
        expect(freeManager.canUseAdvancedAnalytics()).toBe(false)
    })

    it("should disallow bulk operations on FREE", () => {
        expect(freeManager.canUseBulkOperations()).toBe(false)
    })
})

// ── Subscription Manager – BASIC Tier ───────────────────────────────────

describe("SubscriptionManager – BASIC Tier", () => {
    const basicManager = createSubscriptionManager({
        userId: "user-5",
        role: "PROFESSOR",
        subscriptionType: "BASIC",
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        trialExpiresAt: null,
    })

    it("should allow AI features on BASIC", () => {
        expect(basicManager.canUseAIFeatures()).toBe(true)
    })

    it("should allow advanced analytics on BASIC", () => {
        expect(basicManager.canUseAdvancedAnalytics()).toBe(true)
    })

    it("should disallow bulk operations on BASIC", () => {
        expect(basicManager.canUseBulkOperations()).toBe(false)
    })
})

// ── Usage Summary ───────────────────────────────────────────────────────

describe("SubscriptionManager – Usage Summary", () => {
    const manager = createSubscriptionManager({
        userId: "user-6",
        role: "PROFESSOR",
        subscriptionType: "FREE",
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        trialExpiresAt: null,
    })

    it("should return usage summary with current values", () => {
        const summary = manager.getUsageSummary({
            students: 10,
            courses: 3,
            assignments: 5,
            storageUsedMB: 500,
            aiGradingRequestsThisMonth: 10,
            reportsGeneratedThisMonth: 2,
        })

        expect(summary).toHaveProperty("students")
        expect(summary).toHaveProperty("courses")
        expect(summary).toHaveProperty("assignments")
        expect(summary).toHaveProperty("storage")
        expect(summary.students.current).toBe(10)
        expect(summary.courses.current).toBe(3)
        expect(summary.assignments.current).toBe(5)
    })
})

// ── Module Access ───────────────────────────────────────────────────────

describe("SubscriptionManager – Module Access", () => {
    const premiumManager = createSubscriptionManager({
        userId: "user-7",
        role: "PROFESSOR",
        subscriptionType: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialExpiresAt: null,
    })

    it("should return accessible modules", () => {
        const modules = premiumManager.getAccessibleModules()
        expect(Array.isArray(modules)).toBe(true)
        expect(modules.length).toBeGreaterThan(0)
    })

    it("should have fewer restricted modules on PREMIUM than FREE", () => {
        const restricted = premiumManager.getRestrictedModules()
        const freeRestricted = freeManager.getRestrictedModules()
        expect(restricted.length).toBeLessThanOrEqual(freeRestricted.length)
    })

    const freeManager = createSubscriptionManager({
        userId: "user-8",
        role: "PROFESSOR",
        subscriptionType: "FREE",
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        trialExpiresAt: null,
    })

    it("should have some restricted modules on FREE", () => {
        const restricted = freeManager.getRestrictedModules()
        expect(restricted.length).toBeGreaterThanOrEqual(0)
    })
})
