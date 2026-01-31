import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
    try {
        const session = await requireSession()

        // Only allow ADMIN role
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { userId, role } = await req.json()

        if (!userId || !role) {
            return NextResponse.json(
                { error: "Missing userId or role" },
                { status: 400 }
            )
        }

        // Validate role
        if (!["ADMIN", "PROFESSOR", "STUDENT"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            )
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role }
        })

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                role: updatedUser.role
            }
        })
    } catch (error) {
        console.error("Role update error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
