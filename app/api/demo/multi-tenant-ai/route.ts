import { NextResponse } from "next/server";
import { requireModule } from "@/lib/access/requireModule";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // This will check if the user can access AI grading features
        const ctx = await requireModule("AI_GRADING_ENGINE");

        // Get usage summary for the current billing context
        const usage = ctx.usage ? {
            students: ('studentsCount' in ctx.usage) ? ctx.usage.studentsCount || 0 : 0,
            courses: ctx.usage.coursesCount,
            assignments: ctx.usage.assignmentsCount,
            aiGrades: ctx.usage.aiGradesCount,
            plagiarismScans: ctx.usage.plagiarismScansCount,
        } : undefined;

        return NextResponse.json({
            success: true,
            billingContext: {
                ownerType: ctx.ownerType,
                ownerId: ctx.ownerId,
                tier: ctx.tier,
                status: ctx.status,
                user: ctx.user,
            },
            usage,
            message: "Access granted to AI grading features"
        });
    } catch (error: any) {
        console.error("Multi-tenant access check failed:", error);

        if (error.code === "UPGRADE_REQUIRED") {
            return NextResponse.json({
                success: false,
                error: "UPGRADE_REQUIRED",
                details: error.details,
                message: "Please upgrade your subscription to access AI grading features"
            }, { status: 403 });
        }

        if (error.code === "BILLING_INACTIVE") {
            return NextResponse.json({
                success: false,
                error: "BILLING_INACTIVE",
                details: error.details,
                message: "Your subscription is not active. Please update payment or contact support."
            }, { status: 403 });
        }

        return NextResponse.json({
            success: false,
            error: "ACCESS_DENIED",
            message: "Access denied to AI grading features"
        }, { status: 403 });
    }
}

export async function POST(req: Request) {
    try {
        // Check access with usage increment (simulating AI grading request)
        const ctx = await requireModule("AI_GRADING_ENGINE", {
            usage: [{ key: "creditsPerMonth", inc: 1 }]
        });

        const { submissionText, prompt } = await req.json();

        // Increment AI grading usage counter
        if (ctx.ownerType === "ORG") {
            await prisma.orgUsageCounter.update({
                where: { orgId: ctx.ownerId },
                data: { aiGradesCount: { increment: 1 } }
            });
        } else {
            await prisma.userUsageCounter.update({
                where: { userId: ctx.ownerId },
                data: { aiGradesCount: { increment: 1 } }
            });
        }

        // Simulate AI grading response (in real app, call your AI provider)
        const mockAIResponse = {
            grade: Math.floor(Math.random() * 30) + 70, // 70-100
            feedback: "This is a simulated AI feedback response. The submission shows good understanding of the key concepts.",
            strengths: ["Clear writing", "Good structure", "Relevant examples"],
            improvements: ["Could expand on analysis", "More citations needed"],
            confidence: 0.85
        };

        return NextResponse.json({
            success: true,
            result: mockAIResponse,
            billingContext: {
                ownerType: ctx.ownerType,
                tier: ctx.tier,
            },
            message: "AI grading completed successfully"
        });
    } catch (error: any) {
        console.error("AI grading failed:", error);

        if (error.code === "USAGE_LIMIT_EXCEEDED") {
            return NextResponse.json({
                success: false,
                error: "USAGE_LIMIT_EXCEEDED",
                details: error.details,
                message: `AI grading limit exceeded. ${error.details.message}`
            }, { status: 429 });
        }

        return NextResponse.json({
            success: false,
            error: "AI_GRADING_FAILED",
            message: error.message || "AI grading request failed"
        }, { status: 500 });
    }
}