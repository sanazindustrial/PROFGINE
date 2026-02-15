/**
 * Grading & Assessment — E2E Tests
 * 
 * Tests: Rubrics, assignments, submissions, grades, grading activity, assessment design
 * Run: npx tsx tests/e2e/grading-assessment.e2e.ts
 */

import {
    prisma, results, colors, log, logPhase,
    runTest, assert, assertDefined, assertEqual,
    printReport, RUN_ID, TEST_EMAIL_PREFIX,
} from "./helpers"

let professorId: string
let studentId: string
let courseId: string
let assignmentId: string
let rubricId: string
let submissionId: string
let gradeId: string

// ============================================================================
// SETUP
// ============================================================================
async function setup() {
    logPhase("SETUP — Grading & Assessment")

    await runTest("Create test fixtures", "Setup", async () => {
        const emails = [
            `${TEST_EMAIL_PREFIX}-gr-prof@profgenie.test`,
            `${TEST_EMAIL_PREFIX}-gr-stu@profgenie.test`,
        ]
        for (const e of emails) await prisma.user.deleteMany({ where: { email: e } })

        const prof = await prisma.user.create({
            data: { email: emails[0], name: "Grading Prof", role: "PROFESSOR", subscriptionType: "PREMIUM" },
        })
        const stu = await prisma.user.create({
            data: { email: emails[1], name: "Test Student", role: "STUDENT" },
        })
        professorId = prof.id
        studentId = stu.id

        const course = await prisma.course.create({
            data: { title: "E2E Grading Course", instructorId: professorId },
        })
        courseId = course.id
        await prisma.enrollment.create({ data: { courseId, userId: studentId } })

        return `Prof: ${professorId}, Student: ${studentId}, Course: ${courseId}`
    })
}

// ============================================================================
// 1. ASSIGNMENT CREATION
// ============================================================================
async function testAssignments() {
    logPhase("1. ASSIGNMENT CREATION")

    await runTest("Create ESSAY assignment", "Assignments", async () => {
        const a = await prisma.assignment.create({
            data: {
                courseId,
                title: "E2E Essay Assignment",
                type: "ESSAY",
                instructions: "Write a 1000-word essay on algorithms.",
                points: 100,
                dueAt: new Date("2026-04-01"),
            },
        })
        assignmentId = a.id
        assertDefined(a.id, "assignment id")
        assertEqual(a.type, "ESSAY", "type")
        assertEqual(a.points, 100, "points")
        return `Assignment ID: ${a.id}`
    })

    await runTest("Create QUIZ assignment", "Assignments", async () => {
        const a = await prisma.assignment.create({
            data: {
                courseId,
                title: "E2E Quiz",
                type: "QUIZ",
                instructions: "Complete the quiz.",
                points: 50,
            },
        })
        assertEqual(a.type, "QUIZ", "type")
        return "Quiz created"
    })

    await runTest("Create DISCUSSION assignment", "Assignments", async () => {
        const a = await prisma.assignment.create({
            data: {
                courseId,
                title: "E2E Discussion Post",
                type: "DISCUSSION",
                instructions: "Participate in the discussion.",
                points: 25,
            },
        })
        assertEqual(a.type, "DISCUSSION", "type")
        return "Discussion assignment created"
    })

    await runTest("Create PROJECT assignment", "Assignments", async () => {
        const a = await prisma.assignment.create({
            data: {
                courseId,
                title: "E2E Final Project",
                type: "PROJECT",
                points: 200,
            },
        })
        assertEqual(a.type, "PROJECT", "type")
        return "Project created"
    })

    await runTest("Create CASE_STUDY assignment", "Assignments", async () => {
        const a = await prisma.assignment.create({
            data: {
                courseId,
                title: "E2E Case Study",
                type: "CASE_STUDY",
                points: 75,
            },
        })
        assertEqual(a.type, "CASE_STUDY", "type")
        return "Case study created"
    })

    await runTest("Verify all assignment types", "Assignments", async () => {
        const assignments = await prisma.assignment.findMany({ where: { courseId } })
        const types = assignments.map(a => a.type)
        assert(types.includes("ESSAY"), "Missing ESSAY")
        assert(types.includes("QUIZ"), "Missing QUIZ")
        assert(types.includes("DISCUSSION"), "Missing DISCUSSION")
        assert(types.includes("PROJECT"), "Missing PROJECT")
        assert(types.includes("CASE_STUDY"), "Missing CASE_STUDY")
        return `${assignments.length} assignments with all types`
    })
}

// ============================================================================
// 2. RUBRIC MANAGEMENT
// ============================================================================
async function testRubrics() {
    logPhase("2. RUBRIC MANAGEMENT")

    await runTest("Create rubric with criteria", "Rubrics", async () => {
        const rubric = await prisma.rubric.create({
            data: {
                assignmentId,
                criteria: {
                    create: [
                        { label: "Content Quality", maxPoints: 40, order: 1 },
                        { label: "Critical Analysis", maxPoints: 30, order: 2 },
                        { label: "APA Formatting", maxPoints: 20, order: 3 },
                        { label: "Grammar & Mechanics", maxPoints: 10, order: 4 },
                    ],
                },
            },
            include: { criteria: true },
        })
        rubricId = rubric.id
        assertDefined(rubric.id, "rubric id")
        assertEqual(rubric.criteria.length, 4, "criteria count")
        return `Rubric ID: ${rubric.id}, ${rubric.criteria.length} criteria`
    })

    await runTest("Verify criteria ordering", "Rubrics", async () => {
        const criteria = await prisma.rubricCriterion.findMany({
            where: { rubricId },
            orderBy: { order: "asc" },
        })
        assertEqual(criteria.length, 4, "criteria count")
        assertEqual(criteria[0].label, "Content Quality", "first criterion")
        assertEqual(criteria[3].label, "Grammar & Mechanics", "last criterion")

        const totalPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0)
        assertEqual(totalPoints, 100, "total points")
        return `4 criteria totaling ${totalPoints} points`
    })

    await runTest("Assignment → Rubric relationship", "Rubrics", async () => {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { rubric: { include: { criteria: true } } },
        })
        assertDefined(assignment, "assignment")
        assertDefined(assignment.rubric, "rubric")
        assertEqual(assignment.rubric.criteria.length, 4, "criteria count")
        return "Assignment → Rubric → Criteria chain verified"
    })
}

// ============================================================================
// 3. SUBMISSION MANAGEMENT
// ============================================================================
async function testSubmissions() {
    logPhase("3. SUBMISSION MANAGEMENT")

    await runTest("Submit student work", "Submissions", async () => {
        const sub = await prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                status: "SUBMITTED",
                content: "This is my essay submission for the E2E test...",
                contentText: "Plain text version of the essay...",
            },
        })
        submissionId = sub.id
        assertDefined(sub.id, "submission id")
        assertEqual(sub.status, "SUBMITTED", "status")
        return `Submission ID: ${sub.id}`
    })

    await runTest("Verify submission status flow", "Submissions", async () => {
        // SUBMITTED → GRADED → RETURNED
        const graded = await prisma.submission.update({
            where: { id: submissionId },
            data: { status: "GRADED", gradedAt: new Date() },
        })
        assertEqual(graded.status, "GRADED", "status")
        assertDefined(graded.gradedAt, "gradedAt")

        const returned = await prisma.submission.update({
            where: { id: submissionId },
            data: { status: "RETURNED" },
        })
        assertEqual(returned.status, "RETURNED", "status")

        // Reset to SUBMITTED for grade tests
        await prisma.submission.update({
            where: { id: submissionId },
            data: { status: "SUBMITTED", gradedAt: null },
        })
        return "Status flow: SUBMITTED → GRADED → RETURNED verified"
    })

    await runTest("Submission with file URL", "Submissions", async () => {
        const sub = await prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                status: "SUBMITTED",
                fileUrl: "/uploads/student-essay.pdf",
            },
        })
        assertDefined(sub.fileUrl, "fileUrl")
        return "File submission created"
    })
}

// ============================================================================
// 4. GRADE RECORDING
// ============================================================================
async function testGrades() {
    logPhase("4. GRADE RECORDING")

    await runTest("Record grade with feedback", "Grades", async () => {
        const grade = await prisma.grade.create({
            data: {
                submissionId,
                graderId: professorId,
                score: 92.5,
                feedback: "Excellent analysis. Strong use of evidence. Minor APA issues.",
            },
        })
        gradeId = grade.id
        assertDefined(grade.id, "grade id")
        assertEqual(grade.score, 92.5, "score")
        assertDefined(grade.feedback, "feedback")
        return `Grade ID: ${grade.id}, Score: ${grade.score}`
    })

    await runTest("Verify submission → grade relationship", "Grades", async () => {
        const sub = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { grade: true },
        })
        assertDefined(sub, "submission")
        assertDefined(sub.grade, "grade")
        assertEqual(sub.grade.score, 92.5, "score")
        return "Submission → Grade linked"
    })

    await runTest("Grade uniqueness (one per submission)", "Grades", async () => {
        let threw = false
        try {
            await prisma.grade.create({
                data: { submissionId, graderId: professorId, score: 80 },
            })
        } catch {
            threw = true
        }
        assert(threw, "Duplicate grade should throw")
        return "Grade uniqueness enforced"
    })

    await runTest("Update grade", "Grades", async () => {
        const updated = await prisma.grade.update({
            where: { id: gradeId },
            data: { score: 95, feedback: "Updated: Outstanding work." },
        })
        assertEqual(updated.score, 95, "score")
        return "Grade updated to 95"
    })
}

// ============================================================================
// 5. GRADING ACTIVITY LOGGING
// ============================================================================
async function testGradingActivity() {
    logPhase("5. GRADING ACTIVITY LOGGING")

    await runTest("Log AI grading activity", "Grading Activity", async () => {
        const activity = await prisma.gradingActivity.create({
            data: {
                submissionId,
                userId: professorId,
                activityType: "AI_GRADE",
                details: "AI generated initial grade: 92.5 with rubric analysis",
            },
        })
        assertDefined(activity.id, "activity id")
        assertEqual(activity.activityType, "AI_GRADE", "activityType")
        return `Activity ID: ${activity.id}`
    })

    await runTest("Log manual review activity", "Grading Activity", async () => {
        const activity = await prisma.gradingActivity.create({
            data: {
                submissionId,
                userId: professorId,
                activityType: "MANUAL_REVIEW",
                details: "Professor reviewed and adjusted AI grade from 92.5 to 95",
            },
        })
        assertEqual(activity.activityType, "MANUAL_REVIEW", "activityType")
        return "Manual review logged"
    })

    await runTest("Log feedback activity", "Grading Activity", async () => {
        await prisma.gradingActivity.create({
            data: {
                submissionId,
                userId: professorId,
                activityType: "FEEDBACK_SENT",
                details: "Feedback sent to student",
            },
        })
        return "Feedback activity logged"
    })

    await runTest("Verify activity trail for submission", "Grading Activity", async () => {
        const activities = await prisma.gradingActivity.findMany({
            where: { submissionId },
            orderBy: { createdAt: "asc" },
        })
        assert(activities.length >= 3, `Expected ≥3 activities, got ${activities.length}`)
        const types = activities.map(a => a.activityType)
        assert(types.includes("AI_GRADE"), "Missing AI_GRADE")
        assert(types.includes("MANUAL_REVIEW"), "Missing MANUAL_REVIEW")
        assert(types.includes("FEEDBACK_SENT"), "Missing FEEDBACK_SENT")
        return `${activities.length} grading activities verified`
    })
}

// ============================================================================
// CLEANUP
// ============================================================================
async function cleanup() {
    logPhase("CLEANUP — Grading & Assessment")

    await runTest("Remove all test data", "Cleanup", async () => {
        await prisma.gradingActivity.deleteMany({ where: { submissionId } })
        await prisma.grade.deleteMany({ where: { submissionId } })
        await prisma.submission.deleteMany({ where: { assignmentId } })
        // Delete all submissions for other assignments in this course too
        const assignments = await prisma.assignment.findMany({ where: { courseId } })
        for (const a of assignments) {
            await prisma.submission.deleteMany({ where: { assignmentId: a.id } })
        }
        await prisma.rubricCriterion.deleteMany({ where: { rubricId } })
        await prisma.rubric.deleteMany({ where: { assignmentId } })
        await prisma.assignment.deleteMany({ where: { courseId } })
        await prisma.enrollment.deleteMany({ where: { courseId } })
        await prisma.course.deleteMany({ where: { id: courseId } })
        await prisma.user.deleteMany({ where: { email: { startsWith: `${TEST_EMAIL_PREFIX}-gr-` } } })
        return "All grading test data cleaned"
    })
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    log(`\n${colors.bold}${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`)
    log(`${colors.bold}${colors.magenta}║   GRADING & ASSESSMENT — E2E TEST SUITE                      ║${colors.reset}`)
    log(`${colors.bold}${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`)

    try {
        await setup()
        await testAssignments()
        await testRubrics()
        await testSubmissions()
        await testGrades()
        await testGradingActivity()
    } finally {
        await cleanup()
        const allPassed = printReport("GRADING & ASSESSMENT")
        await prisma.$disconnect()
        process.exit(allPassed ? 0 : 1)
    }
}

main()
