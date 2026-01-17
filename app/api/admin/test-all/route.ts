import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"

const SERVICES_TO_TEST = [
    "openai",
    "anthropic",
    "gemini",
    "groq",
    "stripe",
    "google"
]

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        let passed = 0
        let failed = 0
        const results: any[] = []

        for (const service of SERVICES_TO_TEST) {
            try {
                const testResponse = await fetch(`${request.nextUrl.origin}/api/admin/test/${service}`, {
                    method: "POST",
                    headers: {
                        "Cookie": request.headers.get("Cookie") || ""
                    }
                })

                const testResult = await testResponse.json()

                if (testResult.success) {
                    passed++
                } else {
                    failed++
                }

                results.push({
                    service,
                    ...testResult
                })
            } catch (error) {
                failed++
                results.push({
                    service,
                    success: false,
                    message: `Failed to test ${service}`,
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            }
        }

        return NextResponse.json({
            tested: SERVICES_TO_TEST.length,
            passed,
            failed,
            results
        })

    } catch (error) {
        console.error('Test all services error:', error)
        return NextResponse.json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}