import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";

// POST /api/uploads
export async function POST(req: NextRequest) {
    const session = await requireSession();

    try {
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