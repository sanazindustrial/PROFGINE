import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Convert a /uploads/ path to an API-backed /api/files/ URL for reliable serving.
 * Files in public/uploads/ may not be served by Next.js after build.
 */
function toApiFileUrl(uploadsUrl: string): string {
    if (!uploadsUrl) return ""
    // /uploads/presentations/file.pptx → /api/files/presentations/file.pptx
    return uploadsUrl.replace(/^\/uploads\//, "/api/files/")
}

export async function POST(req: NextRequest) {
    try {
        let session
        try {
            session = await requireSession()
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { presentationId, format } = await req.json()

        if (!presentationId || !format) {
            return NextResponse.json(
                { error: "Missing presentationId or format" },
                { status: 400 }
            )
        }

        // Validate format
        const validFormats = ["pptx", "pdf", "google-slides", "keynote", "docx", "google-docs"]
        if (!validFormats.includes(format)) {
            return NextResponse.json(
                { error: "Invalid format" },
                { status: 400 }
            )
        }

        // Get presentation and verify access
        const presentation = await prisma.presentation.findFirst({
            where: {
                id: presentationId,
                userId: session.user.id
            },
            include: {
                course: true
            }
        })

        if (!presentation) {
            return NextResponse.json(
                { error: "Presentation not found or access denied" },
                { status: 404 }
            )
        }

        const metadata = presentation.metadata ? JSON.parse(presentation.metadata) : {}

        // Generate download URL based on format
        let downloadUrl = ""
        let fileName = `${presentation.title.replace(/[^a-z0-9]/gi, '_')}`

        switch (format) {
            case "pptx":
                downloadUrl = toApiFileUrl(presentation.fileUrl || "")
                fileName += ".pptx"
                break
            case "pdf":
                downloadUrl = toApiFileUrl(presentation.pdfUrl || "")
                fileName += ".pdf"
                break
            case "google-slides":
                downloadUrl = toApiFileUrl(presentation.fileUrl || "")
                fileName += "_google_slides.pptx"
                break
            case "keynote":
                downloadUrl = toApiFileUrl(presentation.fileUrl || "")
                fileName += ".key"
                break
            case "docx":
            case "google-docs":
                downloadUrl = toApiFileUrl(metadata.lectureNotesUrl || "")
                fileName += format === "google-docs" ? "_google_docs.docx" : ".docx"
                break
        }

        if (!downloadUrl) {
            return NextResponse.json(
                { error: `${format} format not available for this presentation` },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            downloadUrl,
            fileName,
            format
        })
    } catch (error) {
        console.error("Download generation error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
