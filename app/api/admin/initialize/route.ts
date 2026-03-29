import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { initializeAdminSystem } from "@/lib/admin-config"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
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