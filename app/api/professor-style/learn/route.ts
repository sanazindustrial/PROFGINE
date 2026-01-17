import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { gradingRequest, satisfaction, feedback } = await request.json()

        // Get or create professor style
        const professorStyle = await prisma.professorStyle.upsert({
            where: { professorId: session.user.id },
            create: {
                professorId: session.user.id,
                gradingDifficulty: gradingRequest.professorStyle.gradingDifficulty || 'MEDIUM',
                feedbackDepth: gradingRequest.professorStyle.feedbackDepth || 'MODERATE',
                personality: gradingRequest.professorStyle.personality || 'SUPPORTIVE',
                keyEvaluationCriteria: gradingRequest.professorStyle.keyEvaluationCriteria || [],
                customPromptTemplate: gradingRequest.professorStyle.customPromptTemplate,
                learningPreferences: {
                    createdAt: new Date().toISOString(),
                    totalGradings: 1,
                    satisfactionScores: [satisfaction],
                    assessmentTypePreferences: {
                        [gradingRequest.assessmentType]: 1
                    },
                    criteriaEffectiveness: gradingRequest.professorStyle.keyEvaluationCriteria.reduce((acc: any, criteria: string) => {
                        acc[criteria] = { usage: 1, satisfaction: [satisfaction] }
                        return acc
                    }, {})
                }
            },
            update: {
                learningPreferences: {
                    ...((await prisma.professorStyle.findUnique({ where: { professorId: session.user.id } }))?.learningPreferences as any),
                    lastUpdated: new Date().toISOString(),
                    totalGradings: { increment: 1 },
                    satisfactionScores: { push: satisfaction },
                    assessmentTypePreferences: {
                        ...((await prisma.professorStyle.findUnique({ where: { professorId: session.user.id } }))?.learningPreferences as any)?.assessmentTypePreferences,
                        [gradingRequest.assessmentType]: ((await prisma.professorStyle.findUnique({ where: { professorId: session.user.id } }))?.learningPreferences as any)?.assessmentTypePreferences?.[gradingRequest.assessmentType] + 1 || 1
                    }
                }
            }
        })

        return NextResponse.json({
            message: 'Learning preferences updated successfully',
            professorStyleId: professorStyle.id
        })

    } catch (error) {
        console.error('Professor style learning error:', error)
        return NextResponse.json({
            error: 'Failed to update learning preferences'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const professorStyle = await prisma.professorStyle.findUnique({
            where: { professorId: session.user.id }
        })

        if (!professorStyle) {
            return NextResponse.json({
                message: 'No style preferences found',
                suggestions: {
                    recommendedDifficulty: 'MEDIUM',
                    recommendedDepth: 'MODERATE',
                    recommendedPersonality: 'SUPPORTIVE',
                    recommendedCriteria: ['Understanding', 'Analysis', 'Organization', 'Writing Quality']
                }
            })
        }

        const learningData = professorStyle.learningPreferences as any

        // Generate personalized recommendations based on learning
        const recommendations = generateRecommendations(learningData)

        return NextResponse.json({
            currentStyle: {
                gradingDifficulty: professorStyle.gradingDifficulty,
                feedbackDepth: professorStyle.feedbackDepth,
                personality: professorStyle.personality,
                keyEvaluationCriteria: professorStyle.keyEvaluationCriteria,
                customPromptTemplate: professorStyle.customPromptTemplate
            },
            learningData,
            recommendations
        })

    } catch (error) {
        console.error('Get professor style error:', error)
        return NextResponse.json({
            error: 'Failed to retrieve style preferences'
        }, { status: 500 })
    }
}

function generateRecommendations(learningData: any) {
    const recommendations = {
        adjustments: [] as string[],
        newCriteria: [] as string[],
        promptImprovements: [] as string[]
    }

    if (learningData?.totalGradings > 10) {
        const avgSatisfaction = learningData.satisfactionScores.reduce((a: number, b: number) => a + b, 0) / learningData.satisfactionScores.length

        if (avgSatisfaction < 3) {
            recommendations.adjustments.push("Consider adjusting grading difficulty or feedback depth based on recent usage patterns")
        }

        // Most used assessment types
        const mostUsedType = Object.entries(learningData.assessmentTypePreferences || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]

        if (mostUsedType) {
            recommendations.adjustments.push(`Optimize prompts for ${mostUsedType.toLowerCase()} grading based on your frequent usage`)
        }

        // Suggest new criteria based on effectiveness
        const effectiveCriteria = Object.entries(learningData.criteriaEffectiveness || {})
            .filter(([, data]: [string, any]) => data.satisfaction.reduce((a: number, b: number) => a + b, 0) / data.satisfaction.length > 3.5)
            .map(([criteria]) => criteria)

        if (effectiveCriteria.length > 0) {
            recommendations.newCriteria = ['Originality', 'Evidence Quality', 'Methodology'].filter(
                criteria => !effectiveCriteria.includes(criteria)
            ).slice(0, 2)
        }
    }

    return recommendations
}