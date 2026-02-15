/**
 * Export API Route
 * Handles export requests for syllabus and course materials in PDF, Word, and PPTX formats
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { exportService, type SyllabusExportData, type LectureExportData } from "@/lib/services/export.service"

// =============================================================================
// POST /api/export - Generate exports
// =============================================================================

export async function POST(request: NextRequest) {
    const session = await requireSession()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { type, format, courseId, syllabusId, lectureData, presentationData } = body

        // =================================================================
        // Custom Presentation Export (from editor)
        // =================================================================
        if (presentationData && presentationData.slides) {
            // Convert presentation data from editor to export format
            const lectureExportData: LectureExportData = {
                title: presentationData.title || 'Presentation',
                courseTitle: presentationData.subtitle || '',
                date: presentationData.date,
                objectives: [],
                sections: presentationData.slides.slice(1).map((slide: any) => ({
                    title: slide.title,
                    content: slide.content
                        .map((c: any) => c.content)
                        .join('\n\n'),
                    activities: [],
                })),
                summary: '',
            }

            let result
            switch (format) {
                case 'pdf':
                    result = await exportService.generateLecturePdf(lectureExportData)
                    break
                case 'docx':
                case 'word':
                    result = await exportService.generateLectureDocx(lectureExportData)
                    break
                case 'pptx':
                case 'powerpoint':
                case 'key':
                case 'google':
                    result = await exportService.generateLecturePptx(lectureExportData)
                    break
                case 'odp':
                    // ODP is similar to PPTX, export as PPTX for now
                    result = await exportService.generateLecturePptx(lectureExportData)
                    if (result.success && result.fileName) {
                        result.fileName = result.fileName.replace('.pptx', '.odp')
                    }
                    break
                case 'html':
                    result = await exportService.generateLecturePdf(lectureExportData)
                    // HTML is same as PDF (HTML-based)
                    break
                case 'images':
                    // For images, export as PDF first (user can convert)
                    result = await exportService.generateLecturePdf(lectureExportData)
                    break
                case 'all':
                    const allResults = await exportService.exportLectureAll(lectureExportData)
                    return NextResponse.json({
                        success: true,
                        exports: allResults
                    })
                default:
                    return NextResponse.json(
                        { error: `Unsupported format: ${format}` },
                        { status: 400 }
                    )
            }

            return NextResponse.json(result)
        }

        if (!type || !format) {
            return NextResponse.json(
                { error: 'Missing required fields: type and format' },
                { status: 400 }
            )
        }

        // =================================================================
        // Syllabus Export
        // =================================================================
        if (type === 'syllabus') {
            if (!courseId && !syllabusId) {
                return NextResponse.json(
                    { error: 'courseId or syllabusId required for syllabus export' },
                    { status: 400 }
                )
            }

            // Fetch course and syllabus data
            let courseDesign
            if (syllabusId) {
                const syllabus = await prisma.syllabusVersion.findUnique({
                    where: { id: syllabusId },
                    include: {
                        courseDesign: {
                            include: {
                                course: { include: { instructor: true, modules: true } },
                                courseObjectives: true,
                            }
                        }
                    }
                })
                courseDesign = syllabus?.courseDesign
            } else {
                courseDesign = await prisma.courseDesignMetadata.findFirst({
                    where: { courseId },
                    include: {
                        course: { include: { instructor: true, modules: true } },
                        courseObjectives: true,
                        syllabusVersions: { take: 1, orderBy: { createdAt: 'desc' } }
                    }
                })
            }

            if (!courseDesign) {
                return NextResponse.json({ error: 'Course design not found' }, { status: 404 })
            }

            // Check access: must be instructor or admin
            if (courseDesign.course.instructorId !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 })
            }

            const syllabus = syllabusId
                ? await prisma.syllabusVersion.findUnique({ where: { id: syllabusId } })
                : (courseDesign as any).syllabusVersions?.[0]

            const syllabusContent = syllabus?.content as Record<string, any> | undefined

            const exportData: SyllabusExportData = {
                courseTitle: courseDesign.course.title,
                courseCode: courseDesign.course.code || undefined,
                semester: syllabusContent?.semester,
                instructor: {
                    name: courseDesign.course.instructor.name || 'Instructor',
                    email: courseDesign.course.instructor.email,
                    office: syllabusContent?.instructorInfo?.office,
                    officeHours: syllabusContent?.instructorInfo?.officeHours,
                },
                description: courseDesign.course.description || undefined,
                objectives: courseDesign.courseObjectives.map(o => o.description),
                modules: courseDesign.course.modules.map((m, i) => ({
                    title: m.title,
                    week: i + 1,
                    topics: m.description ? [m.description] : [],
                })),
                gradingPolicy: syllabusContent?.gradingPolicy,
                policies: syllabusContent?.policies,
                schedule: syllabusContent?.schedule,
            }

            let result
            switch (format) {
                case 'pdf':
                    result = await exportService.generateSyllabusPdf(exportData)
                    break
                case 'docx':
                case 'word':
                    result = await exportService.generateSyllabusDocx(exportData)
                    break
                case 'pptx':
                case 'powerpoint':
                    result = await exportService.generateSyllabusPptx(exportData)
                    break
                case 'all':
                    const allResults = await exportService.exportSyllabusAll(exportData)
                    return NextResponse.json({
                        success: true,
                        exports: allResults
                    })
                default:
                    return NextResponse.json(
                        { error: `Unsupported format: ${format}. Use pdf, docx, pptx, or all` },
                        { status: 400 }
                    )
            }

            // Update syllabus with export URLs if successful
            if (result.success && syllabus) {
                const updateData: Record<string, string> = {}
                if (format === 'pdf' && result.url) updateData.pdfUrl = result.url
                if ((format === 'docx' || format === 'word') && result.url) updateData.wordUrl = result.url

                if (Object.keys(updateData).length > 0) {
                    await prisma.syllabusVersion.update({
                        where: { id: syllabus.id },
                        data: updateData
                    })
                }
            }

            return NextResponse.json(result)
        }

        // =================================================================
        // Lecture Export
        // =================================================================
        if (type === 'lecture') {
            const { sectionId, lectureData } = body

            let exportData: LectureExportData

            // Option 1: Fetch lecture from section in database
            if (sectionId) {
                const section = await prisma.courseDesignSection.findUnique({
                    where: { id: sectionId },
                    include: {
                        courseDesign: {
                            include: {
                                course: { include: { instructor: true } },
                                courseObjectives: true,
                            }
                        },
                        contents: { where: { contentType: 'LECTURE' }, orderBy: { orderIndex: 'asc' } }
                    }
                })

                if (!section) {
                    return NextResponse.json({ error: 'Section not found' }, { status: 404 })
                }

                // Check access
                if (section.courseDesign.course.instructorId !== session.user.id && session.user.role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
                }

                const lectureContent = section.contents[0]
                if (!lectureContent) {
                    return NextResponse.json({ error: 'No lecture content found in this section' }, { status: 404 })
                }

                // Parse lecture content into sections
                const content = lectureContent.aiGeneratedContent || lectureContent.content || ''
                const parsedSections = parseLectureContent(content)

                exportData = {
                    title: section.title,
                    courseTitle: section.courseDesign.course.title,
                    date: section.weekNumber ? `Week ${section.weekNumber}` : undefined,
                    objectives: section.courseDesign.courseObjectives
                        .slice(0, 5)
                        .map(o => o.description) || [],
                    sections: parsedSections,
                    summary: section.description || undefined,
                }
            }
            // Option 2: Use provided lectureData directly
            else if (lectureData) {
                exportData = {
                    title: lectureData.title,
                    courseTitle: lectureData.courseTitle,
                    date: lectureData.date,
                    objectives: lectureData.objectives || [],
                    sections: lectureData.sections || [],
                    keyTerms: lectureData.keyTerms || [],
                    summary: lectureData.summary,
                    nextClass: lectureData.nextClass,
                }
            } else {
                return NextResponse.json(
                    { error: 'Either sectionId or lectureData is required for lecture export' },
                    { status: 400 }
                )
            }

            let result
            switch (format) {
                case 'pdf':
                    result = await exportService.generateLecturePdf(exportData)
                    break
                case 'docx':
                case 'word':
                    result = await exportService.generateLectureDocx(exportData)
                    break
                case 'pptx':
                case 'powerpoint':
                    result = await exportService.generateLecturePptx(exportData)
                    break
                case 'all':
                    const allResults = await exportService.exportLectureAll(exportData)
                    return NextResponse.json({
                        success: true,
                        exports: allResults
                    })
                default:
                    return NextResponse.json(
                        { error: `Unsupported format: ${format}. Use pdf, docx, pptx, or all` },
                        { status: 400 }
                    )
            }

            return NextResponse.json(result)
        }

        return NextResponse.json(
            { error: `Unsupported export type: ${type}. Use 'syllabus' or 'lecture'` },
            { status: 400 }
        )

    } catch (error) {
        console.error('[Export API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Export failed' },
            { status: 500 }
        )
    }
}

/**
 * Parse lecture content (markdown/html) into sections
 */
function parseLectureContent(content: string): { title: string; content: string; activities?: string[] }[] {
    const sections: { title: string; content: string; activities?: string[] }[] = []

    // Split by headings (## or <h2>)
    const headingPattern = /(?:^|\n)(?:#{2}\s+|<h2[^>]*>)(.+?)(?:<\/h2>|\n)/gi
    const parts = content.split(headingPattern)

    // First part before any heading
    if (parts[0] && parts[0].trim()) {
        sections.push({
            title: 'Introduction',
            content: parts[0].trim()
        })
    }

    // Process remaining parts (title, content pairs)
    for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i]?.trim() || `Section ${Math.floor(i / 2) + 1}`
        const sectionContent = parts[i + 1]?.trim() || ''

        // Extract activities if present
        const activityMatch = sectionContent.match(/(?:activities?|exercises?):\s*\n?((?:[-*]\s*.+\n?)+)/i)
        let activities: string[] | undefined

        if (activityMatch) {
            activities = activityMatch[1]
                .split(/\n/)
                .map(line => line.replace(/^[-*]\s*/, '').trim())
                .filter(Boolean)
        }

        sections.push({
            title,
            content: sectionContent.replace(/(?:activities?|exercises?):\s*\n?(?:[-*]\s*.+\n?)+/i, '').trim(),
            activities
        })
    }

    // If no sections found, create one from the whole content
    if (sections.length === 0 && content.trim()) {
        sections.push({
            title: 'Lecture Content',
            content: content.trim()
        })
    }

    return sections
}

// =============================================================================
// GET /api/export - Get export status and available downloads
// =============================================================================

export async function GET(request: NextRequest) {
    const session = await requireSession()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const syllabusId = searchParams.get('syllabusId')

    if (!courseId && !syllabusId) {
        return NextResponse.json(
            { error: 'courseId or syllabusId parameter required' },
            { status: 400 }
        )
    }

    try {
        let syllabus

        if (syllabusId) {
            syllabus = await prisma.syllabusVersion.findUnique({
                where: { id: syllabusId },
                select: {
                    id: true,
                    pdfUrl: true,
                    wordUrl: true,
                    status: true,
                    version: true,
                    courseDesign: {
                        select: {
                            course: {
                                select: { instructorId: true }
                            }
                        }
                    }
                }
            })
        } else {
            const courseDesign = await prisma.courseDesignMetadata.findFirst({
                where: { courseId: courseId! },
                include: {
                    course: { select: { instructorId: true } },
                    syllabusVersions: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            pdfUrl: true,
                            wordUrl: true,
                            status: true,
                            version: true,
                        }
                    }
                }
            })
            syllabus = courseDesign?.syllabusVersions?.[0]

            // Add access check
            if (courseDesign && courseDesign.course.instructorId !== session.user.id && session.user.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 })
            }
        }

        if (!syllabus) {
            return NextResponse.json({ error: 'Syllabus not found' }, { status: 404 })
        }

        return NextResponse.json({
            syllabusId: syllabus.id,
            version: syllabus.version,
            status: syllabus.status,
            exports: {
                pdf: syllabus.pdfUrl ? { available: true, url: syllabus.pdfUrl } : { available: false },
                word: syllabus.wordUrl ? { available: true, url: syllabus.wordUrl } : { available: false },
            }
        })

    } catch (error) {
        console.error('[Export API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get export status' },
            { status: 500 }
        )
    }
}
