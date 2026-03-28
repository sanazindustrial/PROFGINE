import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LectureNotesService } from "@/lib/services/lecture-notes.service"

export const maxDuration = 120

export async function POST(req: NextRequest) {
    try {
        let session
        try {
            session = await requireSession()
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { presentationId, title, description, sources, settings } = body

        // Mode 1: Generate from existing presentation
        if (presentationId) {
            const presentation = await prisma.presentation.findFirst({
                where: {
                    id: presentationId,
                    userId: session.user.id,
                },
                include: {
                    slides: {
                        orderBy: { slideNumber: "asc" },
                    },
                },
            })

            if (!presentation) {
                return NextResponse.json({ error: "Presentation not found" }, { status: 404 })
            }

            const lectureNotesService = new LectureNotesService()
            const result = await lectureNotesService.generateFromPresentation(presentation)

            // Store lecture notes URL in presentation metadata
            const existingMetadata = presentation.metadata ? JSON.parse(presentation.metadata) : {}
            existingMetadata.lectureNotesUrl = result.url
            existingMetadata.lectureNotesGoogleDocsUrl = result.googleDocsUrl

            await prisma.presentation.update({
                where: { id: presentationId },
                data: { metadata: JSON.stringify(existingMetadata) },
            })

            return NextResponse.json({
                success: true,
                url: result.url,
                googleDocsUrl: result.googleDocsUrl,
                fileName: result.fileName,
            })
        }

        // Mode 2: Generate standalone lecture notes
        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        const lectureNotesService = new LectureNotesService()
        const result = await lectureNotesService.generateStandalone({
            title: title.trim(),
            description: description || "",
            sources: sources || [],
            settings: settings || {},
        })

        return NextResponse.json({
            success: true,
            url: result.url,
            googleDocsUrl: result.googleDocsUrl,
            fileName: result.fileName,
        })
    } catch (error) {
        console.error("Lecture notes generation error:", error instanceof Error ? error.stack : error)
        return NextResponse.json(
            { error: "Failed to generate lecture notes" },
            { status: 500 }
        )
    }
}
