import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notification.service'

// Type assertion helper for fields that exist in schema but TypeScript may not yet recognize
interface ContentWithReview {
    reviewStatus?: string | null
    reviewedBy?: string | null
    reviewedAt?: Date | null
    reviewNotes?: string | null
}

/**
 * GET /api/content/[contentId]/review
 * Get review status of AI-generated content
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { contentId } = await params

        const content = await prisma.sectionContent.findUnique({
            where: { id: contentId },
            include: {
                section: {
                    include: {
                        courseDesign: {
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        title: true,
                                        instructorId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 })
        }

        // Check authorization - must be instructor or admin
        const course = content.section?.courseDesign?.course
        const isAuthorized =
            session.user.role === 'ADMIN' ||
            course?.instructorId === session.user.id

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Type assertion for review fields
        const contentWithReview = content as typeof content & ContentWithReview

        return NextResponse.json({
            success: true,
            data: {
                contentId: content.id,
                title: content.title,
                contentType: content.contentType,
                isAIGenerated: content.isAIGenerated,
                reviewStatus: contentWithReview.reviewStatus || 'PENDING',
                reviewedBy: contentWithReview.reviewedBy,
                reviewedAt: contentWithReview.reviewedAt,
                reviewNotes: contentWithReview.reviewNotes,
                course: course ? {
                    id: course.id,
                    title: course.title
                } : null
            }
        })
    } catch (error) {
        console.error('Error fetching content review status:', error)
        return NextResponse.json(
            { error: 'Failed to fetch review status' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/content/[contentId]/review
 * Update review status of AI-generated content (approve/reject)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { contentId } = await params
        const body = await request.json()
        const { status, notes } = body

        // Validate status
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION']
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        // Find content with course info
        const content = await prisma.sectionContent.findUnique({
            where: { id: contentId },
            include: {
                section: {
                    include: {
                        courseDesign: {
                            include: {
                                course: {
                                    include: {
                                        instructor: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 })
        }

        // Check authorization - must be instructor or admin
        const course = content.section?.courseDesign?.course
        const isAuthorized =
            session.user.role === 'ADMIN' ||
            course?.instructorId === session.user.id

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Update review status using raw update to handle new fields
        const updatedContent = await prisma.$executeRaw`
            UPDATE section_contents 
            SET "reviewStatus" = ${status}::"ReviewStatus",
                "reviewedBy" = ${session.user.id},
                "reviewedAt" = NOW(),
                "reviewNotes" = ${notes || null}
            WHERE id = ${contentId}
        `

        // Send notification based on status change
        if (course && (status === 'APPROVED' || status === 'REJECTED')) {
            try {
                await notificationService.sendAIContentStatusNotification(
                    status === 'APPROVED' ? 'approved' : 'rejected',
                    content.title,
                    content.contentType,
                    course.id
                )
            } catch (notifError) {
                console.error('Failed to send notification:', notifError)
                // Don't fail the request if notification fails
            }
        }

        return NextResponse.json({
            success: true,
            message: `Content ${status.toLowerCase()} successfully`,
            data: {
                contentId,
                reviewStatus: status,
                reviewedBy: session.user.id,
                reviewedAt: new Date(),
                reviewNotes: notes
            }
        })
    } catch (error) {
        console.error('Error updating content review:', error)
        return NextResponse.json(
            { error: 'Failed to update review status' },
            { status: 500 }
        )
    }
}
