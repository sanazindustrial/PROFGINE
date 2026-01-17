import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole } from "@prisma/client"

const lmsIntegrationSchema = z.object({
    lmsType: z.enum(["CANVAS", "BLACKBOARD", "MOODLE", "SCHOOLOGY", "BRIGHTSPACE"]),
    apiKey: z.string().min(1),
    baseUrl: z.string().url(),
    courseIdentifier: z.string().min(1),
    syncAssignments: z.boolean().default(true),
    syncGrades: z.boolean().default(true),
    syncDiscussions: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.PROFESSOR) {
            return NextResponse.json(
                { error: "Only professors can integrate with LMS" },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { lmsType, apiKey, baseUrl, courseIdentifier, syncAssignments, syncGrades, syncDiscussions } = lmsIntegrationSchema.parse(body)

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get("courseId")

        if (!courseId) {
            return NextResponse.json(
                { error: "Course ID is required" },
                { status: 400 }
            )
        }

        // Verify professor owns the course
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId: session.user.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: "Course not found or access denied" },
                { status: 404 }
            )
        }

        // Test LMS connection
        const connectionTest = await testLMSConnection(lmsType, apiKey, baseUrl, courseIdentifier)

        if (!connectionTest.success) {
            return NextResponse.json(
                { error: `LMS connection failed: ${connectionTest.error}` },
                { status: 400 }
            )
        }

        // Store LMS integration configuration
        await prisma.$executeRaw`
      INSERT INTO "LMSIntegration" (
        "courseId",
        "lmsType",
        "apiKey",
        "baseUrl",
        "courseIdentifier",
        "syncAssignments",
        "syncGrades", 
        "syncDiscussions",
        "isActive",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${courseId},
        ${lmsType},
        ${apiKey},
        ${baseUrl},
        ${courseIdentifier},
        ${syncAssignments},
        ${syncGrades},
        ${syncDiscussions},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT ("courseId") 
      DO UPDATE SET
        "lmsType" = ${lmsType},
        "apiKey" = ${apiKey},
        "baseUrl" = ${baseUrl},
        "courseIdentifier" = ${courseIdentifier},
        "syncAssignments" = ${syncAssignments},
        "syncGrades" = ${syncGrades},
        "syncDiscussions" = ${syncDiscussions},
        "updatedAt" = NOW()
    `

        // Perform initial sync
        const syncResults = await performLMSSync(courseId, {
            lmsType,
            apiKey,
            baseUrl,
            courseIdentifier,
            syncAssignments,
            syncGrades,
            syncDiscussions
        })

        return NextResponse.json({
            message: "LMS integration configured successfully",
            connectionTest,
            syncResults
        })

    } catch (error) {
        console.error("LMS integration error:", error)
        return NextResponse.json(
            { error: "Failed to configure LMS integration" },
            { status: 500 }
        )
    }
}

async function testLMSConnection(lmsType: string, apiKey: string, baseUrl: string, courseIdentifier: string) {
    try {
        let testUrl = ""
        let headers: Record<string, string> = {}

        switch (lmsType) {
            case "CANVAS":
                testUrl = `${baseUrl}/api/v1/courses/${courseIdentifier}`
                headers = { "Authorization": `Bearer ${apiKey}` }
                break
            case "BLACKBOARD":
                testUrl = `${baseUrl}/learn/api/public/v1/courses/${courseIdentifier}`
                headers = { "Authorization": `Bearer ${apiKey}` }
                break
            case "MOODLE":
                testUrl = `${baseUrl}/webservice/rest/server.php?wstoken=${apiKey}&wsfunction=core_course_get_courses&moodlewsrestformat=json`
                break
            default:
                return { success: false, error: "LMS type not yet supported" }
        }

        const response = await fetch(testUrl, { headers })

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
        }

        return { success: true, data: await response.json() }

    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Connection test failed" }
    }
}

type StudentSyncError = {
    student: string;
    error: string;
};

type AssignmentSyncError = {
    assignment: string;
    error: string;
};

type GradeSyncError = {
    grade: string;
    error: string;
};

type LmsSyncResults = {
    students: {
        synced: number;
        errors: StudentSyncError[];
    };
    assignments: {
        synced: number;
        errors: AssignmentSyncError[];
    };
    grades: {
        synced: number;
        errors: GradeSyncError[];
    };
};

async function performLMSSync(courseId: string, config: any) {
    const results: LmsSyncResults = {
        students: { synced: 0, errors: [] },
        assignments: { synced: 0, errors: [] },
        grades: { synced: 0, errors: [] }
    }

    try {
        // Sync students
        const studentsData = await fetchLMSStudents(config)
        for (const student of studentsData) {
            try {
                await syncStudentData(courseId, student)
                results.students.synced++
            } catch (error) {
                results.students.errors.push({
                    student: student.email,
                    error: error instanceof Error ? error.message : "Sync failed"
                })
            }
        }

        // Sync assignments if enabled
        if (config.syncAssignments) {
            const assignmentsData = await fetchLMSAssignments(config)
            for (const assignment of assignmentsData) {
                try {
                    await syncAssignmentData(courseId, assignment)
                    results.assignments.synced++
                } catch (error) {
                    results.assignments.errors.push({
                        assignment: assignment.title,
                        error: error instanceof Error ? error.message : "Sync failed"
                    })
                }
            }
        }

        return results

    } catch (error) {
        console.error("LMS sync error:", error)
        return results
    }
}

async function fetchLMSStudents(config: any): Promise<any[]> {
    // Implementation depends on LMS type
    // This is a placeholder - implement actual LMS API calls
    return []
}

async function fetchLMSAssignments(config: any): Promise<any[]> {
    // Implementation depends on LMS type
    // This is a placeholder - implement actual LMS API calls
    return []
}

async function syncStudentData(courseId: string, studentData: any) {
    // Create or update student and enrollment
    const user = await prisma.user.upsert({
        where: { email: studentData.email },
        create: {
            name: studentData.name,
            email: studentData.email,
            role: "STUDENT",
            subscriptionType: "FREE",
        },
        update: {
            name: studentData.name,
        }
    })

    await prisma.enrollment.upsert({
        where: {
            courseId_userId: {
                courseId,
                userId: user.id
            }
        },
        create: {
            courseId,
            userId: user.id
        },
        update: {}
    })
}

async function syncAssignmentData(courseId: string, assignmentData: any) {
    await prisma.assignment.upsert({
        where: {
            courseId_lmsId: {
                courseId,
                lmsId: assignmentData.id
            }
        },
        create: {
            courseId,
            title: assignmentData.title,
            instructions: assignmentData.instructions,
            points: assignmentData.points,
            dueAt: assignmentData.dueDate ? new Date(assignmentData.dueDate) : null,
            lmsId: assignmentData.id,
            type: "OTHER"
        },
        update: {
            title: assignmentData.title,
            instructions: assignmentData.instructions,
            points: assignmentData.points,
            dueAt: assignmentData.dueDate ? new Date(assignmentData.dueDate) : null,
        }
    })
}