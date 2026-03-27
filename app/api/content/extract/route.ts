/**
 * Content Extract API
 * POST /api/content/extract - Upload a file and extract its content
 * Returns structured text, sections, and metadata for AI processing or DB storage
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { fileExtractionService } from "@/lib/services/file-extraction.service"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
    ".txt", ".md", ".markdown",
    ".csv", ".tsv",
    ".doc", ".docx",
    ".xls", ".xlsx",
    ".ppt", ".pptx",
    ".html", ".htm",
    ".json",
    ".pdf",
])

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export async function POST(req: NextRequest) {
    try {
        const session = await requireSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
                { status: 400 }
            )
        }

        // Validate file extension
        const ext = path.extname(file.name).toLowerCase()
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return NextResponse.json(
                {
                    error: `Unsupported file type: ${ext}. Supported: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
                },
                { status: 400 }
            )
        }

        // Save to temp location for extraction
        const tempDir = path.join(process.cwd(), "public", "uploads", "temp")
        await fs.mkdir(tempDir, { recursive: true })

        const tempFilename = `extract-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const tempPath = path.join(tempDir, tempFilename)

        const bytes = await file.arrayBuffer()
        await fs.writeFile(tempPath, new Uint8Array(bytes))

        try {
            // Extract content using file extraction service
            const extracted = await fileExtractionService.extractFromFile(tempPath, file.name)

            // Optional: also save to uploads directory if requested
            const storeFile = formData.get("store") === "true"
            let fileUrl: string | null = null

            if (storeFile) {
                const uploadsDir = path.join(process.cwd(), "public", "uploads")
                await fs.mkdir(uploadsDir, { recursive: true })
                const storedFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
                const storedPath = path.join(uploadsDir, storedFilename)
                await fs.copyFile(tempPath, storedPath)
                fileUrl = `/uploads/${storedFilename}`
            }

            return NextResponse.json({
                success: true,
                data: {
                    ...extracted,
                    fileUrl,
                    originalName: file.name,
                    originalSize: file.size,
                    mimeType: file.type,
                },
            })
        } finally {
            // Clean up temp file
            try {
                await fs.unlink(tempPath)
            } catch {
                /* ignore cleanup errors */
            }
        }
    } catch (error: unknown) {
        const err = error as { message?: string }
        if (err?.message === "Not authenticated") {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }
        console.error("[POST /api/content/extract]", error)
        return NextResponse.json(
            { error: "Failed to extract content from file" },
            { status: 500 }
        )
    }
}
