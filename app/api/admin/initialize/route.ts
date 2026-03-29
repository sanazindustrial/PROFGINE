import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { initializeAdminSystem } from "@/lib/admin-config"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Verify the user is actually an admin in the database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        })

        if (user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        await initializeAdminSystem()
        return NextResponse.json({
            success: true,
            message: "Admin system initialized successfully"
        })
    } catch (error) {
        console.error('Failed to initialize admin system:', error)
        return NextResponse.json({
            success: false,
            error: "Failed to initialize admin system",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}