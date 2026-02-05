import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CourseStudioService } from "@/lib/services/course-studio"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      courseId,
      title,
      sources,
      settings,
    } = body

    // Validate required fields
    if (!courseId || !title) {
      return NextResponse.json(
        { error: "Course ID and title are required" },
        { status: 400 }
      )
    }

    // Check if user has access to course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: session.user.id,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 403 }
      )
    }

    // Create presentation record
    const presentation = await prisma.presentation.create({
      data: {
        courseId,
        userId: session.user.id,
        title,
        description: settings?.description,
        sourceType: settings?.sourceType || "MIXED",
        templateStyle: settings?.templateStyle || "modern-minimalist",
        targetDuration: settings?.targetDuration || 50,
        status: "PROCESSING",
        metadata: JSON.stringify({
          includeQuizzes: settings?.includeQuizzes || false,
          includeDiscussions: settings?.includeDiscussions || false,
          difficultyLevel: settings?.difficultyLevel || "intermediate",
          targetSlides: settings?.targetSlides || 25,
        }),
      },
    })

    // Store source files if provided
    if (sources && Array.isArray(sources)) {
      for (const source of sources) {
        await prisma.presentationSourceFile.create({
          data: {
            presentationId: presentation.id,
            fileName: source.fileName,
            fileType: source.fileType,
            fileUrl: source.fileUrl,
            fileSize: source.fileSize,
            pages: source.pages,
          },
        })
      }
    }

    // Initialize Course Studio Service
    const studioService = new CourseStudioService()

    // Generate presentation asynchronously
    // In production, this should be a background job
    try {
      const result = await studioService.generatePresentation({
        presentationId: presentation.id,
        sources: sources || [],
        settings: {
          ...settings,
          title,
          templateStyle: settings?.templateStyle || "modern-minimalist",
        },
      })

      // Update presentation with results
      await prisma.presentation.update({
        where: { id: presentation.id },
        data: {
          status: "COMPLETED",
          slideCount: result.slideCount,
          fileUrl: result.fileUrl,
          pdfUrl: result.pdfUrl,
          previewUrl: result.previewUrl,
        },
      })

      return NextResponse.json({
        presentationId: presentation.id,
        status: "completed",
        slideCount: result.slideCount,
        downloadUrl: result.fileUrl,
        previewUrl: result.previewUrl,
      })
    } catch (error) {
      // Update status to failed
      await prisma.presentation.update({
        where: { id: presentation.id },
        data: {
          status: "FAILED",
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        },
      })

      return NextResponse.json(
        {
          error: "Failed to generate presentation",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Course Studio generation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
