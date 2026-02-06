import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ presentationId: string }> }
) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { presentationId } = await params

        // Verify user owns this presentation
        const presentation = await prisma.presentation.findFirst({
            where: {
                id: presentationId,
                userId: session.user.id
            }
        })

        if (!presentation) {
            return NextResponse.json(
                { error: "Presentation not found or access denied" },
                { status: 404 }
            )
        }

        // Delete associated files first
        await prisma.presentationSourceFile.deleteMany({
            where: { presentationId }
        })

        // Delete slides if any
        await prisma.presentationSlide.deleteMany({
            where: { presentationId }
        })

        // Delete the presentation
        await prisma.presentation.delete({
            where: { id: presentationId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete presentation error:", error)
        return NextResponse.json(
            { error: "Failed to delete presentation" },
            { status: 500 }
        )
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ presentationId: string }> }
) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { presentationId } = await params

        const presentation = await prisma.presentation.findFirst({
            where: session.user.role === "ADMIN"
                ? { id: presentationId }
                : {
                    id: presentationId,
                    OR: [
                        { userId: session.user.id },
                        { course: { instructorId: session.user.id } }
                    ]
                },
            include: {
                course: true,
                slides: {
                    select: {
                        id: true,
                        slideNumber: true,
                        title: true,
                        notes: true
                    },
                    orderBy: { slideNumber: "asc" }
                }
            }
        })

        if (!presentation) {
            return NextResponse.json(
                { error: "Presentation not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(presentation)
    } catch (error) {
        console.error("Get presentation error:", error)
        return NextResponse.json(
            { error: "Failed to fetch presentation" },
            { status: 500 }
        )
    }
}
