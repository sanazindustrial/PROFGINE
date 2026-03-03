import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PresentationResults } from "@/components/presentation-results"
import { UserRole } from "@prisma/client"

export default async function GeneralPresentationResultsPage({
    params,
}: {
    params: { presentationId: string }
}) {
    const session = await requireSession()
    if (!session) {
        redirect("/login")
    }

    // Get the presentation details - works for both course-linked and general presentations
    // General presentations have courseId as null
    const presentation = await prisma.presentation.findFirst({
        where: session.user.role === UserRole.ADMIN
            ? { id: params.presentationId }
            : {
                id: params.presentationId,
                userId: session.user.id  // User must own the presentation
            },
        include: {
            slides: {
                select: {
                    id: true,
                    slideNumber: true,
                    title: true,
                    notes: true
                },
                orderBy: { slideNumber: "asc" }
            },
            course: {
                select: {
                    id: true,
                    title: true,
                    code: true
                }
            }
        }
    })

    if (!presentation) {
        redirect("/dashboard/presentation-studio")
    }

    // If this presentation has a courseId, redirect to the course-specific results page
    if (presentation.courseId && presentation.course) {
        redirect(`/dashboard/courses/${presentation.courseId}/studio/results/${params.presentationId}`)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <PresentationResults
                presentation={presentation}
            />
        </div>
    )
}
