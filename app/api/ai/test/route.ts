import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { prisma } from "@/prisma/client"

export async function POST(request: NextRequest) {
    try {
        // Check if user is admin
        const session = await getServerSession()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        })

        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { provider } = await request.json()

        // Test the specific provider
        const providers = multiAI['providers']
        const testProvider = providers.get(provider)

        if (!testProvider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 })
        }

        if (!testProvider.isAvailable()) {
            return NextResponse.json({ error: "Provider not configured" }, { status: 400 })
        }

        // Test with a simple message
        const testMessages = [
            { role: "user" as const, content: "Hello! Please respond with 'Test successful'" }
        ]

        try {
            const stream = await testProvider.streamChat(testMessages)

            // Read a small portion to verify it works
            const reader = stream.getReader()
            const { value, done } = await reader.read()
            reader.releaseLock()

            if (done || !value) {
                return NextResponse.json({ error: "No response from provider" }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                message: "Provider test successful",
                provider: testProvider.name,
                cost: testProvider.getCost()
            })

        } catch (error) {
            console.error(`Provider ${provider} test failed:`, error)
            return NextResponse.json({
                error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }, { status: 500 })
        }

    } catch (error) {
        console.error("Error testing AI provider:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}