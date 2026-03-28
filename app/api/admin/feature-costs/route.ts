import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_FEATURE_COSTS = [
    { featureType: 'COURSE_CREATION', creditCost: 5, displayName: 'Course Creation', description: 'Create a new course' },
    { featureType: 'ASSIGNMENT_CREATION', creditCost: 2, displayName: 'Assignment Creation', description: 'Create a new assignment' },
    { featureType: 'DISCUSSION_CREATION', creditCost: 1, displayName: 'Discussion Creation', description: 'Create a discussion thread' },
    { featureType: 'CUSTOM_RUBRICS', creditCost: 3, displayName: 'Custom Rubrics', description: 'Create custom grading rubric' },
    { featureType: 'AI_GRADING', creditCost: 1, displayName: 'AI Grading', description: 'AI-powered grading per submission' },
    { featureType: 'ADVANCED_ANALYTICS', creditCost: 5, displayName: 'Advanced Analytics', description: 'Generate analytics report' },
    { featureType: 'BULK_OPERATIONS', creditCost: 10, displayName: 'Bulk Operations', description: 'Bulk grading or operations' },
    { featureType: 'API_ACCESS', creditCost: 15, displayName: 'API Access', description: 'External API usage per call' },
    { featureType: 'PROFESSOR_STYLE_LEARNING', creditCost: 8, displayName: 'Professor Style Learning', description: 'AI learns professor grading style' },
    { featureType: 'ORGANIZATION_MANAGEMENT', creditCost: 20, displayName: 'Organization Management', description: 'Organization management operations' },
    { featureType: 'CUSTOM_PROMPTS', creditCost: 3, displayName: 'Custom Prompts', description: 'Custom AI prompt templates' },
    { featureType: 'PRESENTATION_GENERATION', creditCost: 5, displayName: 'Presentation Generation', description: 'Generate AI presentations' },
    { featureType: 'COURSE_DESIGN', creditCost: 10, displayName: 'Course Design Studio', description: 'AI course design assistance' },
] as const

// GET - Retrieve all feature costs
export async function GET() {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, isOwner: true }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        let featureCosts = await prisma.featureCost.findMany({
            orderBy: { displayName: 'asc' }
        })

        // Seed defaults if empty
        if (featureCosts.length === 0) {
            await prisma.featureCost.createMany({
                data: DEFAULT_FEATURE_COSTS.map(fc => ({
                    featureType: fc.featureType as any,
                    creditCost: fc.creditCost,
                    displayName: fc.displayName,
                    description: fc.description,
                }))
            })
            featureCosts = await prisma.featureCost.findMany({
                orderBy: { displayName: 'asc' }
            })
        }

        return NextResponse.json({ featureCosts })
    } catch (error) {
        console.error('Get feature costs error:', error)
        return NextResponse.json({ error: 'Failed to get feature costs' }, { status: 500 })
    }
}

// PUT - Update a feature cost (admin only)
export async function PUT(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, isOwner: true }
        })

        if (!user || user.role !== 'ADMIN' || !user.isOwner) {
            return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
        }

        const { featureType, creditCost, isActive } = await request.json()

        if (!featureType) {
            return NextResponse.json({ error: 'featureType is required' }, { status: 400 })
        }

        if (creditCost !== undefined && (typeof creditCost !== 'number' || creditCost < 0)) {
            return NextResponse.json({ error: 'creditCost must be a non-negative number' }, { status: 400 })
        }

        const updated = await prisma.featureCost.upsert({
            where: { featureType },
            update: {
                ...(creditCost !== undefined && { creditCost }),
                ...(isActive !== undefined && { isActive }),
            },
            create: {
                featureType,
                creditCost: creditCost ?? 1,
                displayName: featureType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                isActive: isActive ?? true,
            }
        })

        return NextResponse.json({ featureCost: updated })
    } catch (error) {
        console.error('Update feature cost error:', error)
        return NextResponse.json({ error: 'Failed to update feature cost' }, { status: 500 })
    }
}
