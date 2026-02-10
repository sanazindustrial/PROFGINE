import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { UserRole, SubscriptionType, FeatureType } from "@prisma/client"
import bcrypt from "bcryptjs"
import { isAllowedUniversityEmail } from "@/lib/user-management"

const professorSignupSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    institution: z.string().min(1),
    department: z.string().min(1),
    subscriptionPlan: z.enum(["BASIC", "PREMIUM"]),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, password, institution, department, subscriptionPlan } = professorSignupSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            )
        }

        if (!isAllowedUniversityEmail(email)) {
            return NextResponse.json(
                { error: "Only university email addresses are allowed" },
                { status: 403 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        // Create professor with subscription
        const professor = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: UserRole.PROFESSOR,
                subscriptionType: subscriptionPlan as SubscriptionType,
                trialStartedAt: new Date(),
                trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
                subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day subscription
            }
        })

        // Create professor profile with additional details
        const professorProfile = await prisma.professorProfile.create({
            data: {
                userId: professor.id,
                institution,
                department,
            }
        })

        // Initialize subscription features based on plan
        const features = getSubscriptionFeatures(subscriptionPlan)

        for (const feature of features) {
            await prisma.subscriptionFeature.create({
                data: {
                    userId: professor.id,
                    featureType: feature.type,
                    limit: feature.limit,
                    isEnabled: true,
                }
            })
        }

        return NextResponse.json({
            message: "Professor account created successfully",
            userId: professor.id,
            profileId: professorProfile.id,
            trialExpiresAt: professor.trialExpiresAt,
            subscriptionExpiresAt: professor.subscriptionExpiresAt
        })

    } catch (error) {
        console.error("Professor signup error:", error)
        return NextResponse.json(
            { error: "Failed to create professor account" },
            { status: 500 }
        )
    }
}

function getSubscriptionFeatures(plan: string): Array<{ type: FeatureType; limit: number }> {
    const baseFeatures: Array<{ type: FeatureType; limit: number }> = [
        { type: FeatureType.COURSE_CREATION, limit: plan === "BASIC" ? 3 : plan === "PREMIUM" ? 10 : -1 },
        { type: FeatureType.ASSIGNMENT_CREATION, limit: plan === "BASIC" ? 20 : plan === "PREMIUM" ? 100 : -1 },
        { type: FeatureType.DISCUSSION_CREATION, limit: plan === "BASIC" ? 10 : plan === "PREMIUM" ? 50 : -1 },
    ]

    if (plan === "PREMIUM") {
        baseFeatures.push(
            { type: FeatureType.CUSTOM_RUBRICS, limit: -1 },
            { type: FeatureType.AI_GRADING, limit: 500 },
            { type: FeatureType.ADVANCED_ANALYTICS, limit: -1 },
            { type: FeatureType.PLAGIARISM_DETECTION, limit: 100 }
        )
    }

    return baseFeatures
}