import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await requireSession()

        // Only allow ADMIN role
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { userId } = await params

        // Prevent admin from deleting themselves
        if (userId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            )
        }

        // Delete user (cascade will handle related records)
        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({
            success: true,
            message: "User deleted successfully"
        })
    } catch (error) {
        console.error("User deletion error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
