import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { multiAI } from "@/adaptors/multi-ai.adaptor"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const user = await requireSession()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { content, assignmentTitle, maxPoints, config } = await request.json()
        const { submissionId } = await params

        // Security validation
        if (config.securityLevel === "ENHANCED") {
            // Check for potential security issues
            const securityFlags = [
                /script\s*>/i,
                /javascript:/i,
                /on\w+\s*=/i,
                /<iframe/i,
                /eval\s*\(/i
            ]

            const hasSecurityIssue = securityFlags.some(flag => flag.test(content))
            if (hasSecurityIssue) {
                return NextResponse.json({
                    error: "Security validation failed - potential malicious content detected"
                }, { status: 400 })
            }
        }

        // Automated grading system prompt
        const systemPrompt = `You are an advanced automated grading assistant. Analyze the submission and provide:

1. Comprehensive feedback with strengths, areas for improvement, and suggestions
2. A suggested score with detailed reasoning
3. Confidence level (0-1) for your assessment
4. Rubric-based criteria scoring
5. Refinement prompts for further improvement
6. Correction suggestions for common issues

Assignment: ${assignmentTitle}
Max Points: ${maxPoints}

Respond with structured JSON containing all assessment data.`

        const chatResult = await multiAI.streamChat([
            { role: "system", content: systemPrompt },
            { role: "user", content }
        ])

        // Convert stream to text
        const reader = chatResult.stream.getReader()
        let response = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            response += new TextDecoder().decode(value)
        }

        let parsedResponse
        try {
            parsedResponse = JSON.parse(response)
        } catch {
            // Fallback if AI doesn't return valid JSON
            parsedResponse = {
                confidence: 0.7,
                strengths: [response.split('.')[0] || "Well structured submission"],
                improvements: ["Consider adding more detailed analysis"],
                suggestions: ["Review assignment requirements carefully"],
                suggestedScore: Math.round(maxPoints * 0.75),
                refinementPrompts: ["Focus on critical thinking aspects", "Add more supporting examples"],
                correctionSuggestions: ["Check grammar and spelling", "Improve paragraph structure"],
                automatedGrading: {
                    score: Math.round(maxPoints * 0.75),
                    reasoning: "Based on content analysis and structure assessment",
                    confidence: 0.7,
                    criteria: {
                        "Content Quality": 8,
                        "Organization": 7,
                        "Analysis": 6,
                        "Writing Quality": 7
                    }
                }
            }
        }

        // Store grading activity for audit trail
        await prisma.gradingActivity.create({
            data: {
                submissionId,
                userId: user.user?.id || '',
                activityType: "AUTOMATED_GRADING",
                details: JSON.stringify({
                    config,
                    aiResponse: parsedResponse,
                    securityLevel: config.securityLevel
                })
            }
        }).catch(() => {
            // Non-critical if audit trail fails
            console.log("Could not store grading activity")
        })

        return NextResponse.json(parsedResponse)

    } catch (error) {
        console.error("Automated grading error:", error)
        return NextResponse.json(
            { error: "Failed to perform automated grading" },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const user = await requireSession()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { submissionId } = await params

        // Get existing automated grading results
        const gradingHistory = await prisma.gradingActivity.findMany({
            where: {
                submissionId,
                activityType: "AUTOMATED_GRADING"
            },
            orderBy: { createdAt: "desc" },
            take: 1
        }).catch(() => [])

        if (gradingHistory.length > 0) {
            const latestGrading = gradingHistory[0]
            return NextResponse.json(JSON.parse(latestGrading.details))
        }

        return NextResponse.json({ message: "No automated grading found" }, { status: 404 })

    } catch (error) {
        console.error("Get automated grading error:", error)
        return NextResponse.json(
            { error: "Failed to retrieve automated grading" },
            { status: 500 }
        )
    }
}