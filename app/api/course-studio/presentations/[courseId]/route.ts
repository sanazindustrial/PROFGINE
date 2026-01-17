import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await requireSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId } = params

    // Check if user has access to course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { instructorId: session.user.id },
          {
            enrollments: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 403 }
      )
    }

    // Get all presentations for this course
    const presentations = await prisma.presentation.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        slides: {
          select: {
            id: true,
            slideNumber: true,
            title: true,
          },
          orderBy: {
            slideNumber: "asc",
          },
        },
        sources: {
          select: {
            fileName: true,
            fileType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ presentations })
  } catch (error) {
    console.error("Error fetching presentations:", error)
    return NextResponse.json(
      { error: "Failed to fetch presentations" },
      { status: 500 }
    )
  }
}
