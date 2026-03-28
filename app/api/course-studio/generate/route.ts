import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CourseStudioService } from "@/lib/services/course-studio"

export const runtime = "nodejs"
export const maxDuration = 120 // Allow up to 2 minutes for AI generation

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requireSession()
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      courseId,
      title,
      sources,
      settings,
    } = body

    // Validate required fields - only title is truly required
    if (!title) {
      return NextResponse.json(
        { error: "Presentation title is required" },
        { status: 400 }
      )
    }

    // If courseId provided, verify user has access to the course
    if (courseId) {
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
    }
    // If no courseId, this is a general presentation (allowed)

    // Create presentation record (courseId is optional for general presentations)
    const presentation = await prisma.presentation.create({
      data: {
        ...(courseId ? { courseId } : {}),
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
          isGeneralPresentation: !courseId,
        }),
      },
    })

    // Store source files if provided
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const source of sources) {
        // Handle both URL strings (from frontend file upload) and source objects
        const isUrlString = typeof source === 'string'
        const fileUrl = isUrlString ? source : source.fileUrl
        if (!fileUrl) continue

        const fileName = isUrlString
          ? fileUrl.split('/').pop() || 'unknown'
          : source.fileName || 'unknown'
        const fileType = isUrlString
          ? (fileUrl.split('.').pop() || 'unknown').toUpperCase()
          : source.fileType || 'unknown'

        try {
          await prisma.presentationSourceFile.create({
            data: {
              presentationId: presentation.id,
              fileName,
              fileType,
              fileUrl,
              fileSize: isUrlString ? undefined : source.fileSize,
              pages: isUrlString ? undefined : source.pages,
            },
          })
        } catch (err) {
          console.error('Failed to store source file record:', err)
        }
      }
    }

    // Initialize Course Studio Service
    const studioService = new CourseStudioService()

    // Normalize sources: convert URL strings to SourceFile objects
    const normalizedSources = (sources || []).map((s: any) => {
      if (typeof s === 'string') {
        return {
          fileName: s.split('/').pop() || 'file',
          fileType: (s.split('.').pop() || '').toUpperCase(),
          fileUrl: s,
        }
      }
      return s
    })

    // Generate presentation asynchronously
    // In production, this should be a background job
    try {
      const result = await studioService.generatePresentation({
        presentationId: presentation.id,
        sources: normalizedSources,
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
    console.error("Course Studio generation error:", error instanceof Error ? error.stack : error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
