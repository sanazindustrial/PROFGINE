import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { parse } from "csv-parse/sync"
import { UserRole } from "@prisma/client"

const bulkEnrollSchema = z.object({
    courseId: z.string(),
    csvData: z.string(),
    notifyStudents: z.boolean().default(false),
})

const studentSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    studentId: z.string().optional(),
    section: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.PROFESSOR) {
            return NextResponse.json(
                { error: "Only professors can enroll students" },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { courseId, csvData, notifyStudents } = bulkEnrollSchema.parse(body)

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

        // Parse CSV data
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        })

        type EnrollmentResult = {
            email: string
            name: string
            userId?: string
            status: string
            error?: string
        }

        const results: {
            successful: EnrollmentResult[]
            failed: EnrollmentResult[]
            updated: EnrollmentResult[]
        } = {
            successful: [],
            failed: [],
            updated: []
        }

        for (const record of records) {
            try {
                const studentData = studentSchema.parse(record)

                // Check if user already exists
                let user = await prisma.user.findUnique({
                    where: { email: studentData.email }
                })

                if (!user) {
                    // Create new student user
                    user = await prisma.user.create({
                        data: {
                            name: studentData.name,
                            email: studentData.email,
                            role: UserRole.STUDENT,
                            subscriptionType: "FREE",
                        }
                    })

                    // TODO: Create student profile if studentId provided
                    // Note: studentProfile model needs to be added to schema.prisma first
                    if (studentData.studentId) {
                        // For now, we'll skip creating the student profile
                        // until the StudentProfile model is added to the Prisma schema
                        console.log(`Student ID ${studentData.studentId} provided for ${studentData.email}, but StudentProfile model not available`)
                    }
                }

                // Check if already enrolled
                const existingEnrollment = await prisma.enrollment.findFirst({
                    where: {
                        courseId,
                        userId: user.id
                    }
                })

                if (existingEnrollment) {
                    results.updated.push({
                        email: studentData.email,
                        name: studentData.name,
                        status: "Already enrolled"
                    })
                    continue
                }

                // Create enrollment
                await prisma.enrollment.create({
                    data: {
                        courseId,
                        userId: user.id
                    }
                })

                results.successful.push({
                    email: studentData.email,
                    name: studentData.name,
                    userId: user.id,
                    status: "Enrolled successfully"
                })

                // TODO: Send notification email if notifyStudents is true
                if (notifyStudents) {
                    // await sendEnrollmentNotification(user.email, course.title)
                }

            } catch (error) {
                const rec = record as any
                results.failed.push({
                    email: rec.email || "Unknown",
                    name: rec.name || "Unknown",
                    status: "Failed",
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            }
        }

        return NextResponse.json({
            message: "Bulk enrollment completed",
            results,
            summary: {
                total: records.length,
                successful: results.successful.length,
                failed: results.failed.length,
                updated: results.updated.length
            }
        })

    } catch (error) {
        console.error("Bulk enrollment error:", error)
        return NextResponse.json(
            { error: "Failed to process bulk enrollment" },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.PROFESSOR) {
            return NextResponse.json(
                { error: "Unauthorized access" },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get("courseId")

        if (!courseId) {
            return NextResponse.json(
                { error: "Course ID is required" },
                { status: 400 }
            )
        }

        // Get enrollment template and current enrollments
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId,
                course: {
                    instructorId: session.user.id
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true
                    }
                }
            }
        })

        return NextResponse.json({
            enrollments,
            template: {
                headers: ["name", "email", "studentId", "section"],
                example: [
                    "John Doe,john.doe@university.edu,12345,Section A",
                    "Jane Smith,jane.smith@university.edu,12346,Section B"
                ]
            }
        })

    } catch (error) {
        console.error("Get enrollments error:", error)
        return NextResponse.json(
            { error: "Failed to retrieve enrollments" },
            { status: 500 }
        )
    }
}