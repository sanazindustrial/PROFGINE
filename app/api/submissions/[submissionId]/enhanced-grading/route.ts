import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole } from "@prisma/client"

const enhancedGradingSchema = z.object({
    submissionId: z.string(),
    score: z.number().min(0),
    feedback: z.string().min(1),
    rubricScores: z.array(z.object({
        criterionId: z.string(),
        score: z.number(),
        comments: z.string().optional(),
    })).optional(),
    aiAssistedFeedback: z.boolean().default(false),
    detailedComments: z.array(z.object({
        lineNumber: z.number().optional(),
        text: z.string(),
        type: z.enum(["STRENGTH", "IMPROVEMENT", "QUESTION", "GENERAL"]),
        category: z.string().optional(),
    })).optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.PROFESSOR) {
            return NextResponse.json(
                { error: "Only professors can grade submissions" },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { submissionId, score, feedback, rubricScores, aiAssistedFeedback, detailedComments } = enhancedGradingSchema.parse(body)

        // Verify professor has access to this submission
        const submission = await prisma.submission.findFirst({
            where: {
                id: submissionId,
                assignment: {
                    course: {
                        instructorId: session.user.id
                    }
                }
            },
            include: {
                assignment: {
                    include: {
                        course: true,
                        rubric: {
                            include: {
                                criteria: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!submission) {
            return NextResponse.json(
                { error: "Submission not found or access denied" },
                { status: 404 }
            )
        }

        // Create or update grade
        const grade = await prisma.grade.upsert({
            where: { submissionId },
            create: {
                submissionId,
                score,
                feedback,
                graderId: session.user.id,
            },
            update: {
                score,
                feedback,
                graderId: session.user.id,
            }
        })

        // Handle rubric scoring if provided
        if (rubricScores && rubricScores.length > 0) {
            for (const rubricScore of rubricScores) {
                await prisma.$executeRaw`
          INSERT INTO "RubricScore" (
            "gradeId",
            "criterionId", 
            "score",
            "comments",
            "createdAt",
            "updatedAt"
          ) VALUES (
            ${grade.id},
            ${rubricScore.criterionId},
            ${rubricScore.score},
            ${rubricScore.comments || null},
            NOW(),
            NOW()
          )
          ON CONFLICT ("gradeId", "criterionId")
          DO UPDATE SET
            "score" = ${rubricScore.score},
            "comments" = ${rubricScore.comments || null},
            "updatedAt" = NOW()
        `
            }
        }

        // Handle detailed feedback comments
        if (detailedComments && detailedComments.length > 0) {
            for (const comment of detailedComments) {
                await prisma.$executeRaw`
          INSERT INTO "FeedbackComment" (
            "gradeId",
            "lineNumber",
            "text",
            "type",
            "category",
            "createdAt",
            "updatedAt"
          ) VALUES (
            ${grade.id},
            ${comment.lineNumber || null},
            ${comment.text},
            ${comment.type},
            ${comment.category || null},
            NOW(),
            NOW()
          )
        `
            }
        }

        // Generate AI-assisted feedback if requested
        if (aiAssistedFeedback && submission.contentText) {
            try {
                const aiSuggestions = await generateAIFeedback(
                    submission.contentText,
                    submission.assignment.title,
                    submission.assignment.instructions || "",
                    score
                )

                // Store AI suggestions
                await prisma.$executeRaw`
          INSERT INTO "AIFeedback" (
            "gradeId",
            "suggestions",
            "strengths",
            "improvements", 
            "confidence",
            "createdAt"
          ) VALUES (
            ${grade.id},
            ${JSON.stringify(aiSuggestions.suggestions)},
            ${JSON.stringify(aiSuggestions.strengths)},
            ${JSON.stringify(aiSuggestions.improvements)},
            ${aiSuggestions.confidence},
            NOW()
          )
        `
            } catch (error) {
                console.error("AI feedback generation failed:", error)
                // Continue without AI feedback - don't fail the entire grading process
            }
        }

        // Update submission status
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: "GRADED",
                gradedAt: new Date()
            }
        })

        // Log grading activity
        await prisma.$executeRaw`
      INSERT INTO "GradingActivity" (
        "professorId",
        "submissionId",
        "action",
        "details",
        "createdAt"
      ) VALUES (
        ${session.user.id},
        ${submissionId},
        'GRADED',
        ${JSON.stringify({
            score,
            hasRubricScoring: !!rubricScores?.length,
            hasDetailedComments: !!detailedComments?.length,
            aiAssisted: aiAssistedFeedback
        })},
        NOW()
      )
    `

        return NextResponse.json({
            message: "Submission graded successfully",
            gradeId: grade.id,
            score,
            feedback,
            submissionStatus: "GRADED",
            student: submission.student
        })

    } catch (error) {
        console.error("Enhanced grading error:", error)
        return NextResponse.json(
            { error: "Failed to grade submission" },
            { status: 500 }
        )
    }
}

async function generateAIFeedback(content: string, title: string, instructions: string, score: number) {
    // This would integrate with your AI provider (OpenAI, Anthropic, etc.)
    // Placeholder implementation
    return {
        suggestions: [
            "Consider adding more detailed explanations for your reasoning",
            "The implementation shows good understanding of the core concepts",
            "Code structure could be improved with better variable naming"
        ],
        strengths: [
            "Clear problem-solving approach",
            "Good use of comments",
            "Functional solution"
        ],
        improvements: [
            "Add error handling",
            "Optimize algorithm efficiency",
            "Include more test cases"
        ],
        confidence: 0.85
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
        const submissionId = searchParams.get("submissionId")

        if (!submissionId) {
            return NextResponse.json(
                { error: "Submission ID is required" },
                { status: 400 }
            )
        }

        // Get existing grade with all related data
        const grade = await prisma.grade.findFirst({
            where: {
                submissionId,
                submission: {
                    assignment: {
                        course: {
                            instructorId: session.user.id
                        }
                    }
                }
            },
            include: {
                submission: {
                    include: {
                        assignment: {
                            include: {
                                rubric: {
                                    include: {
                                        criteria: true
                                    }
                                }
                            }
                        },
                        student: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        if (!grade) {
            return NextResponse.json(
                { error: "Grade not found or access denied" },
                { status: 404 }
            )
        }

        // Get rubric scores if they exist
        const rubricScores = await prisma.$queryRaw`
      SELECT 
        rs.*,
        rc.label as criterion_label,
        rc."maxPoints" as max_points
      FROM "RubricScore" rs
      JOIN "RubricCriterion" rc ON rs."criterionId" = rc.id
      WHERE rs."gradeId" = ${grade.id}
      ORDER BY rc."order"
    `

        // Get detailed feedback comments
        const feedbackComments = await prisma.$queryRaw`
      SELECT * FROM "FeedbackComment" 
      WHERE "gradeId" = ${grade.id}
      ORDER BY "lineNumber", "createdAt"
    `

        // Get AI feedback if available
        const aiFeedback = await prisma.$queryRaw`
      SELECT * FROM "AIFeedback"
      WHERE "gradeId" = ${grade.id}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `

        return NextResponse.json({
            grade,
            rubricScores,
            feedbackComments,
            aiFeedback: (aiFeedback as any[])[0] || null
        })

    } catch (error) {
        console.error("Get enhanced grade error:", error)
        return NextResponse.json(
            { error: "Failed to retrieve grade data" },
            { status: 500 }
        )
    }
}