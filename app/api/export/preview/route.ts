/**
 * Export Preview API
 * Generates preview data for presentation editing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'
import { prisma } from '@/lib/prisma'

// =============================================================================
// TYPES
// =============================================================================

interface Slide {
    id: string
    title: string
    content: { id: string; type: string; content: string }[]
    notes?: string
    layout: 'title' | 'content' | 'twoColumn' | 'bullets' | 'blank'
}

function generateId(): string {
    return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// =============================================================================
// SYLLABUS TO SLIDES CONVERTER
// =============================================================================

async function syllabusToSlides(courseId: string): Promise<{ title: string; slides: Slide[] }> {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            instructor: true,
            modules: {
                include: {
                    contents: true,
                },
                orderBy: { orderIndex: 'asc' },
            },
            assignments: {
                orderBy: { dueAt: 'asc' },
            },
            designMetadata: {
                include: {
                    courseObjectives: true,
                },
            },
        },
    })

    if (!course) {
        throw new Error('Course not found')
    }

    const slides: Slide[] = []

    // Title slide
    slides.push({
        id: generateId(),
        title: course.title,
        content: [
            {
                id: generateId(),
                type: 'text',
                content: `${course.code || ''} ${course.term || ''}`.trim() || course.title,
            },
            {
                id: generateId(),
                type: 'text',
                content: course.instructor?.name || 'Instructor',
            },
        ],
        layout: 'title',
        notes: 'Welcome and introduction to the course',
    })

    // Course Description slide
    if (course.description) {
        slides.push({
            id: generateId(),
            title: 'Course Description',
            content: [
                {
                    id: generateId(),
                    type: 'text',
                    content: course.description,
                },
            ],
            layout: 'content',
            notes: '',
        })
    }

    // Learning Objectives slide
    const objectives = course.designMetadata?.courseObjectives
    if (objectives && objectives.length > 0) {
        slides.push({
            id: generateId(),
            title: 'Learning Objectives',
            content: [
                {
                    id: generateId(),
                    type: 'bullets',
                    content: objectives.map((obj) => obj.description).join('\n'),
                },
            ],
            layout: 'bullets',
            notes: 'By the end of this course, students will be able to...',
        })
    }

    // Course Structure/Modules
    if (course.modules && course.modules.length > 0) {
        // Overview slide
        slides.push({
            id: generateId(),
            title: 'Course Modules',
            content: [
                {
                    id: generateId(),
                    type: 'bullets',
                    content: course.modules.map((m, i) => `${i + 1}. ${m.title}`).join('\n'),
                },
            ],
            layout: 'bullets',
            notes: 'Overview of all course modules',
        })

        // Individual module slides (first 6)
        course.modules.slice(0, 6).forEach((module, index) => {
            slides.push({
                id: generateId(),
                title: `Module ${index + 1}: ${module.title}`,
                content: [
                    {
                        id: generateId(),
                        type: 'text',
                        content: module.description || `Module ${index + 1} content`,
                    },
                    ...(module.contents && module.contents.length > 0
                        ? [
                            {
                                id: generateId(),
                                type: 'bullets' as const,
                                content: module.contents.map((c) => c.title).join('\n'),
                            },
                        ]
                        : []),
                ],
                layout: 'content',
                notes: `Details for module ${index + 1}`,
            })
        })

        if (course.modules.length > 6) {
            slides.push({
                id: generateId(),
                title: 'Additional Modules',
                content: [
                    {
                        id: generateId(),
                        type: 'bullets',
                        content: course.modules
                            .slice(6)
                            .map((m, i) => `${i + 7}. ${m.title}`)
                            .join('\n'),
                    },
                ],
                layout: 'bullets',
                notes: 'Remaining modules overview',
            })
        }
    }

    // Assignments Overview
    if (course.assignments && course.assignments.length > 0) {
        slides.push({
            id: generateId(),
            title: 'Assignments & Assessments',
            content: [
                {
                    id: generateId(),
                    type: 'bullets',
                    content: course.assignments
                        .slice(0, 8)
                        .map((a) => a.title)
                        .join('\n'),
                },
            ],
            layout: 'bullets',
            notes: 'Overview of course assignments and assessments',
        })
    }

    // Closing slide
    slides.push({
        id: generateId(),
        title: 'Questions?',
        content: [
            {
                id: generateId(),
                type: 'text',
                content: course.instructor?.email || 'Contact the instructor for more information',
            },
        ],
        layout: 'title',
        notes: 'Q&A and wrap-up',
    })

    return {
        title: `${course.title} - Syllabus`,
        slides,
    }
}

// =============================================================================
// LECTURE TO SLIDES CONVERTER
// =============================================================================

async function lectureToSlides(sectionId: string): Promise<{ title: string; slides: Slide[] }> {
    const section = await prisma.sectionContent.findUnique({
        where: { id: sectionId },
        include: {
            section: {
                include: {
                    courseDesign: {
                        include: {
                            course: true,
                        },
                    },
                },
            },
        },
    })

    if (!section) {
        throw new Error('Section content not found')
    }

    const slides: Slide[] = []
    const lectureTitle = section.section?.title || section.title || 'Lecture'
    const courseTitle = section.section?.courseDesign?.course?.title || ''

    // Title slide
    slides.push({
        id: generateId(),
        title: lectureTitle,
        content: [
            {
                id: generateId(),
                type: 'text',
                content: courseTitle,
            },
        ],
        layout: 'title',
        notes: 'Opening slide',
    })

    // Parse lecture content
    const contentText = section.content || section.aiGeneratedContent || ''

    // Try to parse as JSON first
    let parsedContent: any = null
    try {
        parsedContent = JSON.parse(contentText)
    } catch {
        // Not JSON, treat as markdown/text
    }

    if (parsedContent && typeof parsedContent === 'object') {
        // Structured content
        if (parsedContent.objectives) {
            slides.push({
                id: generateId(),
                title: 'Learning Objectives',
                content: [
                    {
                        id: generateId(),
                        type: 'bullets',
                        content: Array.isArray(parsedContent.objectives)
                            ? parsedContent.objectives.join('\n')
                            : parsedContent.objectives,
                    },
                ],
                layout: 'bullets',
                notes: '',
            })
        }

        if (parsedContent.sections && Array.isArray(parsedContent.sections)) {
            parsedContent.sections.forEach((sec: any) => {
                slides.push({
                    id: generateId(),
                    title: sec.title || 'Section',
                    content: [
                        {
                            id: generateId(),
                            type: 'text',
                            content: sec.content || '',
                        },
                        ...(sec.activities
                            ? [
                                {
                                    id: generateId(),
                                    type: 'bullets' as const,
                                    content: Array.isArray(sec.activities)
                                        ? sec.activities.join('\n')
                                        : sec.activities,
                                },
                            ]
                            : []),
                    ],
                    layout: 'content',
                    notes: sec.notes || '',
                })
            })
        }

        if (parsedContent.keyTerms && Array.isArray(parsedContent.keyTerms)) {
            slides.push({
                id: generateId(),
                title: 'Key Terms',
                content: [
                    {
                        id: generateId(),
                        type: 'bullets',
                        content: parsedContent.keyTerms
                            .map((kt: any) => `${kt.term}: ${kt.definition}`)
                            .join('\n'),
                    },
                ],
                layout: 'bullets',
                notes: '',
            })
        }

        if (parsedContent.summary) {
            slides.push({
                id: generateId(),
                title: 'Summary',
                content: [
                    {
                        id: generateId(),
                        type: 'text',
                        content: parsedContent.summary,
                    },
                ],
                layout: 'content',
                notes: '',
            })
        }
    } else {
        // Parse as markdown/text
        const sections = contentText.split(/(?=^#{1,3}\s)/m).filter(Boolean)

        if (sections.length > 0) {
            sections.forEach((sectionText: string) => {
                const lines = sectionText.trim().split('\n')
                const firstLine = lines[0] || ''
                const title = firstLine.replace(/^#+\s*/, '').trim() || 'Content'
                const restContent = lines.slice(1).join('\n').trim()

                // Check if content is bullet points
                const isBullets = restContent.split('\n').every((line) =>
                    line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim() === ''
                )

                slides.push({
                    id: generateId(),
                    title,
                    content: [
                        {
                            id: generateId(),
                            type: isBullets ? 'bullets' : 'text',
                            content: isBullets
                                ? restContent
                                    .split('\n')
                                    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
                                    .filter(Boolean)
                                    .join('\n')
                                : restContent,
                        },
                    ],
                    layout: isBullets ? 'bullets' : 'content',
                    notes: '',
                })
            })
        } else {
            // Single content slide
            slides.push({
                id: generateId(),
                title: 'Content',
                content: [
                    {
                        id: generateId(),
                        type: 'text',
                        content: contentText.substring(0, 1000),
                    },
                ],
                layout: 'content',
                notes: '',
            })
        }
    }

    // Questions slide
    slides.push({
        id: generateId(),
        title: 'Questions?',
        content: [],
        layout: 'title',
        notes: 'Q&A time',
    })

    return {
        title: lectureTitle,
        slides,
    }
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')
        const sectionId = searchParams.get('sectionId')

        if (courseId) {
            const result = await syllabusToSlides(courseId)
            return NextResponse.json(result)
        }

        if (sectionId) {
            const result = await lectureToSlides(sectionId)
            return NextResponse.json(result)
        }

        return NextResponse.json(
            { error: 'courseId or sectionId required' },
            { status: 400 }
        )
    } catch (error) {
        console.error('[Preview API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Preview generation failed' },
            { status: 500 }
        )
    }
}
