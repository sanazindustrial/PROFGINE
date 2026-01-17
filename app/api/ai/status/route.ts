import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { prisma } from "@/prisma/client"

export async function GET() {
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

        // Get AI provider status
        const providers = multiAI.getProviderStatus()
        const config = multiAI['config'] // Access private config

        return NextResponse.json({
            providers,
            preferredOrder: config.preferredProviders,
            enabledProviders: config.enabledProviders,
            fallbackToFree: config.fallbackToFree
        })

    } catch (error) {
        console.error("Error fetching AI status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}