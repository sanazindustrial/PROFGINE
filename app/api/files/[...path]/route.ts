
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { promises as fs } from "fs"
import path from "path"

const MIME_TYPES: Record<string, string> = {
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".html": "text/html",
}

/**
 * Serve uploaded files from disk.
 * Handles files in public/uploads/ that Next.js may not serve after build.
 * URL pattern: /api/files/presentations/file.pptx → public/uploads/presentations/file.pptx
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        // Require authentication to access uploaded files
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const { path: pathSegments } = await params
        const filePath = pathSegments.join("/")

        // Security: prevent directory traversal
        if (filePath.includes("..") || filePath.includes("~") || filePath.includes("\0")) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 })
        }

        // Build the full path within uploads directory
        const uploadsDir = path.resolve(path.join(process.cwd(), "public", "uploads"))
        const fullPath = path.resolve(path.join(uploadsDir, filePath))

        // Ensure the resolved path is within uploads directory (prevent traversal)
        if (!fullPath.startsWith(uploadsDir)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        // Check file exists
        try {
            await fs.access(fullPath)
        } catch {
            return NextResponse.json({ error: "File not found" }, { status: 404 })
        }

        const fileBuffer = await fs.readFile(fullPath)
        const ext = path.extname(filePath).toLowerCase()
        const contentType = MIME_TYPES[ext] || "application/octet-stream"
        const fileName = path.basename(filePath)

        return new Response(fileBuffer as unknown as BodyInit, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": fileBuffer.length.toString(),
                "Cache-Control": "public, max-age=3600",
            },
        })
    } catch (error) {
        console.error("File serve error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
