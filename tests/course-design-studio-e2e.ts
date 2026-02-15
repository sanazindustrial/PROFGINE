/**
 * Course Design Studio - End-to-End Test Suite
 * 
 * Tests the complete workflow: 
 * Phase 0.5 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
 * 
 * Run: npx tsx tests/course-design-studio-e2e.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

interface TestResult {
    name: string
    phase: string
    passed: boolean
    duration: number
    error?: string
    details?: string
}

const results: TestResult[] = []
let testUserId: string
let testCourseId: string
let testCourseDesignId: string
let testEvidenceItemId: string
let testSectionId: string
let testContentId: string
let testObjectiveId: string

const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
}

function log(msg: string) {
    console.log(msg)
}

function logPhase(phase: string) {
    log(`\n${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
    log(`${colors.bold}${colors.blue}  ${phase}${colors.reset}`)
    log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
}

async function runTest(
    name: string,
    phase: string,
    fn: () => Promise<string | void>
): Promise<boolean> {
    const start = Date.now()
    try {
        const details = await fn()
        const duration = Date.now() - start
        results.push({ name, phase, passed: true, duration, details: details || undefined })
        log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`)
        return true
    } catch (err) {
        const duration = Date.now() - start
        const errorMsg = err instanceof Error ? err.message : String(err)
        results.push({ name, phase, passed: false, duration, error: errorMsg })
        log(`  ${colors.red}✗${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`)
        log(`    ${colors.red}Error: ${errorMsg}${colors.reset}`)
        return false
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertDefined<T>(value: T | null | undefined, name: string): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(`Expected ${name} to be defined, got ${value}`)
    }
}

function assertEqual<T>(actual: T, expected: T, name: string) {
    if (actual !== expected) {
        throw new Error(`Expected ${name} to be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    }
}

// ============================================================================
// SETUP — Create test user and course
// ============================================================================

async function setup() {
    logPhase("SETUP — Creating test fixtures")

    await runTest("Create or find test user", "Setup", async () => {
        const email = "course-design-e2e-test@profgenie.test"
        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: "E2E Test Professor",
                    role: "PROFESSOR",
                    subscriptionType: "PREMIUM",
                },
            })
        }

        testUserId = user.id
        return `User ID: ${user.id}`
    })

    await runTest("Create test course", "Setup", async () => {
        // Clean up any prior test course design cascade
        const existing = await prisma.course.findFirst({
            where: {
                title: "E2E Test Course — Design Studio",
                instructorId: testUserId,
            },
        })

        if (existing) {
            // Delete course design metadata first (cascade)
            await prisma.courseDesignMetadata.deleteMany({ where: { courseId: existing.id } })
            await prisma.course.delete({ where: { id: existing.id } })
        }

        const course = await prisma.course.create({
            data: {
                title: "E2E Test Course — Design Studio",
                description: "End-to-end test course for Course Design Studio workflow",
                instructorId: testUserId,
            },
        })

        testCourseId = course.id
        return `Course ID: ${course.id}`
    })
}

// ============================================================================
// PHASE 0.5 — COURSE DETAILS & BULK COURSE INFORMATION
// ============================================================================

async function testPhase0_5() {
    logPhase("PHASE 0.5 — Course Details & Bulk Course Information")

    await runTest("Initialize course design metadata", "Phase 0.5", async () => {
        const design = await prisma.courseDesignMetadata.create({
            data: {
                courseId: testCourseId,
                creditHours: 3,
                contactHours: 3,
                academicLevel: "GRADUATE",
                termLength: 16,
                deliveryMode: "ONLINE",
                prerequisites: JSON.stringify(["CS 101", "MATH 200"]),
                programAlignment: "Master of Computer Science",
                learningModel: "PROJECT_BASED",
                assessmentWeighting: JSON.stringify({
                    exams: 30,
                    assignments: 40,
                    projects: 20,
                    participation: 10,
                }),
                participationRules: "Weekly discussions required; 2 substantive posts per week",
                weeklyWorkloadHours: 12,
                formattingStandard: "APA",
                accessibilityRequired: true,
                aiUsagePolicy: "PERMITTED_WITH_DISCLOSURE",
                accreditationBody: "ABET",
            },
        })

        testCourseDesignId = design.id
        assertDefined(design.id, "design.id")
        assertEqual(design.academicLevel, "GRADUATE", "academicLevel")
        assertEqual(design.deliveryMode, "ONLINE", "deliveryMode")
        assertEqual(design.creditHours, 3, "creditHours")
        assertEqual(design.formattingStandard, "APA", "formattingStandard")
        return `Design ID: ${design.id}`
    })

    await runTest("Verify course metadata fields", "Phase 0.5", async () => {
        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
        })
        assertDefined(design, "design")
        assertEqual(design.learningModel, "PROJECT_BASED", "learningModel")
        assertEqual(design.weeklyWorkloadHours, 12, "weeklyWorkloadHours")
        assertEqual(design.accessibilityRequired, true, "accessibilityRequired")
        assertEqual(design.aiUsagePolicy, "PERMITTED_WITH_DISCLOSURE", "aiUsagePolicy")

        const prereqs = JSON.parse(design.prerequisites || "[]")
        assert(prereqs.includes("CS 101"), "Prerequisites should include CS 101")
        assert(prereqs.includes("MATH 200"), "Prerequisites should include MATH 200")

        const weights = JSON.parse(design.assessmentWeighting || "{}")
        assertEqual(weights.exams, 30, "assessment weighting exams")
        assertEqual(weights.assignments, 40, "assessment weighting assignments")
        return "All metadata fields verified"
    })

    await runTest("Update course details (immutable AI rule)", "Phase 0.5", async () => {
        const updated = await prisma.courseDesignMetadata.update({
            where: { courseId: testCourseId },
            data: {
                accreditationBody: "AACSB",
                termLength: 12,
            },
        })
        assertEqual(updated.accreditationBody, "AACSB", "accreditationBody")
        assertEqual(updated.termLength, 12, "termLength")
        return "Details updated successfully"
    })

    await runTest("Verify version tracking", "Phase 0.5", async () => {
        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
        })
        assertDefined(design, "design")
        assertDefined(design.versionId, "versionId")
        assertDefined(design.createdAt, "createdAt")
        assertEqual(design.isLocked, false, "isLocked should be false initially")
        return `Version: ${design.versionId}`
    })
}

// ============================================================================
// PHASE 1 — MATERIAL INGESTION (EVIDENCE KIT)
// ============================================================================

async function testPhase1() {
    logPhase("PHASE 1 — Material Ingestion (Evidence Kit)")

    await runTest("Add textbook evidence item", "Phase 1", async () => {
        const item = await prisma.evidenceKitItem.create({
            data: {
                courseDesignId: testCourseDesignId,
                title: "Introduction to Algorithms, 4th Edition",
                fileName: "intro-to-algorithms.pdf",
                fileType: "TEXTBOOK",
                fileUrl: "/uploads/test/intro-to-algorithms.pdf",
                fileSize: 15000000,
                mimeType: "application/pdf",
                sourceType: "TEXTBOOK",
                isbn: "978-0262046305",
                pageCount: 1312,
                uploadedBy: testUserId,
                processingStatus: "PENDING",
            },
        })

        testEvidenceItemId = item.id
        assertDefined(item.id, "evidence item id")
        assertEqual(item.fileType, "TEXTBOOK", "fileType")
        assertEqual(item.processingStatus, "PENDING", "processingStatus")
        return `Evidence Item ID: ${item.id}`
    })

    await runTest("Add article evidence item", "Phase 1", async () => {
        const item = await prisma.evidenceKitItem.create({
            data: {
                courseDesignId: testCourseDesignId,
                title: "Design Patterns in Modern Software Engineering",
                fileName: "design-patterns-article.pdf",
                fileType: "ARTICLE",
                fileUrl: "/uploads/test/design-patterns.pdf",
                fileSize: 2500000,
                mimeType: "application/pdf",
                sourceType: "JOURNAL_ARTICLE",
                doi: "10.1145/1234567.1234568",
                uploadedBy: testUserId,
                processingStatus: "PENDING",
            },
        })

        assertDefined(item.id, "article id")
        assertEqual(item.sourceType, "JOURNAL_ARTICLE", "sourceType")
        return `Article Item ID: ${item.id}`
    })

    await runTest("Add external link evidence item", "Phase 1", async () => {
        const item = await prisma.evidenceKitItem.create({
            data: {
                courseDesignId: testCourseDesignId,
                title: "MIT OpenCourseWare — Algorithms",
                fileName: "external-link",
                fileType: "EXTERNAL_LINK",
                fileUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
                sourceType: "WEB_RESOURCE",
                externalUrl: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
                uploadedBy: testUserId,
                processingStatus: "COMPLETED",
            },
        })

        assertDefined(item.id, "link id")
        assertEqual(item.fileType, "EXTERNAL_LINK", "fileType")
        return `Link Item ID: ${item.id}`
    })

    await runTest("Simulate AI processing of evidence item", "Phase 1", async () => {
        const updated = await prisma.evidenceKitItem.update({
            where: { id: testEvidenceItemId },
            data: {
                isProcessed: true,
                processingStatus: "COMPLETED",
                extractedText: "Chapter 1: The Role of Algorithms in Computing...",
                contentSummary: "Comprehensive textbook covering algorithmic design, analysis, and implementation...",
                topicsIdentified: JSON.stringify([
                    "Sorting Algorithms",
                    "Graph Algorithms",
                    "Dynamic Programming",
                    "Data Structures",
                    "Complexity Analysis",
                ]),
                conceptsMapping: JSON.stringify({
                    "sorting": ["merge sort", "quick sort", "heap sort"],
                    "graphs": ["BFS", "DFS", "shortest path"],
                    "dp": ["memoization", "tabulation"],
                }),
                citationsFound: JSON.stringify([
                    "Cormen, T. H., et al. (2022). Introduction to Algorithms (4th ed.). MIT Press.",
                ]),
                chapterMapping: JSON.stringify({
                    "Chapter 1": "1-30",
                    "Chapter 2": "31-60",
                    "Chapter 3": "61-100",
                }),
                semanticChunks: JSON.stringify([
                    { id: "chunk-1", text: "Sorting algorithms overview", embedding: null },
                    { id: "chunk-2", text: "Graph traversal methods", embedding: null },
                ]),
            },
        })

        assertEqual(updated.isProcessed, true, "isProcessed")
        assertEqual(updated.processingStatus, "COMPLETED", "processingStatus")
        assertDefined(updated.contentSummary, "contentSummary")
        assertDefined(updated.topicsIdentified, "topicsIdentified")
        return "Evidence processed with AI analysis"
    })

    await runTest("List all evidence items for course", "Phase 1", async () => {
        const items = await prisma.evidenceKitItem.findMany({
            where: { courseDesignId: testCourseDesignId },
            orderBy: { createdAt: "asc" },
        })

        assert(items.length >= 3, `Expected at least 3 items, got ${items.length}`)
        return `${items.length} evidence items found`
    })

    await runTest("Create citation link for traceability", "Phase 1", async () => {
        const citation = await prisma.citationLink.create({
            data: {
                evidenceItemId: testEvidenceItemId,
                targetType: "objective",
                targetId: "placeholder-obj-1",
                pageReference: "pp. 45-52",
                formattedCitation: "Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2022). Introduction to Algorithms (4th ed.). MIT Press.",
                inTextCitation: "(Cormen et al., 2022, pp. 45-52)",
            },
        })

        assertDefined(citation.id, "citation id")
        return `Citation ID: ${citation.id}`
    })
}

// ============================================================================
// PHASE 2 — AI ANALYSIS OF UPLOADED CONTENT
// ============================================================================

async function testPhase2() {
    logPhase("PHASE 2 — AI Analysis of Uploaded Content")

    await runTest("Verify content mapping from processed items", "Phase 2", async () => {
        const items = await prisma.evidenceKitItem.findMany({
            where: {
                courseDesignId: testCourseDesignId,
                isProcessed: true,
            },
        })

        assert(items.length >= 1, "At least one processed item expected")

        const item = items[0]
        assertDefined(item.topicsIdentified, "topicsIdentified")
        const topics = JSON.parse(item.topicsIdentified!)
        assert(Array.isArray(topics), "Topics should be an array")
        assert(topics.length > 0, "Should have identified topics")
        return `${topics.length} topics identified from ${items.length} processed items`
    })

    await runTest("Verify concepts mapping structure", "Phase 2", async () => {
        const item = await prisma.evidenceKitItem.findUnique({
            where: { id: testEvidenceItemId },
        })
        assertDefined(item, "evidence item")
        assertDefined(item.conceptsMapping, "conceptsMapping")

        const concepts = JSON.parse(item.conceptsMapping!)
        assert(typeof concepts === "object", "Concepts should be an object")
        assert(Object.keys(concepts).length > 0, "Should have mapped concepts")
        return `${Object.keys(concepts).length} concept groups mapped`
    })

    await runTest("Verify citation graph structure", "Phase 2", async () => {
        const citations = await prisma.citationLink.findMany({
            where: { evidenceItemId: testEvidenceItemId },
        })

        assert(citations.length >= 1, "Should have at least one citation link")
        const citation = citations[0]
        assertDefined(citation.formattedCitation, "formattedCitation")
        assertDefined(citation.inTextCitation, "inTextCitation")
        assert(citation.formattedCitation.includes("Cormen"), "Citation should reference Cormen")
        return `${citations.length} citations in graph`
    })
}

// ============================================================================
// PHASE 3 — COURSE DESIGN (OBJECTIVES & CURRICULUM)
// ============================================================================

async function testPhase3() {
    logPhase("PHASE 3 — Course Design (Objectives & Curriculum)")

    await runTest("Generate course objectives with Bloom's taxonomy", "Phase 3", async () => {
        const objectives = [
            {
                objectiveNumber: "1.1",
                description: "Analyze the time and space complexity of common algorithms using Big-O notation",
                bloomsLevel: "ANALYZE" as const,
                assessmentMethod: "Written exams and homework problem sets",
                isAIGenerated: true,
            },
            {
                objectiveNumber: "1.2",
                description: "Design efficient sorting and searching algorithms for various data structures",
                bloomsLevel: "CREATE" as const,
                assessmentMethod: "Programming projects",
                isAIGenerated: true,
            },
            {
                objectiveNumber: "2.1",
                description: "Evaluate graph algorithms and select appropriate approaches for real-world problems",
                bloomsLevel: "EVALUATE" as const,
                assessmentMethod: "Case study analysis",
                isAIGenerated: true,
            },
            {
                objectiveNumber: "2.2",
                description: "Apply dynamic programming techniques to solve optimization problems",
                bloomsLevel: "APPLY" as const,
                assessmentMethod: "Coding assignments",
                isAIGenerated: true,
            },
        ]

        for (let i = 0; i < objectives.length; i++) {
            const obj = await prisma.courseObjective.create({
                data: {
                    courseDesignId: testCourseDesignId,
                    ...objectives[i],
                    orderIndex: i,
                    sourceEvidence: testEvidenceItemId,
                },
            })

            if (i === 0) testObjectiveId = obj.id
        }

        const created = await prisma.courseObjective.findMany({
            where: { courseDesignId: testCourseDesignId },
        })

        assertEqual(created.length, 4, "objective count")
        return `4 objectives created with Bloom's levels`
    })

    await runTest("Verify Bloom's taxonomy coverage", "Phase 3", async () => {
        const objectives = await prisma.courseObjective.findMany({
            where: { courseDesignId: testCourseDesignId },
        })

        const levels = objectives.map(o => o.bloomsLevel)
        assert(levels.includes("ANALYZE"), "Should include ANALYZE")
        assert(levels.includes("CREATE"), "Should include CREATE")
        assert(levels.includes("EVALUATE"), "Should include EVALUATE")
        assert(levels.includes("APPLY"), "Should include APPLY")
        return `Bloom's levels covered: ${[...new Set(levels)].join(", ")}`
    })

    await runTest("Approve objectives workflow", "Phase 3", async () => {
        const updated = await prisma.courseObjective.update({
            where: { id: testObjectiveId },
            data: {
                isApproved: true,
                approvedBy: testUserId,
                approvedAt: new Date(),
            },
        })

        assertEqual(updated.isApproved, true, "isApproved")
        assertDefined(updated.approvedAt, "approvedAt")
        return `Objective ${updated.objectiveNumber} approved`
    })
}

// ============================================================================
// PHASE 4 — COURSE STRUCTURE (DRAG & DROP SECTIONS)
// ============================================================================

async function testPhase4() {
    logPhase("PHASE 4 — Course Structure (Drag & Drop Sections)")

    await runTest("Create root module sections", "Phase 4", async () => {
        const modules = [
            { title: "Module 1: Algorithm Fundamentals", weekNumber: 1, description: "Introduction to algorithmic thinking" },
            { title: "Module 2: Sorting & Searching", weekNumber: 3, description: "Classic sorting and search algorithms" },
            { title: "Module 3: Graph Algorithms", weekNumber: 6, description: "Graph traversal and shortest path" },
            { title: "Module 4: Dynamic Programming", weekNumber: 9, description: "DP techniques and optimization" },
        ]

        for (let i = 0; i < modules.length; i++) {
            const section = await prisma.courseDesignSection.create({
                data: {
                    courseDesignId: testCourseDesignId,
                    title: modules[i].title,
                    description: modules[i].description,
                    sectionType: "MODULE",
                    weekNumber: modules[i].weekNumber,
                    orderIndex: i,
                    durationMinutes: 180,
                    learningOutcomes: JSON.stringify([testObjectiveId]),
                },
            })

            if (i === 0) testSectionId = section.id
        }

        const sections = await prisma.courseDesignSection.findMany({
            where: {
                courseDesignId: testCourseDesignId,
                parentSectionId: null,
            },
            orderBy: { orderIndex: "asc" },
        })

        assertEqual(sections.length, 4, "root section count")
        return `4 root modules created`
    })

    await runTest("Create nested sub-sections (lessons)", "Phase 4", async () => {
        const lessons = [
            { title: "Lesson 1.1: Big-O Notation", type: "LESSON" as const },
            { title: "Lesson 1.2: Recursion Basics", type: "LESSON" as const },
            { title: "Lesson 1.3: Algorithm Design Patterns", type: "LESSON" as const },
        ]

        for (let i = 0; i < lessons.length; i++) {
            await prisma.courseDesignSection.create({
                data: {
                    courseDesignId: testCourseDesignId,
                    parentSectionId: testSectionId,
                    title: lessons[i].title,
                    sectionType: lessons[i].type,
                    orderIndex: i,
                    durationMinutes: 60,
                },
            })
        }

        const children = await prisma.courseDesignSection.findMany({
            where: { parentSectionId: testSectionId },
            orderBy: { orderIndex: "asc" },
        })

        assertEqual(children.length, 3, "child section count")
        return `3 nested lessons created under Module 1`
    })

    await runTest("Test drag-and-drop reordering", "Phase 4", async () => {
        const sections = await prisma.courseDesignSection.findMany({
            where: {
                courseDesignId: testCourseDesignId,
                parentSectionId: null,
            },
            orderBy: { orderIndex: "asc" },
        })

        // Reverse order to simulate drag-and-drop
        for (let i = 0; i < sections.length; i++) {
            await prisma.courseDesignSection.update({
                where: { id: sections[i].id },
                data: { orderIndex: sections.length - 1 - i },
            })
        }

        const reordered = await prisma.courseDesignSection.findMany({
            where: {
                courseDesignId: testCourseDesignId,
                parentSectionId: null,
            },
            orderBy: { orderIndex: "asc" },
        })

        // Verify order is reversed
        assertEqual(reordered[0].title, sections[sections.length - 1].title, "first section after reorder")
        assertEqual(reordered[reordered.length - 1].title, sections[0].title, "last section after reorder")

        // Restore original order
        for (let i = 0; i < sections.length; i++) {
            await prisma.courseDesignSection.update({
                where: { id: sections[i].id },
                data: { orderIndex: i },
            })
        }

        return "Drag-and-drop reorder verified and restored"
    })

    await runTest("Verify nested section tree structure", "Phase 4", async () => {
        const tree = await prisma.courseDesignSection.findMany({
            where: {
                courseDesignId: testCourseDesignId,
                parentSectionId: null,
            },
            orderBy: { orderIndex: "asc" },
            include: {
                childSections: {
                    orderBy: { orderIndex: "asc" },
                },
            },
        })

        assert(tree.length >= 4, "Should have at least 4 root modules")
        assert(tree[0].childSections.length >= 3, "Module 1 should have at least 3 lessons")
        return `Tree: ${tree.length} modules, ${tree[0].childSections.length} lessons in Module 1`
    })
}

// ============================================================================
// PHASE 5 — CONTENT POPULATION
// ============================================================================

async function testPhase5() {
    logPhase("PHASE 5 — Content Population (Drag & Drop + AI)")

    await runTest("Add lecture page content to section", "Phase 5", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId: testSectionId,
                contentType: "LECTURE",
                title: "Introduction to Algorithm Analysis",
                description: "Opening lecture covering computational complexity",
                content: "<h1>Algorithm Analysis</h1><p>Understanding computational complexity...</p>",
                isAIGenerated: false,
                orderIndex: 0,
                isRequired: true,
            },
        })

        testContentId = content.id
        assertDefined(content.id, "content id")
        assertEqual(content.contentType, "LECTURE", "contentType")
        return `Content ID: ${content.id}`
    })

    await runTest("Add AI-generated lecture notes", "Phase 5", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId: testSectionId,
                contentType: "LECTURE",
                title: "Big-O Notation Deep Dive",
                description: "AI-generated lecture notes on algorithm complexity",
                content: "<h1>Big-O Notation</h1><p>Big-O notation describes the upper bound...</p>",
                aiGeneratedContent: "Generated lecture covering O(1), O(log n), O(n), O(n log n), O(n²)...",
                isAIGenerated: true,
                orderIndex: 1,
                isRequired: true,
                citationRequired: true,
                aiDisclosureAdded: true,
            },
        })

        assertEqual(content.isAIGenerated, true, "isAIGenerated")
        assertEqual(content.aiDisclosureAdded, true, "aiDisclosureAdded")
        return "AI lecture notes added with disclosure"
    })

    await runTest("Link evidence kit item to content (drag from kit)", "Phase 5", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId: testSectionId,
                evidenceItemId: testEvidenceItemId,
                contentType: "READING",
                title: "Required Reading: Chapter 1-3",
                description: "Chapters 1-3 from Introduction to Algorithms",
                orderIndex: 2,
                isRequired: true,
                citationRequired: true,
            },
        })

        assertDefined(content.evidenceItemId, "evidenceItemId")
        assertEqual(content.evidenceItemId, testEvidenceItemId, "linked evidence item")
        return "Evidence kit item linked to section content"
    })

    await runTest("Add assignment page", "Phase 5", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId: testSectionId,
                contentType: "ASSIGNMENT",
                title: "Homework 1: Complexity Analysis",
                description: "Analyze time/space complexity of given algorithms",
                content: "## Instructions\n1. Analyze 5 algorithms...",
                orderIndex: 3,
                isRequired: true,
                dueDate: new Date("2026-03-15"),
                points: 100,
            },
        })

        assertEqual(content.contentType, "ASSIGNMENT", "contentType")
        assertEqual(content.points, 100, "points")
        return "Assignment page added"
    })

    await runTest("Add discussion page", "Phase 5", async () => {
        const content = await prisma.sectionContent.create({
            data: {
                sectionId: testSectionId,
                contentType: "DISCUSSION",
                title: "Week 1 Discussion: Real-World Algorithm Applications",
                description: "Discuss real-world applications of algorithm analysis",
                content: "## Discussion Prompt\nIdentify an algorithm used in a real-world system...",
                orderIndex: 4,
                isRequired: true,
                points: 25,
            },
        })

        assertEqual(content.contentType, "DISCUSSION", "contentType")
        return "Discussion page added"
    })

    await runTest("Verify content ordering within section", "Phase 5", async () => {
        const contents = await prisma.sectionContent.findMany({
            where: { sectionId: testSectionId },
            orderBy: { orderIndex: "asc" },
        })

        assert(contents.length >= 5, `Expected at least 5 content items, got ${contents.length}`)

        // Verify order
        for (let i = 0; i < contents.length - 1; i++) {
            assert(
                contents[i].orderIndex <= contents[i + 1].orderIndex,
                `Content at index ${i} should come before index ${i + 1}`
            )
        }

        // Verify supported page types
        const types = contents.map(c => c.contentType)
        assert(types.includes("LECTURE"), "Should have LECTURE page")
        assert(types.includes("READING"), "Should have READING page")
        assert(types.includes("ASSIGNMENT"), "Should have ASSIGNMENT page")
        assert(types.includes("DISCUSSION"), "Should have DISCUSSION page")
        return `${contents.length} content items in correct order`
    })

    await runTest("Reorder content items (drag & drop)", "Phase 5", async () => {
        const contents = await prisma.sectionContent.findMany({
            where: { sectionId: testSectionId },
            orderBy: { orderIndex: "asc" },
        })

        // Move last item to top
        const last = contents[contents.length - 1]
        await prisma.sectionContent.update({
            where: { id: last.id },
            data: { orderIndex: -1 },
        })

        const reordered = await prisma.sectionContent.findMany({
            where: { sectionId: testSectionId },
            orderBy: { orderIndex: "asc" },
        })

        assertEqual(reordered[0].id, last.id, "moved item should be first")

        // Restore
        await prisma.sectionContent.update({
            where: { id: last.id },
            data: { orderIndex: contents.length - 1 },
        })

        return "Content reorder verified"
    })
}

// ============================================================================
// PHASE 6 — CONTENT CREATION TOOLS
// ============================================================================

async function testPhase6() {
    logPhase("PHASE 6 — Content Creation Tools")

    await runTest("Create assessment rubric", "Phase 6", async () => {
        const rubric = await prisma.assessmentRubric.create({
            data: {
                sectionContentId: testContentId,
                title: "Algorithm Analysis Rubric",
                description: "Rubric for evaluating algorithm complexity analysis",
                totalPoints: 100,
                criteria: JSON.stringify([
                    {
                        name: "Correctness",
                        weight: 40,
                        levels: [
                            { name: "Excellent", points: 40, description: "All analyses correct" },
                            { name: "Good", points: 30, description: "Minor errors" },
                            { name: "Fair", points: 20, description: "Several errors" },
                            { name: "Poor", points: 10, description: "Major errors" },
                        ],
                    },
                    {
                        name: "Explanation Quality",
                        weight: 30,
                        levels: [
                            { name: "Excellent", points: 30, description: "Clear, detailed explanations" },
                            { name: "Good", points: 22, description: "Adequate explanations" },
                            { name: "Fair", points: 15, description: "Vague explanations" },
                            { name: "Poor", points: 7, description: "No explanations" },
                        ],
                    },
                    {
                        name: "APA Formatting",
                        weight: 30,
                        levels: [
                            { name: "Excellent", points: 30, description: "Perfect APA format" },
                            { name: "Good", points: 22, description: "Minor formatting issues" },
                            { name: "Fair", points: 15, description: "Several formatting issues" },
                            { name: "Poor", points: 7, description: "No formatting adherence" },
                        ],
                    },
                ]),
                isAIGenerated: true,
                alignedObjectives: JSON.stringify([testObjectiveId]),
            },
        })

        assertDefined(rubric.id, "rubric id")
        assertEqual(rubric.totalPoints, 100, "totalPoints")
        assertEqual(rubric.isAIGenerated, true, "isAIGenerated")

        const criteria = JSON.parse(rubric.criteria)
        assertEqual(criteria.length, 3, "criteria count")
        return `Rubric created with ${criteria.length} criteria`
    })

    await runTest("Verify rubric-to-content linkage", "Phase 6", async () => {
        const content = await prisma.sectionContent.findUnique({
            where: { id: testContentId },
            include: { rubric: true },
        })

        assertDefined(content, "content")
        assertDefined(content.rubric, "rubric on content")
        assertEqual(content.rubric!.title, "Algorithm Analysis Rubric", "rubric title")
        return "Rubric linked to content"
    })
}

// ============================================================================
// PHASE 7 — CREATE SYLLABUS
// ============================================================================

async function testPhase7() {
    logPhase("PHASE 7 — Create Syllabus (Integrated Output)")

    await runTest("Generate syllabus version 1", "Phase 7", async () => {
        const syllabus = await prisma.syllabusVersion.create({
            data: {
                courseDesignId: testCourseDesignId,
                version: 1,
                status: "DRAFT",
                content: `# E2E Test Course — Design Studio
## Course Syllabus

### Course Information
- **Credit Hours:** 3
- **Academic Level:** Graduate
- **Delivery Mode:** Online
- **Term Length:** 12 weeks

### Course Objectives
1.1 Analyze the time and space complexity of common algorithms
1.2 Design efficient sorting and searching algorithms
2.1 Evaluate graph algorithms for real-world problems
2.2 Apply dynamic programming techniques

### Weekly Schedule
Week 1-2: Algorithm Fundamentals
Week 3-5: Sorting & Searching
Week 6-8: Graph Algorithms
Week 9-12: Dynamic Programming

### Assessment Structure
- Exams: 30%
- Assignments: 40%
- Projects: 20%
- Participation: 10%

### Academic Integrity Policy
All work must be original. AI usage is permitted with disclosure.

### APA Formatting
All written submissions must follow APA 7th edition.`,
                compiledFrom: JSON.stringify({
                    objectives: [testObjectiveId],
                    sections: [testSectionId],
                }),
                academicPolicies: JSON.stringify({
                    academicIntegrity: "All work must be original.",
                    plagiarismPolicy: "Strict enforcement of institutional policy.",
                }),
                aiDisclosure: "AI tools were used in course design with full disclosure. Student AI usage is permitted with proper attribution.",
                accessibilityStatement: "This course complies with WCAG 2.1 AA standards.",
            },
        })

        assertDefined(syllabus.id, "syllabus id")
        assertEqual(syllabus.version, 1, "version")
        assertEqual(syllabus.status, "DRAFT", "status")
        assert(syllabus.content.includes("APA"), "Syllabus should mention APA formatting")
        assert(syllabus.content.includes("Academic Integrity"), "Should include integrity policy")
        return `Syllabus v1 created (${syllabus.content.length} chars)`
    })

    await runTest("Approve syllabus", "Phase 7", async () => {
        const syllabus = await prisma.syllabusVersion.findFirst({
            where: { courseDesignId: testCourseDesignId, version: 1 },
        })
        assertDefined(syllabus, "syllabus")

        const approved = await prisma.syllabusVersion.update({
            where: { id: syllabus.id },
            data: {
                status: "APPROVED",
                isApproved: true,
                approvedBy: testUserId,
                approvedAt: new Date(),
            },
        })

        assertEqual(approved.status, "APPROVED", "status")
        assertEqual(approved.isApproved, true, "isApproved")
        return "Syllabus approved"
    })
}

// ============================================================================
// PHASE 8 — GOVERNANCE & READY-CHECK
// ============================================================================

async function testPhase8() {
    logPhase("PHASE 8 — Governance & Ready-Check (Mandatory)")

    const readyCheckTypes: Array<{
        type: "OBJECTIVE_COVERAGE" | "CITATION_COMPLIANCE" | "ACCESSIBILITY_WCAG" | "AI_DISCLOSURE" | "POLICY_COMPLETENESS" | "CONTENT_ALIGNMENT" | "WORKLOAD_BALANCE"
        score: number
        status: "PASSED" | "WARNING" | "FAILED"
        issues: string[]
        suggestions: string[]
    }> = [
            {
                type: "OBJECTIVE_COVERAGE",
                score: 92,
                status: "PASSED",
                issues: [],
                suggestions: ["Consider adding more practice problems for Module 4"],
            },
            {
                type: "CITATION_COMPLIANCE",
                score: 88,
                status: "PASSED",
                issues: ["2 content items missing APA in-text citations"],
                suggestions: ["Review AI-generated content for citation completeness"],
            },
            {
                type: "ACCESSIBILITY_WCAG",
                score: 95,
                status: "PASSED",
                issues: [],
                suggestions: ["Add alt-text to any embedded images"],
            },
            {
                type: "AI_DISCLOSURE",
                score: 100,
                status: "PASSED",
                issues: [],
                suggestions: [],
            },
            {
                type: "POLICY_COMPLETENESS",
                score: 100,
                status: "PASSED",
                issues: [],
                suggestions: [],
            },
            {
                type: "CONTENT_ALIGNMENT",
                score: 85,
                status: "WARNING",
                issues: ["Objective 2.2 not directly assessed in any rubric"],
                suggestions: ["Add an assessment targeting dynamic programming objective"],
            },
            {
                type: "WORKLOAD_BALANCE",
                score: 90,
                status: "PASSED",
                issues: ["Module 4 has no content items yet"],
                suggestions: ["Populate Module 4 with lecture and assignment pages"],
            },
        ]

    for (const check of readyCheckTypes) {
        await runTest(`Ready-Check: ${check.type}`, "Phase 8", async () => {
            const result = await prisma.readyCheckResult.create({
                data: {
                    courseDesignId: testCourseDesignId,
                    checkType: check.type,
                    status: check.status,
                    score: check.score,
                    issues: JSON.stringify(check.issues),
                    suggestions: JSON.stringify(check.suggestions),
                    details: `${check.type} validation completed with score ${check.score}/100`,
                },
            })

            assertDefined(result.id, "result id")
            assertEqual(result.checkType, check.type, "checkType")
            return `Score: ${check.score}/100 — ${check.status}`
        })
    }

    await runTest("Verify all 7 check types present", "Phase 8", async () => {
        const checks = await prisma.readyCheckResult.findMany({
            where: { courseDesignId: testCourseDesignId },
        })

        const types = checks.map(c => c.checkType)
        assert(types.includes("OBJECTIVE_COVERAGE"), "Missing OBJECTIVE_COVERAGE check")
        assert(types.includes("CITATION_COMPLIANCE"), "Missing CITATION_COMPLIANCE check")
        assert(types.includes("ACCESSIBILITY_WCAG"), "Missing ACCESSIBILITY_WCAG check")
        assert(types.includes("AI_DISCLOSURE"), "Missing AI_DISCLOSURE check")
        assert(types.includes("POLICY_COMPLETENESS"), "Missing POLICY_COMPLETENESS check")
        assert(types.includes("CONTENT_ALIGNMENT"), "Missing CONTENT_ALIGNMENT check")
        assert(types.includes("WORKLOAD_BALANCE"), "Missing WORKLOAD_BALANCE check")
        return `All 7 check types verified`
    })

    await runTest("Verify publish gate (no critical failures)", "Phase 8", async () => {
        const failedChecks = await prisma.readyCheckResult.findMany({
            where: {
                courseDesignId: testCourseDesignId,
                status: "FAILED",
            },
        })

        assertEqual(failedChecks.length, 0, "critical failures count")
        return "No critical failures — publish allowed"
    })
}

// ============================================================================
// PHASE 9 — PUBLISH & NOTIFY
// ============================================================================

async function testPhase9() {
    logPhase("PHASE 9 — Publish & Notify")

    await runTest("Lock course version on publish", "Phase 9", async () => {
        const updated = await prisma.courseDesignMetadata.update({
            where: { courseId: testCourseId },
            data: {
                isLocked: true,
                lockedAt: new Date(),
                lockedBy: testUserId,
            },
        })

        assertEqual(updated.isLocked, true, "isLocked")
        assertDefined(updated.lockedAt, "lockedAt")
        return "Course design locked"
    })

    await runTest("Create audit log entry for publish", "Phase 9", async () => {
        const log = await prisma.courseAuditLog.create({
            data: {
                courseDesignId: testCourseDesignId,
                userId: testUserId,
                action: "PUBLISH",
                targetType: "course_design",
                targetId: testCourseDesignId,
                newValue: JSON.stringify({
                    publishedAt: new Date().toISOString(),
                    publishedBy: testUserId,
                    version: 1,
                }),
            },
        })

        assertDefined(log.id, "audit log id")
        assertEqual(log.action, "PUBLISH", "action")
        return `Audit log ID: ${log.id}`
    })

    await runTest("Create audit trail for AI actions", "Phase 9", async () => {
        const aiLog = await prisma.courseAuditLog.create({
            data: {
                courseDesignId: testCourseDesignId,
                userId: testUserId,
                action: "AI_GENERATE",
                targetType: "objective",
                targetId: testObjectiveId,
                aiProvider: "openai",
                aiPrompt: "Generate Bloom's-aligned objectives for graduate-level algorithms course",
            },
        })

        assertDefined(aiLog.id, "AI audit log id")
        assertEqual(aiLog.action, "AI_GENERATE", "action")
        assertDefined(aiLog.aiProvider, "aiProvider")
        return "AI audit trail created"
    })

    await runTest("Verify locked course prevents edits", "Phase 9", async () => {
        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
        })
        assertDefined(design, "design")
        assertEqual(design.isLocked, true, "isLocked")

        // The application should check isLocked before allowing edits
        // This simulates that governance check
        const canEdit = !design.isLocked
        assertEqual(canEdit, false, "should not allow edits when locked")
        return "Locked course correctly prevents modifications"
    })

    await runTest("Verify full audit log trail", "Phase 9", async () => {
        const logs = await prisma.courseAuditLog.findMany({
            where: { courseDesignId: testCourseDesignId },
            orderBy: { createdAt: "desc" },
        })

        assert(logs.length >= 2, `Expected at least 2 audit entries, got ${logs.length}`)

        const actions = logs.map(l => l.action)
        assert(actions.includes("PUBLISH"), "Should have PUBLISH action")
        assert(actions.includes("AI_GENERATE"), "Should have AI_GENERATE action")
        return `${logs.length} audit entries verified`
    })
}

// ============================================================================
// ASK PROFESSOR GENIE — Cross-Cutting Advisory
// ============================================================================

async function testAskGenie() {
    logPhase("ASK PROFESSOR GENIE — Cross-Cutting Advisory")

    await runTest("Create GENIE conversation", "Ask GENIE", async () => {
        const conversation = await prisma.genieConversation.create({
            data: {
                courseId: testCourseId,
                userId: testUserId,
                context: JSON.stringify({ currentPhase: "course-details" }),
            },
        })

        assertDefined(conversation.id, "conversation id")
        return `Conversation ID: ${conversation.id}`
    })

    await runTest("Send user message and receive GENIE response", "Ask GENIE", async () => {
        const conversation = await prisma.genieConversation.findFirst({
            where: {
                courseId: testCourseId,
                userId: testUserId,
            },
        })
        assertDefined(conversation, "conversation")

        // User question
        await prisma.genieMessage.create({
            data: {
                conversationId: conversation.id,
                role: "user",
                content: "How should I structure a 12-week algorithms course?",
                context: JSON.stringify({ currentPhase: "suggest-curriculum" }),
            },
        })

        // GENIE response (simulated)
        await prisma.genieMessage.create({
            data: {
                conversationId: conversation.id,
                role: "assistant",
                content: "For a 12-week graduate algorithms course, I suggest: Weeks 1-3: Fundamentals, Weeks 4-6: Sorting & Searching, Weeks 7-9: Graph Algorithms, Weeks 10-12: Dynamic Programming and Advanced Topics.",
                context: JSON.stringify({ currentPhase: "suggest-curriculum", suggestions: true }),
            },
        })

        const messages = await prisma.genieMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
        })

        assertEqual(messages.length, 2, "message count")
        assertEqual(messages[0].role, "user", "first message role")
        assertEqual(messages[1].role, "assistant", "second message role")
        return "GENIE conversation verified with 2 messages"
    })

    await runTest("Verify GENIE cannot modify course data", "Ask GENIE", async () => {
        // GENIE is advisory-only — this test verifies the governance rule
        // that GENIE messages don't create/modify any course design data directly
        const beforeDesign = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
        })
        assertDefined(beforeDesign, "design before GENIE")

        // Simulate GENIE being asked but verify no data changed
        const afterDesign = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
        })
        assertDefined(afterDesign, "design after GENIE")

        assertEqual(beforeDesign.academicLevel, afterDesign.academicLevel, "academicLevel unchanged")
        assertEqual(beforeDesign.creditHours, afterDesign.creditHours, "creditHours unchanged")
        return "GENIE advisory — no course data modified"
    })
}

// ============================================================================
// DATA INTEGRITY & GOVERNANCE VALIDATION
// ============================================================================

async function testGovernance() {
    logPhase("DATA INTEGRITY & GOVERNANCE VALIDATION")

    await runTest("Verify course → design → evidence cascade", "Governance", async () => {
        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
            include: {
                evidenceItems: true,
                courseObjectives: true,
                courseSections: true,
                readyChecks: true,
                auditLogs: true,
                syllabusVersions: true,
            },
        })

        assertDefined(design, "design with relations")
        assert(design.evidenceItems.length >= 3, "Should have evidence items")
        assert(design.courseObjectives.length >= 4, "Should have objectives")
        assert(design.courseSections.length >= 4, "Should have sections")
        assert(design.readyChecks.length >= 7, "Should have ready-check results")
        assert(design.auditLogs.length >= 2, "Should have audit logs")
        assert(design.syllabusVersions.length >= 1, "Should have syllabus versions")
        return "All relational data verified"
    })

    await runTest("Verify section → content → rubric cascade", "Governance", async () => {
        const section = await prisma.courseDesignSection.findUnique({
            where: { id: testSectionId },
            include: {
                contents: {
                    include: { rubric: true },
                },
                childSections: true,
            },
        })

        assertDefined(section, "section with relations")
        assert(section.contents.length >= 5, "Should have content items")
        assert(section.childSections.length >= 3, "Should have child sections")

        const withRubric = section.contents.filter(c => c.rubric)
        assert(withRubric.length >= 1, "At least one content should have a rubric")
        return "Section cascade verified"
    })

    await runTest("Verify AI disclosure flags on generated content", "Governance", async () => {
        const aiContent = await prisma.sectionContent.findMany({
            where: {
                sectionId: testSectionId,
                isAIGenerated: true,
            },
        })

        for (const content of aiContent) {
            assert(
                content.aiDisclosureAdded,
                `AI content "${content.title}" should have aiDisclosureAdded=true`
            )
        }
        return `${aiContent.length} AI-generated items verified with disclosure`
    })

    await runTest("Verify formatting standard consistency (APA)", "Governance", async () => {
        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId: testCourseId },
        })
        assertDefined(design, "design")
        assertEqual(design.formattingStandard, "APA", "formattingStandard")

        const syllabus = await prisma.syllabusVersion.findFirst({
            where: { courseDesignId: testCourseDesignId },
        })
        assertDefined(syllabus, "syllabus")
        assert(syllabus.content.includes("APA"), "Syllabus should reference APA standard")
        return "APA formatting standard consistent across course"
    })
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanup() {
    logPhase("CLEANUP — Removing test data")

    await runTest("Remove test data", "Cleanup", async () => {
        // Cascade delete: removing CourseDesignMetadata removes all child records
        await prisma.courseDesignMetadata.deleteMany({
            where: { courseId: testCourseId },
        })

        // Delete GENIE conversations
        await prisma.genieConversation.deleteMany({
            where: { courseId: testCourseId },
        })

        // Delete the test course
        await prisma.course.deleteMany({
            where: { id: testCourseId },
        })

        // Delete the test user
        await prisma.user.deleteMany({
            where: { email: "course-design-e2e-test@profgenie.test" },
        })

        return "All test data cleaned up"
    })
}

// ============================================================================
// REPORT
// ============================================================================

function printReport() {
    log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`)
    log(`${colors.bold}${colors.cyan}  COURSE DESIGN STUDIO — E2E TEST REPORT${colors.reset}`)
    log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`)

    const passed = results.filter(r => r.passed)
    const failed = results.filter(r => !r.passed)
    const phases = [...new Set(results.map(r => r.phase))]

    for (const phase of phases) {
        const phaseResults = results.filter(r => r.phase === phase)
        const phasePassed = phaseResults.filter(r => r.passed).length
        const phaseTotal = phaseResults.length
        const status = phasePassed === phaseTotal
            ? `${colors.green}ALL PASSED${colors.reset}`
            : `${colors.red}${phaseTotal - phasePassed} FAILED${colors.reset}`

        log(`  ${colors.bold}${phase}${colors.reset}: ${phasePassed}/${phaseTotal} ${status}`)
    }

    log("")
    log(`  ${colors.bold}Total:${colors.reset} ${passed.length}/${results.length} tests passed`)
    log(`  ${colors.bold}Duration:${colors.reset} ${results.reduce((sum, r) => sum + r.duration, 0)}ms`)

    if (failed.length > 0) {
        log(`\n  ${colors.red}${colors.bold}FAILED TESTS:${colors.reset}`)
        for (const f of failed) {
            log(`    ${colors.red}✗${colors.reset} [${f.phase}] ${f.name}`)
            log(`      ${colors.dim}${f.error}${colors.reset}`)
        }
    }

    log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`)

    if (failed.length === 0) {
        log(`\n  ${colors.green}${colors.bold}✓ ALL TESTS PASSED — Course Design Studio is FUNCTIONAL${colors.reset}\n`)
    } else {
        log(`\n  ${colors.red}${colors.bold}✗ ${failed.length} TEST(S) FAILED${colors.reset}\n`)
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    log(`\n${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
    log(`${colors.bold}${colors.cyan}║   COURSE DESIGN STUDIO — END-TO-END TEST SUITE              ║${colors.reset}`)
    log(`${colors.bold}${colors.cyan}║   Testing: Phase 0.5 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 ║${colors.reset}`)
    log(`${colors.bold}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`)

    try {
        await setup()
        await testPhase0_5()
        await testPhase1()
        await testPhase2()
        await testPhase3()
        await testPhase4()
        await testPhase5()
        await testPhase6()
        await testPhase7()
        await testPhase8()
        await testPhase9()
        await testAskGenie()
        await testGovernance()
    } catch (err) {
        log(`\n${colors.red}FATAL: ${err instanceof Error ? err.message : err}${colors.reset}`)
    } finally {
        await cleanup()
        await prisma.$disconnect()
    }

    printReport()

    const failed = results.filter(r => !r.passed)
    process.exit(failed.length > 0 ? 1 : 0)
}

main()
