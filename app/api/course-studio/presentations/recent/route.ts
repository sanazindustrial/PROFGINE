import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
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

        // Get recent presentations for the user (both course-linked and general)
        const presentations = await prisma.presentation.findMany({
            where: { userId: session.user.id },  // Users only see their own
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true,
                title: true,
                status: true,
                slideCount: true,
                createdAt: true,
                courseId: true,
                course: {
                    select: {
                        title: true,
                        code: true
                    }
                }
            }
        })

        return NextResponse.json({
            presentations: presentations.map(p => ({
                ...p,
                courseName: p.course?.title || null,
                courseCode: p.course?.code || null
            }))
        })
    } catch (error) {
        console.error("Error fetching recent presentations:", error)
        return NextResponse.json(
            { error: "Failed to fetch presentations" },
            { status: 500 }
        )
    }
}
