import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateCourseSyllabus } from "@/lib/services/syllabus-updater"
import { Prisma } from "@prisma/client"

// POST /api/courses/[courseId]/sections - Save course sections and update syllabus
export async function POST(
    request: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        // Authenticate user
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const courseId = params.courseId
        const body = await request.json()
        const { sections, durationWeeks } = body

        if (!sections || !Array.isArray(sections)) {
            return NextResponse.json(
                { error: "Invalid sections data" },
                { status: 400 }
            )
        }

        // Verify course ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: true,
                modules: {
                    include: {
                        contents: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 })
        }

        if (course.instructorId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Begin transaction: update course and recreate modules
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Update course duration if provided
            if (durationWeeks) {
                await tx.course.update({
                    where: { id: courseId },
                    data: {
                        durationWeeks: parseInt(durationWeeks)
                    }
                })
            }

            // 2. Delete existing modules and their contents (cascade)
            await tx.module.deleteMany({
                where: { courseId }
            })

            // 3. Create new modules from sections
            const modulesData = []
            for (const section of sections) {
                const moduleData: any = {
                    courseId,
                    title: section.title,
                    description: section.description || "",
                    sectionNo: section.sectionNo,
                    weekNo: section.weekNo,
                    orderIndex: section.orderIndex,
                    isPublished: section.isPublished ?? false,
                    contents: {
                        create: section.contents.map((content: any, index: number) => ({
                            type: content.type,
                            title: content.title,
                            description: content.description,
                            orderIndex: index,
                            isRequired: content.isRequired ?? false,
                            // Link to existing assignment if assignmentId is provided
                            assignmentId: content.assignmentId || null,
                            // File-specific fields
                            fileUrl: content.fileUrl,
                            // Link-specific fields
                            url: content.url,
                            // Assignment/Quiz-specific fields
                            points: content.points,
                            dueDate: content.dueDate
                                ? new Date(content.dueDate)
                                : null,
                            // Page content
                            content: content.content
                        }))
                    }
                }

                modulesData.push(moduleData)
            }

            // Bulk create modules with their contents
            for (const moduleData of modulesData) {
                await tx.module.create({
                    data: moduleData
                })
            }

            return { success: true }
        })

        // 4. Update syllabus (after transaction completes)
        await updateCourseSyllabus(courseId)

        return NextResponse.json({
            success: true,
            message: "Course sections saved successfully. Syllabus updated.",
            sectionsCreated: sections.length
        })
    } catch (error) {
        console.error("Error saving course sections:", error)
        return NextResponse.json(
            {
                error: "Failed to save sections",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}
