/**
 * Content API - Push/Pull content to/from database
 * GET /api/content - Fetch content (modules, presentations, assignments)
 * POST /api/content - Push new content to database
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// GET /api/content - Fetch content from database
export async function GET(req: NextRequest) {
    try {
        const session = await requireSession()

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") // 'modules' | 'presentations' | 'assignments' | 'all'
        const courseId = searchParams.get("courseId")
        const format = searchParams.get("format") || "json" // 'json' | 'summary'

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Build course access filter
        const courseFilter = courseId
            ? {
                id: courseId,
                OR: [
                    { instructorId: user.id },
                    { enrollments: { some: { userId: user.id } } },
                    ...(user.role === "ADMIN" ? [{}] : []),
                ],
            }
            : {
                OR: [
                    { instructorId: user.id },
                    { enrollments: { some: { userId: user.id } } },
                    ...(user.role === "ADMIN" ? [{}] : []),
                ],
            }

        const result: Record<string, unknown> = {}
        const contentType = type || "all"

        // Fetch modules
        if (contentType === "modules" || contentType === "all") {
            const courses = await prisma.course.findMany({
                where: courseFilter,
                select: {
                    id: true,
                    title: true,
                    code: true,
                    modules: {
                        orderBy: { weekNo: "asc" },
                        include: {
                            contents: { orderBy: { orderIndex: "asc" } },
                            sections: { orderBy: { orderIndex: "asc" } },
                        },
                    },
                },
            })
            result.modules = courses.flatMap((c) =>
                c.modules.map((m) => ({
                    ...m,
                    courseName: c.title,
                    courseCode: c.code,
                    courseId: c.id,
                }))
            )
        }

        // Fetch presentations
        if (contentType === "presentations" || contentType === "all") {
            const presentations = await prisma.presentation.findMany({
                where:
                    user.role === "ADMIN"
                        ? courseId
                            ? { courseId }
                            : {}
                        : courseId
                            ? { courseId, userId: user.id }
                            : { userId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    slides: {
                        orderBy: { slideNumber: "asc" },
                        select: {
                            id: true,
                            slideNumber: true,
                            title: true,
                            content: true,
                            notes: true,
                            layout: true,
                        },
                    },
                    sources: true,
                    course: { select: { id: true, title: true, code: true } },
                },
            })
            result.presentations = presentations
        }

        // Fetch assignments
        if (contentType === "assignments" || contentType === "all") {
            const courses = await prisma.course.findMany({
                where: courseFilter,
                select: {
                    id: true,
                    title: true,
                    code: true,
                    assignments: {
                        orderBy: { createdAt: "desc" },
                        include: {
                            rubric: true,
                            _count: { select: { submissions: true } },
                        },
                    },
                },
            })
            result.assignments = courses.flatMap((c) =>
                c.assignments.map((a) => ({
                    ...a,
                    courseName: c.title,
                    courseCode: c.code,
                    courseId: c.id,
                }))
            )
        }

        // Summary format returns counts and titles only
        if (format === "summary") {
            const summary: Record<string, unknown> = {}
            if (result.modules) {
                summary.modules = {
                    count: (result.modules as unknown[]).length,
                    items: (result.modules as Array<{ id: string; title: string; courseId: string }>).map((m) => ({
                        id: m.id,
                        title: m.title,
                        courseId: m.courseId,
                    })),
                }
            }
            if (result.presentations) {
                summary.presentations = {
                    count: (result.presentations as unknown[]).length,
                    items: (result.presentations as Array<{ id: string; title: string; status: string }>).map((p) => ({
                        id: p.id,
                        title: p.title,
                        status: p.status,
                    })),
                }
            }
            if (result.assignments) {
                summary.assignments = {
                    count: (result.assignments as unknown[]).length,
                    items: (result.assignments as Array<{ id: string; title: string; type: string }>).map((a) => ({
                        id: a.id,
                        title: a.title,
                        type: a.type,
                    })),
                }
            }
            return NextResponse.json({ success: true, data: summary })
        }

        return NextResponse.json({ success: true, data: result })
    } catch (error: unknown) {
        const err = error as { message?: string }
        if (err?.message === "Not authenticated") {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }
        console.error("[GET /api/content]", error)
        return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
    }
}

// POST /api/content - Push content to database
export async function POST(req: NextRequest) {
    try {
        const session = await requireSession()

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const body = await req.json()
        const { type, courseId, data } = body

        if (!type || !data) {
            return NextResponse.json(
                { error: "Missing required fields: type, data" },
                { status: 400 }
            )
        }

        // Verify course access if courseId provided
        if (courseId) {
            const course = await prisma.course.findFirst({
                where: {
                    id: courseId,
                    OR: [
                        { instructorId: user.id },
                        ...(user.role === "ADMIN" ? [{}] : []),
                    ],
                },
            })
            if (!course) {
                return NextResponse.json({ error: "Course not found or access denied" }, { status: 403 })
            }
        }

        let created: unknown

        switch (type) {
            case "module": {
                if (!courseId) {
                    return NextResponse.json({ error: "courseId required for module" }, { status: 400 })
                }
                const lastModule = await prisma.module.findFirst({
                    where: { courseId },
                    orderBy: { weekNo: "desc" },
                })
                created = await prisma.module.create({
                    data: {
                        courseId,
                        title: data.title,
                        content: data.content,
                        description: data.description,
                        weekNo: data.weekNo ?? (lastModule?.weekNo ? lastModule.weekNo + 1 : 1),
                        orderIndex: data.orderIndex ?? 0,
                        objectives: data.objectives ? JSON.stringify(data.objectives) : undefined,
                        isPublished: data.isPublished ?? false,
                    },
                })
                break
            }

            case "module-content": {
                if (!data.moduleId) {
                    return NextResponse.json({ error: "moduleId required for module-content" }, { status: 400 })
                }
                created = await prisma.moduleContent.create({
                    data: {
                        moduleId: data.moduleId,
                        type: data.contentType || "PAGE",
                        title: data.title,
                        description: data.description,
                        content: data.content,
                        fileUrl: data.fileUrl,
                        fileName: data.fileName,
                        fileSize: data.fileSize,
                        fileType: data.fileType,
                        linkUrl: data.linkUrl,
                        orderIndex: data.orderIndex ?? 0,
                        isRequired: data.isRequired ?? true,
                        points: data.points,
                    },
                })
                break
            }

            case "presentation": {
                created = await prisma.presentation.create({
                    data: {
                        ...(courseId ? { courseId } : {}),
                        userId: user.id,
                        title: data.title,
                        description: data.description,
                        templateStyle: data.templateStyle || "modern-minimalist",
                        slideCount: data.slides?.length || 0,
                        targetDuration: data.targetDuration,
                        status: "DRAFT",
                        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
                    },
                })

                // Save slides if provided
                if (data.slides && Array.isArray(data.slides)) {
                    const presentationRecord = created as { id: string }
                    for (const slide of data.slides) {
                        await prisma.presentationSlide.create({
                            data: {
                                presentationId: presentationRecord.id,
                                slideNumber: slide.slideNumber,
                                title: slide.title,
                                content: typeof slide.content === "string" ? slide.content : JSON.stringify(slide.content),
                                notes: slide.notes,
                                layout: slide.layout || "title-content",
                            },
                        })
                    }
                }
                break
            }

            case "assignment": {
                if (!courseId) {
                    return NextResponse.json({ error: "courseId required for assignment" }, { status: 400 })
                }
                created = await prisma.assignment.create({
                    data: {
                        courseId,
                        title: data.title,
                        type: data.type || "OTHER",
                        instructions: data.instructions,
                        points: data.points ?? 100,
                        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
                        lateSubmissionAllowed: data.lateSubmissionAllowed ?? false,
                    },
                })
                break
            }

            case "bulk": {
                // Bulk push multiple content items
                const results: Array<{ type: string; id: string; title: string }> = []
                if (data.modules && Array.isArray(data.modules)) {
                    for (const mod of data.modules) {
                        const m = await prisma.module.create({
                            data: {
                                courseId: mod.courseId || courseId,
                                title: mod.title,
                                content: mod.content,
                                weekNo: mod.weekNo,
                                orderIndex: mod.orderIndex ?? 0,
                            },
                        })
                        results.push({ type: "module", id: m.id, title: m.title })
                    }
                }
                if (data.presentations && Array.isArray(data.presentations)) {
                    for (const pres of data.presentations) {
                        const p = await prisma.presentation.create({
                            data: {
                                ...(pres.courseId || courseId ? { courseId: pres.courseId || courseId } : {}),
                                userId: user.id,
                                title: pres.title,
                                description: pres.description,
                                status: "DRAFT",
                            },
                        })
                        results.push({ type: "presentation", id: p.id, title: p.title })
                    }
                }
                created = { bulkResults: results, totalCreated: results.length }
                break
            }

            default:
                return NextResponse.json(
                    { error: `Unknown content type: ${type}. Use: module, module-content, presentation, assignment, bulk` },
                    { status: 400 }
                )
        }

        return NextResponse.json({ success: true, data: created }, { status: 201 })
    } catch (error: unknown) {
        const err = error as { message?: string }
        if (err?.message === "Not authenticated") {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }
        console.error("[POST /api/content]", error)
        return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
    }
}
