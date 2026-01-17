import { NextRequest, NextResponse } from "next/server"
import { initializeAdminSystem } from "@/lib/admin-config"

export async function POST(request: NextRequest) {
    try {
        // This endpoint should be protected or called internally
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