import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { checkRateLimit, getClientIP, rateLimiters } from "@/lib/rate-limit";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".txt", ".md", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
]);

const ALLOWED_MIME_PREFIXES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-",
    "application/msword",
    "text/",
    "image/",
];

// POST /api/uploads
export async function POST(req: NextRequest) {
    try {
        const session = await requireSession();

        // Rate limit uploads
        const clientIP = getClientIP(req);
        const rateCheck = checkRateLimit(rateLimiters.upload, clientIP);
        if (!rateCheck.allowed) {
            return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        await fs.mkdir(uploadsDir, { recursive: true });

        // Parse the multipart form data
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
        }

        // Validate file extension
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return NextResponse.json(
                { error: `File type '${ext}' is not allowed` },
                { status: 400 }
            );
        }

        // Validate MIME type
        const mimeAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
        if (!mimeAllowed && file.type) {
            return NextResponse.json(
                { error: `MIME type '${file.type}' is not allowed` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}-${cleanName}`;
        const filepath = path.join(uploadsDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        await fs.writeFile(filepath, new Uint8Array(bytes));

        // Return file URL
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json(
            {
                message: "File uploaded successfully",
                fileUrl,
                originalName: file.name,
                size: file.size,
                type: file.type,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}