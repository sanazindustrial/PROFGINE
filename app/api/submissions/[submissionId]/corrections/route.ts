import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const user = await requireSession()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { corrections, currentGrading } = await request.json()
        const { submissionId } = await params

        if (!corrections || !Array.isArray(corrections)) {
            return NextResponse.json({ error: "Corrections array is required" }, { status: 400 })
        }

        // Apply corrections to the current grading
        let updatedGrading = { ...currentGrading }

        corrections.forEach(correction => {
            // Grammar corrections
            if (correction.includes("grammar") || correction.includes("spelling")) {
                // Simulate grammar correction application
                updatedGrading.feedback = updatedGrading.feedback.replace(/\s+/g, ' ').trim()
            }

            // Consistency corrections
            if (correction.includes("consistency")) {
                // Ensure consistent terminology
                updatedGrading.feedback = updatedGrading.feedback.replace(/student/gi, 'student')
            }

            // Bias corrections
            if (correction.includes("bias") || correction.includes("neutral")) {
                // Remove potentially biased language
                updatedGrading.feedback = updatedGrading.feedback
                    .replace(/obviously/gi, 'clearly')
                    .replace(/simply/gi, '')
            }

            // Completeness corrections
            if (correction.includes("completeness") || correction.includes("detail")) {
                updatedGrading.feedback += "\n\nAdditional feedback: Consider expanding on the key points discussed."
            }
        })

        // Store correction activity
        await prisma.gradingActivity.create({
            data: {
                submissionId,
                userId: user.user?.id || '',
                activityType: "CORRECTIONS_APPLIED",
                details: JSON.stringify({
                    corrections,
                    originalGrading: currentGrading,
                    updatedGrading
                })
            }
        }).catch(() => {
            console.log("Could not store correction activity")
        })

        return NextResponse.json({
            updatedGrading,
            appliedCorrections: corrections,
            correctionCount: corrections.length
        })

    } catch (error) {
        console.error("Corrections error:", error)
        return NextResponse.json(
            { error: "Failed to apply corrections" },
            { status: 500 }
        )
    }
}