/**
 * Subscription & Billing — E2E Tests
 * 
 * Tests: Tiered subscriptions, trial, Stripe, credits, feature gating, multi-tenant billing, usage
 * Run: npx tsx tests/e2e/subscription-billing.e2e.ts
 */

import {
    prisma, results, colors, log, logPhase,
    runTest, assert, assertDefined, assertEqual, assertGreaterThan,
    printReport, RUN_ID, TEST_EMAIL_PREFIX,
} from "./helpers"

let userId: string
let orgId: string

// ============================================================================
// SETUP
// ============================================================================
async function setup() {
    logPhase("SETUP — Subscription & Billing")

    await runTest("Create test user", "Setup", async () => {
        await prisma.user.deleteMany({ where: { email: `${TEST_EMAIL_PREFIX}-billing@profgenie.test` } })
        const user = await prisma.user.create({
            data: {
                email: `${TEST_EMAIL_PREFIX}-billing@profgenie.test`,
                name: "Billing Test User",
                role: "PROFESSOR",
                subscriptionType: "FREE",
                creditBalance: 0,
                monthlyCredits: 50,
            },
        })
        userId = user.id
        return `User ID: ${user.id}`
    })
}

// ============================================================================
// 1. TIERED SUBSCRIPTIONS
// ============================================================================
async function testTieredSubscriptions() {
    logPhase("1. TIERED SUBSCRIPTIONS — FREE / BASIC / PREMIUM")

    await runTest("Default subscription is FREE", "Subscriptions", async () => {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        assertDefined(user, "user")
        assertEqual(user.subscriptionType, "FREE", "subscriptionType")
        return "Default FREE verified"
    })

    await runTest("Upgrade to BASIC", "Subscriptions", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { subscriptionType: "BASIC" },
        })
        assertEqual(updated.subscriptionType, "BASIC", "subscriptionType")
        return "Upgraded to BASIC"
    })

    await runTest("Upgrade to PREMIUM", "Subscriptions", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { subscriptionType: "PREMIUM" },
        })
        assertEqual(updated.subscriptionType, "PREMIUM", "subscriptionType")
        return "Upgraded to PREMIUM"
    })

    await runTest("Downgrade back to FREE", "Subscriptions", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { subscriptionType: "FREE" },
        })
        assertEqual(updated.subscriptionType, "FREE", "subscriptionType")
        return "Downgraded to FREE"
    })

    await runTest("Create Subscription record (status flow)", "Subscriptions", async () => {
        const sub = await prisma.subscription.create({
            data: {
                userId,
                type: "BASIC",
                status: "TRIALING",
                trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
        })
        assertDefined(sub.id, "subscription id")
        assertEqual(sub.status, "TRIALING", "status")
        return `Subscription ID: ${sub.id}`
    })

    await runTest("Transition subscription: TRIALING → ACTIVE", "Subscriptions", async () => {
        const sub = await prisma.subscription.findUnique({ where: { userId } })
        assertDefined(sub, "subscription")
        const updated = await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "ACTIVE" },
        })
        assertEqual(updated.status, "ACTIVE", "status")
        return "TRIALING → ACTIVE"
    })

    await runTest("Transition subscription: ACTIVE → CANCELED", "Subscriptions", async () => {
        const sub = await prisma.subscription.findUnique({ where: { userId } })
        assertDefined(sub, "subscription")
        const updated = await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "CANCELED" },
        })
        assertEqual(updated.status, "CANCELED", "status")
        return "ACTIVE → CANCELED"
    })
}

// ============================================================================
// 2. FREE TRIAL
// ============================================================================
async function testFreeTrial() {
    logPhase("2. FREE TRIAL WITH EXPIRATION")

    await runTest("Set trial start and expiry", "Trial", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                trialStartedAt: new Date(),
                trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
        })
        assertDefined(updated.trialStartedAt, "trialStartedAt")
        assertDefined(updated.trialExpiresAt, "trialExpiresAt")
        assert(updated.trialExpiresAt! > new Date(), "Trial should not be expired yet")
        return "Trial set for 14 days"
    })

    await runTest("Detect active trial", "Trial", async () => {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        assertDefined(user, "user")
        const isActive = user.trialExpiresAt && user.trialExpiresAt > new Date()
        assertEqual(isActive, true, "trial active")
        return "Trial is active"
    })

    await runTest("Simulate expired trial", "Trial", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                trialExpiresAt: new Date(Date.now() - 1000),
            },
        })
        const isExpired = updated.trialExpiresAt && updated.trialExpiresAt <= new Date()
        assertEqual(isExpired, true, "trial expired")
        return "Trial expired correctly"
    })
}

// ============================================================================
// 3. STRIPE INTEGRATION
// ============================================================================
async function testStripeIntegration() {
    logPhase("3. STRIPE INTEGRATION FIELDS")

    await runTest("Store Stripe customer ID", "Stripe", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: `cus_test_${RUN_ID}` },
        })
        assertEqual(updated.stripeCustomerId, `cus_test_${RUN_ID}`, "stripeCustomerId")
        return "Stripe customer ID stored"
    })

    await runTest("Store Stripe subscription ID", "Stripe", async () => {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { stripeSubscriptionId: `sub_test_${RUN_ID}` },
        })
        assertEqual(updated.stripeSubscriptionId, `sub_test_${RUN_ID}`, "stripeSubscriptionId")
        return "Stripe subscription ID stored"
    })

    await runTest("UserSubscription with Stripe fields", "Stripe", async () => {
        const userSub = await prisma.userSubscription.create({
            data: {
                userId,
                tier: "PREMIUM",
                status: "ACTIVE",
                stripeCustomerId: `cus_test_${RUN_ID}`,
                stripeSubscriptionId: `sub_test_${RUN_ID}`,
                stripePriceId: `price_test_${RUN_ID}`,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                cancelAtPeriodEnd: false,
            },
        })
        assertDefined(userSub.id, "userSub id")
        assertEqual(userSub.tier, "PREMIUM", "tier")
        assertEqual(userSub.cancelAtPeriodEnd, false, "cancelAtPeriodEnd")
        return `UserSubscription ID: ${userSub.id}`
    })

    await runTest("Set cancel at period end", "Stripe", async () => {
        const updated = await prisma.userSubscription.update({
            where: { userId },
            data: { cancelAtPeriodEnd: true },
        })
        assertEqual(updated.cancelAtPeriodEnd, true, "cancelAtPeriodEnd")
        return "Cancel at period end set"
    })
}

// ============================================================================
// 4. CREDIT SYSTEM
// ============================================================================
async function testCreditSystem() {
    logPhase("4. CREDIT SYSTEM — AI USAGE")

    await runTest("Purchase credits", "Credits", async () => {
        const tx = await prisma.creditTransaction.create({
            data: {
                userId,
                amount: 500,
                type: "PURCHASE",
                description: "E2E test credit purchase",
            },
        })
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { creditBalance: { increment: 500 } },
        })
        assertDefined(tx.id, "transaction id")
        assertEqual(updated.creditBalance, 500, "creditBalance")
        return `TX ID: ${tx.id}, Balance: 500`
    })

    await runTest("Use credits (AI grading)", "Credits", async () => {
        const tx = await prisma.creditTransaction.create({
            data: {
                userId,
                amount: -10,
                type: "USAGE",
                description: "AI grading usage",
                featureType: "AI_GRADING",
            },
        })
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { creditBalance: { decrement: 10 } },
        })
        assertEqual(updated.creditBalance, 490, "creditBalance after usage")
        return "Credits used for AI grading"
    })

    await runTest("Bonus credits", "Credits", async () => {
        await prisma.creditTransaction.create({
            data: {
                userId,
                amount: 100,
                type: "BONUS",
                description: "Referral bonus",
            },
        })
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { creditBalance: { increment: 100 } },
        })
        assertEqual(updated.creditBalance, 590, "creditBalance after bonus")
        return "Bonus credits added"
    })

    await runTest("Refund credits", "Credits", async () => {
        await prisma.creditTransaction.create({
            data: {
                userId,
                amount: 10,
                type: "REFUND",
                description: "Service disruption refund",
            },
        })
        return "Refund transaction created"
    })

    await runTest("Verify credit transaction history", "Credits", async () => {
        const txs = await prisma.creditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
        })
        assert(txs.length >= 4, `Expected at least 4 transactions, got ${txs.length}`)
        const types = txs.map(t => t.type)
        assert(types.includes("PURCHASE"), "Missing PURCHASE")
        assert(types.includes("USAGE"), "Missing USAGE")
        assert(types.includes("BONUS"), "Missing BONUS")
        assert(types.includes("REFUND"), "Missing REFUND")
        return `${txs.length} transactions verified`
    })
}

// ============================================================================
// 5. FEATURE GATING
// ============================================================================
async function testFeatureGating() {
    logPhase("5. FEATURE GATING — PER-TIER LIMITS")

    const features: Array<{ type: any; limit: number; enabled: boolean }> = [
        { type: "COURSE_CREATION", limit: -1, enabled: true },
        { type: "AI_GRADING", limit: 200, enabled: true },
        { type: "ADVANCED_ANALYTICS", limit: -1, enabled: true },
        { type: "BULK_OPERATIONS", limit: 50, enabled: true },
        { type: "PLAGIARISM_DETECTION", limit: 100, enabled: true },
        { type: "PROFESSOR_STYLE_LEARNING", limit: -1, enabled: true },
        { type: "ORGANIZATION_MANAGEMENT", limit: -1, enabled: false },
    ]

    for (const feat of features) {
        await runTest(`Feature gate: ${feat.type}`, "Feature Gating", async () => {
            const sf = await prisma.subscriptionFeature.create({
                data: {
                    userId,
                    featureType: feat.type,
                    limit: feat.limit,
                    isEnabled: feat.enabled,
                },
            })
            assertDefined(sf.id, "feature id")
            assertEqual(sf.featureType, feat.type, "featureType")
            assertEqual(sf.isEnabled, feat.enabled, "isEnabled")
            return `${feat.type}: limit=${feat.limit}, enabled=${feat.enabled}`
        })
    }

    await runTest("Verify all feature types stored", "Feature Gating", async () => {
        const feats = await prisma.subscriptionFeature.findMany({
            where: { userId },
        })
        assertEqual(feats.length, features.length, "feature count")
        return `${feats.length} feature gates verified`
    })

    await runTest("Toggle feature off", "Feature Gating", async () => {
        await prisma.subscriptionFeature.update({
            where: { userId_featureType: { userId, featureType: "BULK_OPERATIONS" } },
            data: { isEnabled: false },
        })
        const feat = await prisma.subscriptionFeature.findUnique({
            where: { userId_featureType: { userId, featureType: "BULK_OPERATIONS" } },
        })
        assertDefined(feat, "feature")
        assertEqual(feat.isEnabled, false, "isEnabled")
        return "BULK_OPERATIONS disabled"
    })
}

// ============================================================================
// 6. MULTI-TENANT BILLING
// ============================================================================
async function testMultiTenantBilling() {
    logPhase("6. MULTI-TENANT BILLING")

    await runTest("Create organization", "Multi-Tenant", async () => {
        const org = await prisma.organization.create({
            data: {
                name: `E2E Test Org ${RUN_ID}`,
                domain: `e2e-${RUN_ID}.profgenie.test`,
                subscriptionType: "PREMIUM",
                creditBalance: 1000,
                monthlyCredits: 500,
            },
        })
        orgId = org.id
        assertDefined(org.id, "org id")
        return `Org ID: ${org.id}`
    })

    await runTest("Create org subscription", "Multi-Tenant", async () => {
        const sub = await prisma.orgSubscription.create({
            data: {
                orgId,
                tier: "ENTERPRISE",
                status: "ACTIVE",
                stripeCustomerId: `cus_org_${RUN_ID}`,
            },
        })
        assertEqual(sub.tier, "ENTERPRISE", "tier")
        assertEqual(sub.status, "ACTIVE", "status")
        return "Org subscription created"
    })

    await runTest("Create org usage counter", "Multi-Tenant", async () => {
        const counter = await prisma.orgUsageCounter.create({
            data: {
                orgId,
                studentsCount: 0,
                coursesCount: 0,
                assignmentsCount: 0,
                aiGradesCount: 0,
            },
        })
        assertDefined(counter.id, "counter id")
        return "Usage counter initialized"
    })

    await runTest("Increment org usage", "Multi-Tenant", async () => {
        const updated = await prisma.orgUsageCounter.update({
            where: { orgId },
            data: {
                studentsCount: { increment: 25 },
                coursesCount: { increment: 5 },
                aiGradesCount: { increment: 100 },
            },
        })
        assertEqual(updated.studentsCount, 25, "studentsCount")
        assertEqual(updated.coursesCount, 5, "coursesCount")
        assertEqual(updated.aiGradesCount, 100, "aiGradesCount")
        return "Org usage incremented"
    })

    await runTest("Org credit transaction", "Multi-Tenant", async () => {
        const tx = await prisma.creditTransaction.create({
            data: {
                organizationId: orgId,
                amount: -50,
                type: "USAGE",
                description: "Org-level AI usage",
                featureType: "AI_GRADING",
            },
        })
        assertDefined(tx.id, "tx id")
        assertEqual(tx.organizationId, orgId, "organizationId")
        return "Org credit transaction recorded"
    })
}

// ============================================================================
// 7. USER USAGE TRACKING
// ============================================================================
async function testUsageTracking() {
    logPhase("7. USER USAGE TRACKING")

    await runTest("Create user usage counter", "Usage Tracking", async () => {
        const counter = await prisma.userUsageCounter.create({
            data: {
                userId,
                coursesCount: 0,
                assignmentsCount: 0,
                aiGradesCount: 0,
            },
        })
        assertDefined(counter.id, "counter id")
        return "User usage counter created"
    })

    await runTest("Increment user usage", "Usage Tracking", async () => {
        const updated = await prisma.userUsageCounter.update({
            where: { userId },
            data: {
                coursesCount: { increment: 3 },
                assignmentsCount: { increment: 12 },
                aiGradesCount: { increment: 45 },
            },
        })
        assertEqual(updated.coursesCount, 3, "coursesCount")
        assertEqual(updated.assignmentsCount, 12, "assignmentsCount")
        assertEqual(updated.aiGradesCount, 45, "aiGradesCount")
        return "User usage incremented"
    })

    await runTest("Verify user → usage relation", "Usage Tracking", async () => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userUsage: true },
        })
        assertDefined(user, "user")
        assertDefined(user.userUsage, "userUsage")
        assertEqual(user.userUsage.aiGradesCount, 45, "aiGradesCount")
        return "User usage linked"
    })
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup() {
    logPhase("CLEANUP — Subscription & Billing")

    await runTest("Remove all test data", "Cleanup", async () => {
        await prisma.creditTransaction.deleteMany({ where: { userId } })
        await prisma.creditTransaction.deleteMany({ where: { organizationId: orgId } })
        await prisma.subscriptionFeature.deleteMany({ where: { userId } })
        await prisma.userUsageCounter.deleteMany({ where: { userId } })
        await prisma.userSubscription.deleteMany({ where: { userId } })
        await prisma.subscription.deleteMany({ where: { userId } })
        await prisma.orgUsageCounter.deleteMany({ where: { orgId } })
        await prisma.orgSubscription.deleteMany({ where: { orgId } })
        await prisma.organizationUsageCounter.deleteMany({ where: { organizationId: orgId } })
        await prisma.organization.deleteMany({ where: { id: orgId } })
        await prisma.user.deleteMany({ where: { id: userId } })
        return "All billing test data cleaned"
    })
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    log(`\n${colors.bold}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
    log(`${colors.bold}${colors.magenta}║   SUBSCRIPTION & BILLING — E2E TEST SUITE                    ║${colors.reset}`)
    log(`${colors.bold}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`)

    try {
        await setup()
        await testTieredSubscriptions()
        await testFreeTrial()
        await testStripeIntegration()
        await testCreditSystem()
        await testFeatureGating()
        await testMultiTenantBilling()
        await testUsageTracking()
    } finally {
        await cleanup()
        const allPassed = printReport("SUBSCRIPTION & BILLING")
        await prisma.$disconnect()
        process.exit(allPassed ? 0 : 1)
    }
}

main()
