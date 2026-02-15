import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Type assertion helper for fields that exist in schema but TypeScript may not yet recognize
interface ContentWithReview {
    reviewStatus?: string | null
}

/**
 * GET /api/content/pending-review
 * Get all AI-generated content pending review for the current user's courses
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')
        const statusFilter = searchParams.get('status') || 'PENDING'

        // Build where clause based on user role
        const isAdmin = session.user.role === 'ADMIN'

        // Base filter for AI-generated content with review status
        const whereClause: Record<string, unknown> = {
            isAIGenerated: true,
            reviewStatus: statusFilter
        }

        // For non-admin users, only show content from their courses
        if (!isAdmin) {
            whereClause.section = {
                courseDesign: {
                    course: {
                        instructorId: session.user.id
                    }
                }
            }
        }

        // Optionally filter by course
        if (courseId) {
            whereClause.section = {
                courseDesign: {
                    courseId
                }
            }
        }

        const pendingContent = await prisma.sectionContent.findMany({
            where: whereClause,
            include: {
                section: {
                    select: {
                        id: true,
                        title: true,
                        courseDesign: {
                            select: {
                                id: true,
                                course: {
                                    select: {
                                        id: true,
                                        title: true,
                                        code: true,
                                        instructorId: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Format response
        const formattedContent = pendingContent.map(content => {
            const contentWithReview = content as typeof content & ContentWithReview
            return {
                id: content.id,
                title: content.title,
                contentType: content.contentType,
                reviewStatus: contentWithReview.reviewStatus || 'PENDING',
                createdAt: content.createdAt,
                section: content.section ? {
                    id: content.section.id,
                    title: content.section.title
                } : null,
                courseDesign: content.section?.courseDesign ? {
                    id: content.section.courseDesign.id
                } : null,
                course: content.section?.courseDesign?.course ? {
                    id: content.section.courseDesign.course.id,
                    title: content.section.courseDesign.course.title,
                    code: content.section.courseDesign.course.code
                } : null
            }
        })

        return NextResponse.json({
            success: true,
            data: formattedContent,
            total: formattedContent.length
        })
    } catch (error) {
        console.error('Error fetching pending review content:', error)
        return NextResponse.json(
            { error: 'Failed to fetch pending review content' },
            { status: 500 }
        )
    }
}
