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

        const body = await request.json()
        const { action, provider, enabled, preferredOrder } = body

        if (action === 'toggle') {
            // Toggle provider enabled/disabled
            const currentConfig = multiAI['config']
            if (enabled) {
                if (!currentConfig.enabledProviders.includes(provider)) {
                    currentConfig.enabledProviders.push(provider)
                }
            } else {
                currentConfig.enabledProviders = currentConfig.enabledProviders.filter(p => p !== provider)
            }

            multiAI.configure({ enabledProviders: currentConfig.enabledProviders })

            return NextResponse.json({ success: true })
        }

        if (action === 'reorder') {
            // Update provider order
            multiAI.configure({ preferredProviders: preferredOrder })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error) {
        console.error("Error configuring AI providers:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}