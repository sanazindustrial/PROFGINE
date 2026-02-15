/**
 * Course Management — E2E Tests
 * 
 * Tests: CRUD, modules, enrollment, bulk enrollment, section builder
 * Run: npx tsx tests/e2e/course-management.e2e.ts
 */

import {
    prisma, results, colors, log, logPhase,
    runTest, assert, assertDefined, assertEqual, assertGreaterThan,
    printReport, RUN_ID, TEST_EMAIL_PREFIX,
} from "./helpers"

let professorId: string
let studentId1: string
let studentId2: string
let studentId3: string
let courseId: string
let moduleId1: string
let moduleId2: string
let enrollmentId: string

// ============================================================================
// SETUP
// ============================================================================
async function setup() {
    logPhase("SETUP — Course Management")

    await runTest("Create test users", "Setup", async () => {
        const emails = [
            `${TEST_EMAIL_PREFIX}-cm-prof@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-cm-stu1@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-cm-stu2@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-cm-stu3@profgenie.test`,
        ]
        for (const e of emails) {
            await prisma.user.deleteMany({ where: { email: e } })
        }

        const prof = await prisma.user.create({
            data: { email: emails[0], name: "CM Prof", role: "PROFESSOR", subscriptionType: "PREMIUM" },
        })
        professorId = prof.id

        const s1 = await prisma.user.create({ data: { email: emails[1], name: "Student 1", role: "STUDENT" } })
        const s2 = await prisma.user.create({ data: { email: emails[2], name: "Student 2", role: "STUDENT" } })
        const s3 = await prisma.user.create({ data: { email: emails[3], name: "Student 3", role: "STUDENT" } })
        studentId1 = s1.id
        studentId2 = s2.id
        studentId3 = s3.id
        return `Prof: ${prof.id}, Students: ${s1.id}, ${s2.id}, ${s3.id}`
    })
}

// ============================================================================
// 1. COURSE CRUD
// ============================================================================
async function testCourseCRUD() {
    logPhase("1. COURSE CRUD")

    await runTest("Create course", "Course CRUD", async () => {
        const course = await prisma.course.create({
            data: {
                title: "E2E Algorithms 101",
                code: "CS-E2E-101",
                term: "Spring 2026",
                description: "End-to-end test course for course management",
                instructorId: professorId,
                durationWeeks: 16,
                startDate: new Date("2026-01-15"),
                endDate: new Date("2026-05-15"),
            },
        })
        courseId = course.id
        assertDefined(course.id, "course id")
        assertEqual(course.title, "E2E Algorithms 101", "title")
        assertEqual(course.code, "CS-E2E-101", "code")
        assertEqual(course.durationWeeks, 16, "durationWeeks")
        return `Course ID: ${course.id}`
    })

    await runTest("Read course with instructor", "Course CRUD", async () => {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { instructor: true },
        })
        assertDefined(course, "course")
        assertEqual(course.instructor.id, professorId, "instructorId")
        assertEqual(course.instructor.role, "PROFESSOR", "instructor role")
        return "Course read with instructor"
    })

    await runTest("Update course", "Course CRUD", async () => {
        const updated = await prisma.course.update({
            where: { id: courseId },
            data: {
                title: "E2E Advanced Algorithms",
                description: "Updated description",
                durationWeeks: 12,
            },
        })
        assertEqual(updated.title, "E2E Advanced Algorithms", "title")
        assertEqual(updated.durationWeeks, 12, "durationWeeks")
        return "Course updated"
    })

    await runTest("List professor's courses", "Course CRUD", async () => {
        const courses = await prisma.course.findMany({
            where: { instructorId: professorId },
        })
        assert(courses.length >= 1, "Professor should have at least 1 course")
        return `${courses.length} course(s) found`
    })
}

// ============================================================================
// 2. MODULE SYSTEM
// ============================================================================
async function testModuleSystem() {
    logPhase("2. MODULE SYSTEM — HIERARCHICAL CONTENT")

    await runTest("Create Module 1", "Modules", async () => {
        const mod = await prisma.module.create({
            data: {
                courseId,
                title: "Module 1: Introduction",
                description: "Course introduction and foundations",
                weekNo: 1,
                sectionNo: 1,
                orderIndex: 0,
                isPublished: true,
            },
        })
        moduleId1 = mod.id
        assertDefined(mod.id, "module id")
        assertEqual(mod.isPublished, true, "isPublished")
        return `Module ID: ${mod.id}`
    })

    await runTest("Create Module 2", "Modules", async () => {
        const mod = await prisma.module.create({
            data: {
                courseId,
                title: "Module 2: Data Structures",
                description: "Arrays, linked lists, trees",
                weekNo: 3,
                sectionNo: 2,
                orderIndex: 1,
                isPublished: false,
            },
        })
        moduleId2 = mod.id
        assertEqual(mod.isPublished, false, "isPublished")
        return `Module ID: ${mod.id}`
    })

    await runTest("Add module content (FILE)", "Modules", async () => {
        const content = await prisma.moduleContent.create({
            data: {
                moduleId: moduleId1,
                type: "FILE",
                title: "Syllabus PDF",
                fileName: "syllabus.pdf",
                fileSize: 1024000,
                fileType: "application/pdf",
                fileUrl: "/uploads/syllabus.pdf",
                orderIndex: 0,
                isRequired: true,
            },
        })
        assertDefined(content.id, "content id")
        assertEqual(content.type, "FILE", "type")
        return "File content added"
    })

    await runTest("Add module content (PAGE)", "Modules", async () => {
        const content = await prisma.moduleContent.create({
            data: {
                moduleId: moduleId1,
                type: "PAGE",
                title: "Welcome Page",
                content: "<h1>Welcome</h1><p>Welcome to the course!</p>",
                orderIndex: 1,
                isRequired: true,
            },
        })
        assertEqual(content.type, "PAGE", "type")
        return "Page content added"
    })

    await runTest("Add module content (LINK)", "Modules", async () => {
        const content = await prisma.moduleContent.create({
            data: {
                moduleId: moduleId1,
                type: "LINK",
                title: "Supplementary Reading",
                linkUrl: "https://example.com/reading",
                orderIndex: 2,
                isRequired: false,
            },
        })
        assertEqual(content.type, "LINK", "type")
        assertEqual(content.isRequired, false, "isRequired")
        return "Link content added"
    })

    await runTest("Add module content (VIDEO)", "Modules", async () => {
        const content = await prisma.moduleContent.create({
            data: {
                moduleId: moduleId1,
                type: "VIDEO",
                title: "Intro Video",
                linkUrl: "https://youtube.com/watch?v=test",
                orderIndex: 3,
            },
        })
        assertEqual(content.type, "VIDEO", "type")
        return "Video content added"
    })

    await runTest("Verify module → content hierarchy", "Modules", async () => {
        const mod = await prisma.module.findUnique({
            where: { id: moduleId1 },
            include: { contents: { orderBy: { orderIndex: "asc" } } },
        })
        assertDefined(mod, "module")
        assert(mod.contents.length >= 4, `Expected ≥4 contents, got ${mod.contents.length}`)
        const types = mod.contents.map(c => c.type)
        assert(types.includes("FILE"), "Should have FILE")
        assert(types.includes("PAGE"), "Should have PAGE")
        assert(types.includes("LINK"), "Should have LINK")
        assert(types.includes("VIDEO"), "Should have VIDEO")
        return `${mod.contents.length} content items in module`
    })

    await runTest("Verify content ordering", "Modules", async () => {
        const contents = await prisma.moduleContent.findMany({
            where: { moduleId: moduleId1 },
            orderBy: { orderIndex: "asc" },
        })
        for (let i = 0; i < contents.length - 1; i++) {
            assert(
                contents[i].orderIndex <= contents[i + 1].orderIndex,
                `Index ${i} should come before ${i + 1}`
            )
        }
        return "Content ordering verified"
    })

    await runTest("Course → Module cascade", "Modules", async () => {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { modules: { orderBy: { orderIndex: "asc" } } },
        })
        assertDefined(course, "course")
        assert(course.modules.length >= 2, "Should have ≥2 modules")
        return `Course has ${course.modules.length} modules`
    })
}

// ============================================================================
// 3. ENROLLMENT MANAGEMENT
// ============================================================================
async function testEnrollment() {
    logPhase("3. ENROLLMENT MANAGEMENT")

    await runTest("Enroll student 1", "Enrollment", async () => {
        const enrollment = await prisma.enrollment.create({
            data: { courseId, userId: studentId1 },
        })
        enrollmentId = enrollment.id
        assertDefined(enrollment.id, "enrollment id")
        return `Enrollment ID: ${enrollment.id}`
    })

    await runTest("Prevent duplicate enrollment", "Enrollment", async () => {
        let threw = false
        try {
            await prisma.enrollment.create({
                data: { courseId, userId: studentId1 },
            })
        } catch {
            threw = true
        }
        assert(threw, "Duplicate enrollment should throw")
        return "Duplicate prevented by unique constraint"
    })

    await runTest("Enroll student 2", "Enrollment", async () => {
        await prisma.enrollment.create({ data: { courseId, userId: studentId2 } })
        return "Student 2 enrolled"
    })

    await runTest("List enrolled students", "Enrollment", async () => {
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: { user: true },
        })
        assert(enrollments.length >= 2, `Expected ≥2 enrollments, got ${enrollments.length}`)
        const names = enrollments.map(e => e.user.name)
        assert(names.includes("Student 1"), "Student 1 should be enrolled")
        assert(names.includes("Student 2"), "Student 2 should be enrolled")
        return `${enrollments.length} students enrolled`
    })

    await runTest("Unenroll student", "Enrollment", async () => {
        await prisma.enrollment.delete({ where: { id: enrollmentId } })
        const check = await prisma.enrollment.findUnique({ where: { id: enrollmentId } })
        assertEqual(check, null, "enrollment should be null after delete")
        return "Student 1 unenrolled"
    })
}

// ============================================================================
// 4. BULK ENROLLMENT
// ============================================================================
async function testBulkEnrollment() {
    logPhase("4. BULK ENROLLMENT")

    await runTest("Bulk enroll multiple students", "Bulk Enrollment", async () => {
        const stuIds = [studentId1, studentId2, studentId3]
        // Remove existing enrollments first
        await prisma.enrollment.deleteMany({ where: { courseId } })

        for (const sid of stuIds) {
            await prisma.enrollment.create({ data: { courseId, userId: sid } })
        }

        const count = await prisma.enrollment.count({ where: { courseId } })
        assertEqual(count, 3, "enrollment count")
        return `${count} students bulk enrolled`
    })

    await runTest("Verify all students in course", "Bulk Enrollment", async () => {
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: { user: true },
        })
        assertEqual(enrollments.length, 3, "enrollment count")
        return "All 3 students confirmed in course"
    })
}

// ============================================================================
// 5. FLEXIBLE SECTION CONFIGURATION
// ============================================================================
async function testFlexibleSections() {
    logPhase("5. FLEXIBLE SECTION CONFIGURATION")

    await runTest("Module with custom section number (no week)", "Sections", async () => {
        const mod = await prisma.module.create({
            data: {
                courseId,
                title: "Extra Section: Lab",
                sectionNo: 10,
                orderIndex: 5,
                content: "Lab instructions and materials",
            },
        })
        assertDefined(mod.sectionNo, "sectionNo")
        assertEqual(mod.weekNo, null, "weekNo should be null")
        return "Section-only module created"
    })

    await runTest("Module with week and section", "Sections", async () => {
        const mod = await prisma.module.create({
            data: {
                courseId,
                title: "Week 5 Section 3: Review",
                weekNo: 5,
                sectionNo: 3,
                orderIndex: 6,
            },
        })
        assertEqual(mod.weekNo, 5, "weekNo")
        assertEqual(mod.sectionNo, 3, "sectionNo")
        return "Week + section module created"
    })

    await runTest("Publish/unpublish module", "Sections", async () => {
        const updated = await prisma.module.update({
            where: { id: moduleId2 },
            data: { isPublished: true },
        })
        assertEqual(updated.isPublished, true, "isPublished")

        const unpublished = await prisma.module.update({
            where: { id: moduleId2 },
            data: { isPublished: false },
        })
        assertEqual(unpublished.isPublished, false, "isPublished")
        return "Publish toggle verified"
    })

    await runTest("Reorder modules", "Sections", async () => {
        const mods = await prisma.module.findMany({
            where: { courseId },
            orderBy: { orderIndex: "asc" },
        })
        assert(mods.length >= 4, "Should have ≥4 modules")

        // Reverse order
        for (let i = 0; i < mods.length; i++) {
            await prisma.module.update({
                where: { id: mods[i].id },
                data: { orderIndex: mods.length - 1 - i },
            })
        }

        const reordered = await prisma.module.findMany({
            where: { courseId },
            orderBy: { orderIndex: "asc" },
        })
        assertEqual(reordered[0].id, mods[mods.length - 1].id, "first after reorder")

        // Restore
        for (let i = 0; i < mods.length; i++) {
            await prisma.module.update({
                where: { id: mods[i].id },
                data: { orderIndex: i },
            })
        }
        return "Module reordering verified"
    })
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup() {
    logPhase("CLEANUP — Course Management")

    await runTest("Remove all test data", "Cleanup", async () => {
        await prisma.moduleContent.deleteMany({
            where: { module: { courseId } },
        })
        await prisma.module.deleteMany({ where: { courseId } })
        await prisma.enrollment.deleteMany({ where: { courseId } })
        await prisma.course.deleteMany({ where: { id: courseId } })
        const emails = [
            `${TEST_EMAIL_PREFIX}-cm-prof@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-cm-stu1@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-cm-stu2@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-cm-stu3@profgenie.test`,
        ]
        for (const e of emails) {
            await prisma.user.deleteMany({ where: { email: e } })
        }
        return "All course management test data cleaned"
    })
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    log(`\n${colors.bold}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
    log(`${colors.bold}${colors.magenta}║   COURSE MANAGEMENT — E2E TEST SUITE                         ║${colors.reset}`)
    log(`${colors.bold}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`)

    try {
        await setup()
        await testCourseCRUD()
        await testModuleSystem()
        await testEnrollment()
        await testBulkEnrollment()
        await testFlexibleSections()
    } finally {
        await cleanup()
        const allPassed = printReport("COURSE MANAGEMENT")
        await prisma.$disconnect()
        process.exit(allPassed ? 0 : 1)
    }
}

main()
