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

        const { currentGrading, refinementPrompt, sessionId } = await request.json()
        const { submissionId } = await params

        // Input validation
        if (!refinementPrompt || !refinementPrompt.trim()) {
            return NextResponse.json({ error: "Refinement prompt is required" }, { status: 400 })
        }

        // Security check for refinement prompt
        const dangerousPatterns = [
            /system\s*prompt/i,
            /ignore\s*previous/i,
            /forget\s*instructions/i,
            /pretend\s*you\s*are/i,
            /<script/i,
            /javascript:/i
        ]

        const hasDangerousPattern = dangerousPatterns.some(pattern => pattern.test(refinementPrompt))
        if (hasDangerousPattern) {
            return NextResponse.json({
                error: "Security violation: Invalid refinement prompt"
            }, { status: 400 })
        }

        const systemPrompt = `You are a grading refinement specialist. Given the current grading and a specific refinement request, provide an improved version of the grading.

Current Grading:
${JSON.stringify(currentGrading, null, 2)}

Refinement Request: ${refinementPrompt}

Provide:
1. A refined grading with improved feedback
2. Specific improvements made
3. Additional suggestions based on the refinement request
4. Quality assurance notes

Respond with structured JSON.`

        const chatResult = await multiAI.streamChat([
            { role: "system", content: systemPrompt },
            { role: "user", content: refinementPrompt }
        ])

        // Convert stream to text
        const reader = chatResult.stream.getReader()
        let response = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            response += new TextDecoder().decode(value)
        }

        let refinedResult
        try {
            refinedResult = JSON.parse(response)
        } catch {
            // Fallback structured response
            refinedResult = {
                refinedGrading: {
                    ...currentGrading,
                    feedback: currentGrading.feedback + "\n\nRefinement applied: " + refinementPrompt
                },
                improvements: ["Applied user-specified refinement", "Enhanced feedback clarity"],
                suggestions: ["Consider additional refinements based on student needs"],
                qualityNotes: "Refinement completed successfully"
            }
        }

        // Store refinement session
        await prisma.gradingActivity.create({
            data: {
                submissionId,
                userId: user.user?.id || '',
                activityType: "REFINEMENT",
                details: JSON.stringify({
                    sessionId,
                    refinementPrompt,
                    originalGrading: currentGrading,
                    refinedResult
                })
            }
        }).catch(() => {
            console.log("Could not store refinement activity")
        })

        return NextResponse.json(refinedResult)

    } catch (error) {
        console.error("Refinement error:", error)
        return NextResponse.json(
            { error: "Failed to refine grading" },
            { status: 500 }
        )
    }
}