/**
 * Course Design Studio API Routes
 * Handles all phases of the course design workflow
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { courseDesignStudioService } from "@/lib/services/course-design-studio.service"

export const runtime = "nodejs"

// =============================================================================
// GET - Fetch course design data
// =============================================================================

export async function GET(req: NextRequest) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const courseId = searchParams.get("courseId")
        const action = searchParams.get("action")

        if (!courseId) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 })
        }

        // Verify course access
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId: session.user.id,
            },
        })

        if (!course) {
            return NextResponse.json({ error: "Course not found or access denied" }, { status: 403 })
        }

        switch (action) {
            case "full":
                // Get full course design with all relations
                const fullDesign = await courseDesignStudioService.getCourseDesign(courseId)
                return NextResponse.json({ success: true, data: fullDesign })

            case "evidence":
                // Get evidence kit items
                const design = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!design) {
                    return NextResponse.json({ error: "Course design not initialized" }, { status: 404 })
                }
                const evidenceItems = await courseDesignStudioService.getEvidenceKit(design.id)
                return NextResponse.json({ success: true, data: evidenceItems })

            case "objectives":
                // Get course objectives
                const objDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                    include: { courseObjectives: { orderBy: { orderIndex: "asc" } } },
                })
                return NextResponse.json({ success: true, data: objDesign?.courseObjectives || [] })

            case "sections":
                // Get course sections structure
                const secDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                    include: {
                        courseSections: {
                            where: { parentSectionId: null },
                            orderBy: { orderIndex: "asc" },
                            include: {
                                childSections: {
                                    orderBy: { orderIndex: "asc" },
                                    include: { contents: { orderBy: { orderIndex: "asc" } } },
                                },
                                contents: { orderBy: { orderIndex: "asc" } },
                            },
                        },
                    },
                })
                return NextResponse.json({ success: true, data: secDesign?.courseSections || [] })

            case "syllabus":
                // Get latest syllabus
                const sylDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                    include: { syllabusVersions: { orderBy: { version: "desc" }, take: 1 } },
                })
                return NextResponse.json({ success: true, data: sylDesign?.syllabusVersions[0] || null })

            case "audit":
                // Get audit log
                const auditDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!auditDesign) {
                    return NextResponse.json({ error: "Course design not initialized" }, { status: 404 })
                }
                const auditLogs = await prisma.courseAuditLog.findMany({
                    where: { courseDesignId: auditDesign.id },
                    orderBy: { createdAt: "desc" },
                    take: 50,
                })
                return NextResponse.json({ success: true, data: auditLogs })

            default:
                // Get basic course design metadata
                const basicDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                return NextResponse.json({ success: true, data: basicDesign })
        }
    } catch (error) {
        console.error("Course Design Studio GET error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        )
    }
}

// =============================================================================
// POST - Create/Initialize and AI Generation
// =============================================================================

export async function POST(req: NextRequest) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { action, courseId, ...data } = body

        if (!courseId) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 })
        }

        // Verify course access
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId: session.user.id,
            },
        })

        if (!course) {
            return NextResponse.json({ error: "Course not found or access denied" }, { status: 403 })
        }

        switch (action) {
            // Phase 0.5: Initialize Course Design
            case "initialize":
                const initialized = await courseDesignStudioService.initializeCourseDesign(
                    courseId,
                    data.details || {},
                    session.user.id
                )
                return NextResponse.json({ success: true, data: initialized })

            // Phase 0.5: Bulk Import
            case "bulk-import":
                const importResult = await courseDesignStudioService.bulkImportCourses(
                    data.importData,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: importResult })

            // Phase 1: Add Evidence Item
            case "add-evidence":
                const design = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!design) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const evidence = await courseDesignStudioService.addEvidenceItem(
                    design.id,
                    data.item,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: evidence })

            // Phase 2: Analyze Content
            case "analyze-content":
                const analyzeDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!analyzeDesign) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const analysis = await courseDesignStudioService.analyzeContent(
                    analyzeDesign.id,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: analysis })

            // Phase 3.1: Generate Objectives
            case "generate-objectives":
                const objDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!objDesign) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const objectives = await courseDesignStudioService.generateObjectives(
                    objDesign.id,
                    session.user.id,
                    data.options
                )
                return NextResponse.json({ success: true, data: objectives })

            // Phase 3.2: Suggest Curriculum
            case "suggest-curriculum":
                const curDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!curDesign) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const curriculum = await courseDesignStudioService.suggestCurriculum(
                    curDesign.id,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: curriculum })

            // Phase 6: Generate Lecture Notes
            case "generate-lecture":
                const lectureNotes = await courseDesignStudioService.generateLectureNotes(
                    data.sectionId,
                    session.user.id,
                    data.options
                )
                return NextResponse.json({ success: true, data: { content: lectureNotes } })

            // Phase 6: Design Assessment
            case "design-assessment":
                const rubric = await courseDesignStudioService.designAssessment(
                    data.contentId,
                    session.user.id,
                    data.assessmentType || "assignment"
                )
                return NextResponse.json({ success: true, data: rubric })

            // Phase 7: Generate Syllabus
            case "generate-syllabus":
                const sylDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!sylDesign) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const syllabus = await courseDesignStudioService.generateSyllabus(
                    sylDesign.id,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: syllabus })

            // Phase 8: Run Ready-Check
            case "ready-check":
                const checkDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!checkDesign) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const readyCheck = await courseDesignStudioService.runReadyCheck(
                    checkDesign.id,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: readyCheck })

            // Phase 9: Publish
            case "publish":
                const pubDesign = await prisma.courseDesignMetadata.findUnique({
                    where: { courseId },
                })
                if (!pubDesign) {
                    return NextResponse.json({ error: "Initialize course design first" }, { status: 400 })
                }
                const publishResult = await courseDesignStudioService.publishCourse(
                    pubDesign.id,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: publishResult })

            // Ask Professor GENIE
            case "ask-genie":
                const genieResponse = await courseDesignStudioService.askGenie(
                    {
                        courseId,
                        message: data.message,
                        context: data.context || { currentPhase: "unknown" },
                        conversationId: data.conversationId,
                    },
                    session.user.id
                )
                return NextResponse.json({ success: true, data: genieResponse })

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Course Design Studio POST error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        )
    }
}

// =============================================================================
// PUT - Update operations
// =============================================================================

export async function PUT(req: NextRequest) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { action, courseId, ...data } = body

        if (!courseId) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 })
        }

        // Verify course access
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId: session.user.id,
            },
        })

        if (!course) {
            return NextResponse.json({ error: "Course not found or access denied" }, { status: 403 })
        }

        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId },
        })

        if (!design) {
            return NextResponse.json({ error: "Course design not initialized" }, { status: 404 })
        }

        // Check if locked
        if (design.isLocked && action !== "unlock") {
            return NextResponse.json({ error: "Course design is locked" }, { status: 403 })
        }

        switch (action) {
            // Update course details
            case "update-details":
                const updated = await courseDesignStudioService.initializeCourseDesign(
                    courseId,
                    data.details,
                    session.user.id
                )
                return NextResponse.json({ success: true, data: updated })

            // Update objective
            case "update-objective":
                const objective = await prisma.courseObjective.update({
                    where: { id: data.objectiveId },
                    data: {
                        description: data.description,
                        bloomsLevel: data.bloomsLevel,
                        assessmentMethod: data.assessmentMethod,
                        isApproved: data.isApproved,
                        approvedBy: data.isApproved ? session.user.id : null,
                        approvedAt: data.isApproved ? new Date() : null,
                    },
                })
                return NextResponse.json({ success: true, data: objective })

            // Reorder sections (drag & drop)
            case "reorder-sections":
                const { sections } = data
                for (const sec of sections) {
                    await prisma.courseDesignSection.update({
                        where: { id: sec.id },
                        data: {
                            orderIndex: sec.orderIndex,
                            parentSectionId: sec.parentSectionId,
                        },
                    })
                }
                return NextResponse.json({ success: true })

            // Reorder content (drag & drop)
            case "reorder-content":
                const { contents } = data
                for (const content of contents) {
                    await prisma.sectionContent.update({
                        where: { id: content.id },
                        data: {
                            orderIndex: content.orderIndex,
                            sectionId: content.sectionId,
                        },
                    })
                }
                return NextResponse.json({ success: true })

            // Update section
            case "update-section":
                const section = await prisma.courseDesignSection.update({
                    where: { id: data.sectionId },
                    data: {
                        title: data.title,
                        description: data.description,
                        weekNumber: data.weekNumber,
                        learningOutcomes: data.learningOutcomes
                            ? JSON.stringify(data.learningOutcomes)
                            : undefined,
                    },
                })
                return NextResponse.json({ success: true, data: section })

            // Update content
            case "update-content":
                const content = await prisma.sectionContent.update({
                    where: { id: data.contentId },
                    data: {
                        title: data.title,
                        description: data.description,
                        content: data.content,
                        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                        points: data.points,
                        isRequired: data.isRequired,
                    },
                })
                return NextResponse.json({ success: true, data: content })

            // Approve syllabus
            case "approve-syllabus":
                const syllabus = await prisma.syllabusVersion.update({
                    where: { id: data.syllabusId },
                    data: {
                        status: "APPROVED",
                        isApproved: true,
                        approvedBy: session.user.id,
                        approvedAt: new Date(),
                    },
                })
                return NextResponse.json({ success: true, data: syllabus })

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Course Design Studio PUT error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        )
    }
}

// =============================================================================
// DELETE - Delete operations
// =============================================================================

export async function DELETE(req: NextRequest) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const courseId = searchParams.get("courseId")
        const action = searchParams.get("action")
        const targetId = searchParams.get("id")

        if (!courseId) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 })
        }

        // Verify course access
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId: session.user.id,
            },
        })

        if (!course) {
            return NextResponse.json({ error: "Course not found or access denied" }, { status: 403 })
        }

        const design = await prisma.courseDesignMetadata.findUnique({
            where: { courseId },
        })

        if (design?.isLocked) {
            return NextResponse.json({ error: "Course design is locked" }, { status: 403 })
        }

        switch (action) {
            case "evidence":
                if (!targetId) {
                    return NextResponse.json({ error: "Evidence ID required" }, { status: 400 })
                }
                await prisma.evidenceKitItem.delete({ where: { id: targetId } })
                return NextResponse.json({ success: true })

            case "objective":
                if (!targetId) {
                    return NextResponse.json({ error: "Objective ID required" }, { status: 400 })
                }
                await prisma.courseObjective.delete({ where: { id: targetId } })
                return NextResponse.json({ success: true })

            case "section":
                if (!targetId) {
                    return NextResponse.json({ error: "Section ID required" }, { status: 400 })
                }
                await prisma.courseDesignSection.delete({ where: { id: targetId } })
                return NextResponse.json({ success: true })

            case "content":
                if (!targetId) {
                    return NextResponse.json({ error: "Content ID required" }, { status: 400 })
                }
                await prisma.sectionContent.delete({ where: { id: targetId } })
                return NextResponse.json({ success: true })

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Course Design Studio DELETE error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        )
    }
}
