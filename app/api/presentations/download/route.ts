import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const session = await requireSession()

        const { presentationId, format } = await req.json()

        if (!presentationId || !format) {
            return NextResponse.json(
                { error: "Missing presentationId or format" },
                { status: 400 }
            )
        }

        // Validate format
        const validFormats = ["pptx", "pdf", "google-slides", "keynote"]
        if (!validFormats.includes(format)) {
            return NextResponse.json(
                { error: "Invalid format. Must be one of: pptx, pdf, google-slides, keynote" },
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

        // Generate download URL based on format
        let downloadUrl = ""
        let fileName = `${presentation.title.replace(/[^a-z0-9]/gi, '_')}`

        switch (format) {
            case "pptx":
                downloadUrl = presentation.fileUrl || ""
                fileName += ".pptx"
                break
            case "pdf":
                downloadUrl = presentation.pdfUrl || ""
                fileName += ".pdf"
                break
            case "google-slides":
                // For Google Slides, provide instructions or conversion URL
                downloadUrl = presentation.fileUrl || ""
                fileName += "_google_slides.pptx"
                break
            case "keynote":
                // For Keynote (Mac), use the same PPTX file
                downloadUrl = presentation.fileUrl || ""
                fileName += ".key"
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
