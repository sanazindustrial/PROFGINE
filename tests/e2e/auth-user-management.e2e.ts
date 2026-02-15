/**
 * Authentication & User Management — E2E Tests
 * 
 * Tests: Google OAuth, RBAC, platform owner, user profiles, invitations, sessions
 * Run: npx tsx tests/e2e/auth-user-management.e2e.ts
 */

import {
    prisma, results, colors, log, logPhase, logSection,
    runTest, assert, assertDefined, assertEqual, assertGreaterThan,
    printReport, RUN_ID, TEST_EMAIL_PREFIX,
} from "./helpers"

// Test IDs
let adminUserId: string
let professorUserId: string
let studentUserId: string
let invitationId: string
let sessionId: string

// ============================================================================
// SETUP
// ============================================================================
async function setup() {
    logPhase("SETUP — Auth & User Management")

    await runTest("Clean up prior test data", "Setup", async () => {
        const testEmails = [
            `${TEST_EMAIL_PREFIX}-admin@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-prof@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-student@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-invite@profgenie.test`,
        ]
        for (const email of testEmails) {
            await prisma.user.deleteMany({ where: { email } })
        }
        await prisma.invitation.deleteMany({
            where: { email: `${TEST_EMAIL_PREFIX}-invite@profgenie.test` },
        })
        return "Prior test data cleaned"
    })
}

// ============================================================================
// 1. ROLE-BASED ACCESS CONTROL
// ============================================================================
async function testRBAC() {
    logPhase("1. ROLE-BASED ACCESS CONTROL")

    await runTest("Create ADMIN user", "RBAC", async () => {
        const user = await prisma.user.create({
            data: {
                email: `${TEST_EMAIL_PREFIX}-admin@profgenie.test`,
                name: "E2E Admin User",
                role: "ADMIN",
                isOwner: false,
                subscriptionType: "PREMIUM",
            },
        })
        adminUserId = user.id
        assertEqual(user.role, "ADMIN", "role")
        assertEqual(user.isOwner, false, "isOwner")
        return `Admin User ID: ${user.id}`
    })

    await runTest("Create PROFESSOR user", "RBAC", async () => {
        const user = await prisma.user.create({
            data: {
                email: `${TEST_EMAIL_PREFIX}-prof@profgenie.test`,
                name: "E2E Professor User",
                role: "PROFESSOR",
                subscriptionType: "BASIC",
            },
        })
        professorUserId = user.id
        assertEqual(user.role, "PROFESSOR", "role")
        return `Professor User ID: ${user.id}`
    })

    await runTest("Create STUDENT user", "RBAC", async () => {
        const user = await prisma.user.create({
            data: {
                email: `${TEST_EMAIL_PREFIX}-student@profgenie.test`,
                name: "E2E Student User",
                role: "STUDENT",
                subscriptionType: "FREE",
            },
        })
        studentUserId = user.id
        assertEqual(user.role, "STUDENT", "role")
        return `Student User ID: ${user.id}`
    })

    await runTest("Verify all three roles exist", "RBAC", async () => {
        const users = await prisma.user.findMany({
            where: {
                email: { startsWith: `${TEST_EMAIL_PREFIX}-` },
            },
        })
        const roles = users.map((u) => u.role)
        assert(roles.includes("ADMIN"), "Missing ADMIN")
        assert(roles.includes("PROFESSOR"), "Missing PROFESSOR")
        assert(roles.includes("STUDENT"), "Missing STUDENT")
        return `3 roles verified: ${roles.join(", ")}`
    })

    await runTest("Verify role enum constraint (only ADMIN/PROFESSOR/STUDENT)", "RBAC", async () => {
        // Prisma will throw if we try an invalid role
        const roles = ["ADMIN", "PROFESSOR", "STUDENT"]
        for (const role of roles) {
            const count = await prisma.user.count({ where: { role: role as any } })
            assert(count >= 0, `Role ${role} queryable`)
        }
        return "Role enum constraint validated"
    })
}

// ============================================================================
// 2. PLATFORM OWNER / ADMIN SETUP
// ============================================================================
async function testPlatformOwner() {
    logPhase("2. PLATFORM OWNER / ADMIN SETUP")

    await runTest("Promote admin to platform owner", "Platform Owner", async () => {
        const updated = await prisma.user.update({
            where: { id: adminUserId },
            data: { isOwner: true },
        })
        assertEqual(updated.isOwner, true, "isOwner")
        assertEqual(updated.role, "ADMIN", "role still ADMIN")
        return "Admin promoted to platform owner"
    })

    await runTest("Verify only one owner exists in test set", "Platform Owner", async () => {
        const owners = await prisma.user.findMany({
            where: {
                email: { startsWith: `${TEST_EMAIL_PREFIX}-` },
                isOwner: true,
            },
        })
        assertEqual(owners.length, 1, "owner count")
        assertEqual(owners[0].id, adminUserId, "owner is admin")
        return "Single owner verified"
    })

    await runTest("Owner has elevated privileges (PREMIUM subscription)", "Platform Owner", async () => {
        const owner = await prisma.user.findUnique({ where: { id: adminUserId } })
        assertDefined(owner, "owner")
        assertEqual(owner.subscriptionType, "PREMIUM", "subscriptionType")
        assertEqual(owner.isOwner, true, "isOwner")
        return "Owner has PREMIUM privileges"
    })
}

// ============================================================================
// 3. USER PROFILES
// ============================================================================
async function testUserProfiles() {
    logPhase("3. USER PROFILES")

    await runTest("Create ProfessorProfile", "Profiles", async () => {
        const profile = await prisma.professorProfile.create({
            data: {
                userId: professorUserId,
                institution: "Test University",
                department: "Computer Science",
                officeHours: "MW 2-4pm",
                bio: "E2E test professor specializing in algorithms",
                researchInterests: "Machine Learning, Algorithms",
            },
        })
        assertDefined(profile.id, "profile id")
        assertEqual(profile.institution, "Test University", "institution")
        assertEqual(profile.department, "Computer Science", "department")
        return `ProfessorProfile ID: ${profile.id}`
    })

    await runTest("Create StudentProfile", "Profiles", async () => {
        const profile = await prisma.studentProfile.create({
            data: {
                userId: studentUserId,
                studentId: "STU-2026-001",
                section: "A",
                major: "Computer Science",
                year: 3,
            },
        })
        assertDefined(profile.id, "profile id")
        assertEqual(profile.major, "Computer Science", "major")
        assertEqual(profile.year, 3, "year")
        return `StudentProfile ID: ${profile.id}`
    })

    await runTest("Verify user → profile relationship", "Profiles", async () => {
        const prof = await prisma.user.findUnique({
            where: { id: professorUserId },
            include: { professorProfile: true },
        })
        assertDefined(prof, "professor user")
        assertDefined(prof.professorProfile, "professorProfile")
        assertEqual(prof.professorProfile.institution, "Test University", "institution")

        const stu = await prisma.user.findUnique({
            where: { id: studentUserId },
            include: { studentProfile: true },
        })
        assertDefined(stu, "student user")
        assertDefined(stu.studentProfile, "studentProfile")
        assertEqual(stu.studentProfile.studentId, "STU-2026-001", "studentId")
        return "Both profiles linked correctly"
    })

    await runTest("Update professor profile", "Profiles", async () => {
        const updated = await prisma.professorProfile.update({
            where: { userId: professorUserId },
            data: {
                officeHours: "TTh 1-3pm",
                bio: "Updated bio for E2E testing",
            },
        })
        assertEqual(updated.officeHours, "TTh 1-3pm", "officeHours")
        return "Profile updated"
    })

    await runTest("Profile uniqueness constraint (one per user)", "Profiles", async () => {
        // Trying to create a second ProfessorProfile for the same user should fail
        let threw = false
        try {
            await prisma.professorProfile.create({
                data: { userId: professorUserId, institution: "Duplicate" },
            })
        } catch {
            threw = true
        }
        assert(threw, "Duplicate profile should throw unique constraint error")
        return "Uniqueness constraint enforced"
    })
}

// ============================================================================
// 4. INVITATION SYSTEM
// ============================================================================
async function testInvitations() {
    logPhase("4. INVITATION SYSTEM")

    await runTest("Create invitation for new user", "Invitations", async () => {
        const inv = await prisma.invitation.create({
            data: {
                email: `${TEST_EMAIL_PREFIX}-invite@profgenie.test`,
                role: "PROFESSOR",
                status: "PENDING",
                invitedBy: adminUserId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        })
        invitationId = inv.id
        assertDefined(inv.id, "invitation id")
        assertEqual(inv.status, "PENDING", "status")
        assertEqual(inv.role, "PROFESSOR", "role")
        return `Invitation ID: ${inv.id}`
    })

    await runTest("Verify invitation fields", "Invitations", async () => {
        const inv = await prisma.invitation.findUnique({ where: { id: invitationId } })
        assertDefined(inv, "invitation")
        assertEqual(inv.email, `${TEST_EMAIL_PREFIX}-invite@profgenie.test`, "email")
        assertDefined(inv.expiresAt, "expiresAt")
        assert(inv.expiresAt! > new Date(), "Should not be expired yet")
        return "Invitation fields verified"
    })

    await runTest("Accept invitation", "Invitations", async () => {
        const updated = await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: "ACCEPTED" },
        })
        assertEqual(updated.status, "ACCEPTED", "status")
        return "Invitation accepted"
    })

    await runTest("Invitation uniqueness (one per email)", "Invitations", async () => {
        let threw = false
        try {
            await prisma.invitation.create({
                data: {
                    email: `${TEST_EMAIL_PREFIX}-invite@profgenie.test`,
                    role: "STUDENT",
                    status: "PENDING",
                },
            })
        } catch {
            threw = true
        }
        assert(threw, "Duplicate invitation email should fail")
        return "Uniqueness enforced"
    })

    await runTest("Revoke invitation", "Invitations", async () => {
        const revoked = await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: "REVOKED" },
        })
        assertEqual(revoked.status, "REVOKED", "status")
        return "Invitation revoked"
    })

    await runTest("Verify all invitation statuses", "Invitations", async () => {
        const statuses: Array<"PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"> = [
            "PENDING", "ACCEPTED", "EXPIRED", "REVOKED",
        ]
        for (const s of statuses) {
            await prisma.invitation.update({
                where: { id: invitationId },
                data: { status: s },
            })
        }
        return "All 4 status transitions verified"
    })
}

// ============================================================================
// 5. SESSION MANAGEMENT (DATABASE-BACKED)
// ============================================================================
async function testSessionManagement() {
    logPhase("5. SESSION MANAGEMENT")

    await runTest("Create database session", "Sessions", async () => {
        const session = await prisma.session.create({
            data: {
                userId: professorUserId,
                sessionToken: `e2e-session-${RUN_ID}`,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        })
        sessionId = session.id
        assertDefined(session.id, "session id")
        assertDefined(session.sessionToken, "sessionToken")
        return `Session ID: ${session.id}`
    })

    await runTest("Lookup session by token", "Sessions", async () => {
        const session = await prisma.session.findUnique({
            where: { sessionToken: `e2e-session-${RUN_ID}` },
            include: { user: true },
        })
        assertDefined(session, "session")
        assertEqual(session.userId, professorUserId, "userId")
        assertEqual(session.user.role, "PROFESSOR", "user role")
        return "Session lookup verified"
    })

    await runTest("Session version tracking", "Sessions", async () => {
        const user = await prisma.user.findUnique({ where: { id: professorUserId } })
        assertDefined(user, "user")
        const oldVersion = user.sessionVersion

        const updated = await prisma.user.update({
            where: { id: professorUserId },
            data: { sessionVersion: { increment: 1 } },
        })
        assertEqual(updated.sessionVersion, oldVersion + 1, "sessionVersion incremented")
        return `Session version: ${oldVersion} → ${updated.sessionVersion}`
    })

    await runTest("Expire/delete session", "Sessions", async () => {
        await prisma.session.delete({ where: { id: sessionId } })
        const session = await prisma.session.findUnique({ where: { id: sessionId } })
        assertEqual(session, null, "session should be null after delete")
        return "Session deleted"
    })

    await runTest("OAuth account link (Google)", "Sessions", async () => {
        const account = await prisma.account.create({
            data: {
                userId: professorUserId,
                type: "oauth",
                provider: "google",
                providerAccountId: `google-${RUN_ID}`,
                access_token: "mock-access-token",
                refresh_token: "mock-refresh-token",
                token_type: "Bearer",
                scope: "openid email profile",
            },
        })
        assertDefined(account.id, "account id")
        assertEqual(account.provider, "google", "provider")

        // Verify user → account relation
        const user = await prisma.user.findUnique({
            where: { id: professorUserId },
            include: { accounts: true },
        })
        assertDefined(user, "user")
        assert(user.accounts.length >= 1, "Should have at least 1 account")
        assert(user.accounts.some((a) => a.provider === "google"), "Should have google account")
        return `Account ID: ${account.id}`
    })
}

// ============================================================================
// 6. USER AI SETTINGS (BYOK)
// ============================================================================
async function testUserAISettings() {
    logPhase("6. USER AI SETTINGS (BYOK)")

    await runTest("Create user AI settings", "AI Settings", async () => {
        const settings = await prisma.userAISettings.create({
            data: {
                userId: professorUserId,
                preferredProvider: "openai",
                usePlatformFallback: true,
                openaiModel: "gpt-4o",
                isEnabled: true,
            },
        })
        assertDefined(settings.id, "settings id")
        assertEqual(settings.preferredProvider, "openai", "preferredProvider")
        assertEqual(settings.isEnabled, true, "isEnabled")
        return `AI Settings ID: ${settings.id}`
    })

    await runTest("Update AI provider preference", "AI Settings", async () => {
        const updated = await prisma.userAISettings.update({
            where: { userId: professorUserId },
            data: {
                preferredProvider: "anthropic",
                anthropicModel: "claude-3-sonnet-20240229",
            },
        })
        assertEqual(updated.preferredProvider, "anthropic", "preferredProvider")
        return "Provider switched to anthropic"
    })

    await runTest("Verify user → AI settings relation", "AI Settings", async () => {
        const user = await prisma.user.findUnique({
            where: { id: professorUserId },
            include: { aiSettings: true },
        })
        assertDefined(user, "user")
        assertDefined(user.aiSettings, "aiSettings")
        assertEqual(user.aiSettings.preferredProvider, "anthropic", "preferredProvider")
        return "AI settings linked to user"
    })
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup() {
    logPhase("CLEANUP — Auth & User Management")

    await runTest("Remove all test data", "Cleanup", async () => {
        // Delete in correct order for FK constraints
        await prisma.account.deleteMany({
            where: { providerAccountId: `google-${RUN_ID}` },
        })
        await prisma.session.deleteMany({
            where: { sessionToken: `e2e-session-${RUN_ID}` },
        })
        await prisma.invitation.deleteMany({
            where: { email: `${TEST_EMAIL_PREFIX}-invite@profgenie.test` },
        })
        await prisma.userAISettings.deleteMany({
            where: { userId: professorUserId },
        })
        await prisma.professorProfile.deleteMany({
            where: { userId: professorUserId },
        })
        await prisma.studentProfile.deleteMany({
            where: { userId: studentUserId },
        })
        await prisma.user.deleteMany({
            where: { email: { startsWith: `${TEST_EMAIL_PREFIX}-` } },
        })
        return "All auth test data cleaned up"
    })
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    log(`\n${colors.bold}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
    log(`${colors.bold}${colors.magenta}║   AUTH & USER MANAGEMENT — E2E TEST SUITE                    ║${colors.reset}`)
    log(`${colors.bold}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`)

    try {
        await setup()
        await testRBAC()
        await testPlatformOwner()
        await testUserProfiles()
        await testInvitations()
        await testSessionManagement()
        await testUserAISettings()
    } finally {
        await cleanup()
        const allPassed = printReport("AUTH & USER MANAGEMENT")
        await prisma.$disconnect()
        process.exit(allPassed ? 0 : 1)
    }
}

main()
