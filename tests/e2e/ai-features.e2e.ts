/**
 * AI-Powered Features — E2E Tests
 * 
 * Tests: Professor style, user AI settings, AI content generation flags,
 *        discussion response, grading assist, curriculum/objective gen
 * Run: npx tsx tests/e2e/ai-features.e2e.ts
 */

import {
    prisma, results, colors, log, logPhase,
    runTest, assert, assertDefined, assertEqual,
    printReport, RUN_ID, TEST_EMAIL_PREFIX,
} from "./helpers"

let professorId: string
let courseId: string
let courseDesignId: string

// ============================================================================
// SETUP
// ============================================================================
async function setup() {
    logPhase("SETUP — AI Features")

    await runTest("Create test fixtures", "Setup", async () => {
        await prisma.user.deleteMany({ where: { email: `${TEST_EMAIL_PREFIX}-ai@profgenie.test` } })
        const user = await prisma.user.create({
            data: {
                email: `${TEST_EMAIL_PREFIX}-ai@profgenie.test`,
                name: "AI Test Professor",
                role: "PROFESSOR",
                subscriptionType: "PREMIUM",
                creditBalance: 500,
            },
        })
        professorId = user.id

        const course = await prisma.course.create({
            data: {
                title: "E2E AI Features Course",
                instructorId: professorId,
            },
        })
        courseId = course.id

        const design = await prisma.courseDesignMetadata.create({
            data: {
                courseId,
                creditHours: 3,
                academicLevel: "GRADUATE",
                deliveryMode: "ONLINE",
                formattingStandard: "APA",
                aiUsagePolicy: "PERMITTED_WITH_DISCLOSURE",
            },
        })
        courseDesignId = design.id
        return `Prof: ${professorId}, Course: ${courseId}`
    })
}

// ============================================================================
// 1. PROFESSOR STYLE LEARNING
// ============================================================================
async function testProfessorStyle() {
    logPhase("1. PROFESSOR STYLE LEARNING")

    await runTest("Create professor style profile", "Professor Style", async () => {
        const style = await prisma.professorStyle.create({
            data: {
                professorId,
                gradingDifficulty: "HARD",
                feedbackDepth: "COMPREHENSIVE",
                personality: "ANALYTICAL",
                customPromptTemplate: "Grade as a strict but fair professor who values critical thinking.",
                keyEvaluationCriteria: ["Critical Analysis", "Evidence-Based Arguments", "APA Formatting"],
            },
        })
        assertDefined(style.id, "style id")
        assertEqual(style.gradingDifficulty, "HARD", "gradingDifficulty")
        assertEqual(style.feedbackDepth, "COMPREHENSIVE", "feedbackDepth")
        assertEqual(style.personality, "ANALYTICAL", "personality")
        assert(style.keyEvaluationCriteria.includes("Critical Analysis"), "Has criteria")
        return `Style ID: ${style.id}`
    })

    await runTest("Update grading difficulty", "Professor Style", async () => {
        const updated = await prisma.professorStyle.update({
            where: { professorId },
            data: { gradingDifficulty: "MEDIUM" },
        })
        assertEqual(updated.gradingDifficulty, "MEDIUM", "gradingDifficulty")
        return "Difficulty updated to MEDIUM"
    })

    await runTest("Verify all personality types", "Professor Style", async () => {
        const personalities = [
            "ENCOURAGING", "CRITICAL", "ANALYTICAL", "SUPPORTIVE", "DETAILED", "CONCISE",
        ] as const
        for (const p of personalities) {
            await prisma.professorStyle.update({
                where: { professorId },
                data: { personality: p },
            })
        }
        return `${personalities.length} personality types verified`
    })

    await runTest("Verify all feedback depths", "Professor Style", async () => {
        const depths = ["LIGHT", "MODERATE", "DEEP", "COMPREHENSIVE"] as const
        for (const d of depths) {
            await prisma.professorStyle.update({
                where: { professorId },
                data: { feedbackDepth: d },
            })
        }
        return `${depths.length} feedback depths verified`
    })

    await runTest("User → professorStyle relationship", "Professor Style", async () => {
        const user = await prisma.user.findUnique({
            where: { id: professorId },
            include: { professorStyle: true },
        })
        assertDefined(user, "user")
        assertDefined(user.professorStyle, "professorStyle")
        return "Style profile linked to user"
    })
}

// ============================================================================
// 2. USER AI SETTINGS (BYOK)
// ============================================================================
async function testUserAISettings() {
    logPhase("2. USER AI SETTINGS (BYOK)")

    await runTest("Create AI settings with multiple providers", "AI Settings", async () => {
        const settings = await prisma.userAISettings.create({
            data: {
                userId: professorId,
                preferredProvider: "openai",
                usePlatformFallback: true,
                openaiModel: "gpt-4o",
                anthropicModel: "claude-3-sonnet-20240229",
                isEnabled: true,
            },
        })
        assertDefined(settings.id, "settings id")
        assertEqual(settings.preferredProvider, "openai", "preferredProvider")
        assertEqual(settings.usePlatformFallback, true, "usePlatformFallback")
        return `Settings ID: ${settings.id}`
    })

    await runTest("Switch provider to anthropic", "AI Settings", async () => {
        const updated = await prisma.userAISettings.update({
            where: { userId: professorId },
            data: { preferredProvider: "anthropic" },
        })
        assertEqual(updated.preferredProvider, "anthropic", "preferredProvider")
        return "Switched to anthropic"
    })

    await runTest("Disable custom keys (use platform)", "AI Settings", async () => {
        const updated = await prisma.userAISettings.update({
            where: { userId: professorId },
            data: {
                isEnabled: false,
                preferredProvider: "platform",
            },
        })
        assertEqual(updated.isEnabled, false, "isEnabled")
        assertEqual(updated.preferredProvider, "platform", "preferredProvider")
        return "Custom keys disabled"
    })
}

// ============================================================================
// 3. AI OBJECTIVE GENERATION (Bloom's Taxonomy)
// ============================================================================
async function testAIObjectiveGeneration() {
    logPhase("3. AI OBJECTIVE GENERATION (Bloom's Taxonomy)")

    const objectives = [
        { num: "1.1", desc: "Recall fundamental data structures", bloom: "REMEMBER" as const },
        { num: "1.2", desc: "Explain the time complexity of sorting algorithms", bloom: "UNDERSTAND" as const },
        { num: "2.1", desc: "Apply dynamic programming to optimization problems", bloom: "APPLY" as const },
        { num: "2.2", desc: "Analyze the efficiency of graph algorithms", bloom: "ANALYZE" as const },
        { num: "3.1", desc: "Evaluate algorithm designs for real-world constraints", bloom: "EVALUATE" as const },
        { num: "3.2", desc: "Design a novel algorithm for a given problem domain", bloom: "CREATE" as const },
    ]

    for (const obj of objectives) {
        await runTest(`Generate objective ${obj.num} (${obj.bloom})`, "AI Objectives", async () => {
            const created = await prisma.courseObjective.create({
                data: {
                    courseDesignId,
                    objectiveNumber: obj.num,
                    description: obj.desc,
                    bloomsLevel: obj.bloom,
                    isAIGenerated: true,
                    isApproved: false,
                    orderIndex: parseInt(obj.num.replace(".", "")),
                },
            })
            assertDefined(created.id, "objective id")
            assertEqual(created.bloomsLevel, obj.bloom, "bloomsLevel")
            assertEqual(created.isAIGenerated, true, "isAIGenerated")
            return `Objective ${obj.num}: ${obj.bloom}`
        })
    }

    await runTest("Verify all 6 Bloom's levels covered", "AI Objectives", async () => {
        const objs = await prisma.courseObjective.findMany({
            where: { courseDesignId },
        })
        const levels = [...new Set(objs.map(o => o.bloomsLevel))]
        assertEqual(levels.length, 6, "unique Bloom's levels")
        return `All 6 levels: ${levels.join(", ")}`
    })

    await runTest("Approve AI-generated objectives", "AI Objectives", async () => {
        await prisma.courseObjective.updateMany({
            where: { courseDesignId, isAIGenerated: true },
            data: { isApproved: true, approvedBy: professorId, approvedAt: new Date() },
        })
        const approved = await prisma.courseObjective.count({
            where: { courseDesignId, isApproved: true },
        })
        assertEqual(approved, 6, "approved count")
        return "All objectives approved"
    })
}

// ============================================================================
// 4. AI CONTENT GENERATION
// ============================================================================
async function testAIContentGeneration() {
    logPhase("4. AI CONTENT GENERATION")

    let sectionId: string

    await runTest("Create section for AI content", "AI Content", async () => {
        const section = await prisma.courseDesignSection.create({
            data: {
                courseDesignId,
                title: "AI Content Test Section",
                sectionType: "MODULE",
                orderIndex: 0,
            },
        })
        sectionId = section.id
        return `Section ID: ${section.id}`
    })

    await runTest("AI-generated lecture notes with disclosure", "AI Content", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId,
                contentType: "LECTURE",
                title: "AI-Generated Lecture: Graph Theory",
                content: "<h1>Graph Theory</h1><p>AI-generated content...</p>",
                aiGeneratedContent: "Full AI output with citations...",
                isAIGenerated: true,
                aiDisclosureAdded: true,
                citationRequired: true,
                orderIndex: 0,
            },
        })
        assertEqual(content.isAIGenerated, true, "isAIGenerated")
        assertEqual(content.aiDisclosureAdded, true, "aiDisclosureAdded")
        assertEqual(content.citationRequired, true, "citationRequired")
        return "AI lecture with disclosure created"
    })

    await runTest("Human-authored content (no disclosure needed)", "AI Content", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId,
                contentType: "READING",
                title: "Instructor Reading Notes",
                content: "Professor's own notes...",
                isAIGenerated: false,
                aiDisclosureAdded: false,
                orderIndex: 1,
            },
        })
        assertEqual(content.isAIGenerated, false, "isAIGenerated")
        assertEqual(content.aiDisclosureAdded, false, "aiDisclosureAdded")
        return "Human content created (no disclosure)"
    })

    await runTest("Verify AI disclosure governance", "AI Content", async () => {
        const aiContent = await prisma.sectionContent.findMany({
            where: { sectionId, isAIGenerated: true },
        })
        for (const c of aiContent) {
            assert(c.aiDisclosureAdded, `AI content "${c.title}" must have disclosure`)
        }
        return `${aiContent.length} AI items verified with disclosure`
    })
}

// ============================================================================
// 5. AI AUDIT TRAILING
// ============================================================================
async function testAIAuditTrail() {
    logPhase("5. AI AUDIT TRAILING")

    await runTest("Log AI generation action", "AI Audit", async () => {
        const log = await prisma.courseAuditLog.create({
            data: {
                courseDesignId,
                userId: professorId,
                action: "AI_GENERATE",
                targetType: "objective",
                targetId: "test-obj",
                aiProvider: "openai",
                aiPrompt: "Generate Bloom's-aligned objectives for graduate algorithms",
            },
        })
        assertDefined(log.id, "log id")
        assertEqual(log.action, "AI_GENERATE", "action")
        assertDefined(log.aiProvider, "aiProvider")
        assertDefined(log.aiPrompt, "aiPrompt")
        return `Audit log ID: ${log.id}`
    })

    await runTest("Log AI refinement action", "AI Audit", async () => {
        const log = await prisma.courseAuditLog.create({
            data: {
                courseDesignId,
                userId: professorId,
                action: "AI_REFINE",
                targetType: "lecture_content",
                targetId: "test-content",
                aiProvider: "anthropic",
                aiPrompt: "Refine lecture notes for clarity",
                previousValue: JSON.stringify({ title: "Draft v1" }),
                newValue: JSON.stringify({ title: "Refined v2" }),
            },
        })
        assertEqual(log.action, "AI_REFINE", "action")
        return "AI refinement logged"
    })

    await runTest("Verify AI audit trail", "AI Audit", async () => {
        const logs = await prisma.courseAuditLog.findMany({
            where: { courseDesignId },
            orderBy: { createdAt: "asc" },
        })
        assert(logs.length >= 2, "Should have ≥2 audit entries")
        const actions = logs.map(l => l.action)
        assert(actions.includes("AI_GENERATE"), "Should have AI_GENERATE")
        assert(actions.includes("AI_REFINE"), "Should have AI_REFINE")
        return `${logs.length} AI audit entries verified`
    })
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup() {
    logPhase("CLEANUP — AI Features")

    await runTest("Remove all test data", "Cleanup", async () => {
        await prisma.courseDesignMetadata.deleteMany({ where: { courseId } })
        await prisma.userAISettings.deleteMany({ where: { userId: professorId } })
        await prisma.professorStyle.deleteMany({ where: { professorId } })
        await prisma.course.deleteMany({ where: { id: courseId } })
        await prisma.user.deleteMany({ where: { id: professorId } })
        return "All AI test data cleaned"
    })
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    log(`\n${colors.bold}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
    log(`${colors.bold}${colors.magenta}║   AI-POWERED FEATURES — E2E TEST SUITE                       ║${colors.reset}`)
    log(`${colors.bold}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`)

    try {
        await setup()
        await testProfessorStyle()
        await testUserAISettings()
        await testAIObjectiveGeneration()
        await testAIContentGeneration()
        await testAIAuditTrail()
    } finally {
        await cleanup()
        const allPassed = printReport("AI-POWERED FEATURES")
        await prisma.$disconnect()
        process.exit(allPassed ? 0 : 1)
    }
}

main()
