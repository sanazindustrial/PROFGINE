import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PresentationResults } from "@/components/presentation-results"

export default async function PresentationResultsPage({
    params,
}: {
    params: { courseId: string; presentationId: string }
}) {
    const session = await requireSession()
    if (!session) {
        redirect("/login")
    }

    // Verify user has access to this course
    const course = await prisma.course.findFirst({
        where: {
            id: params.courseId,
            instructorId: session.user.id,
        },
    })

    if (!course) {
        redirect("/dashboard/courses")
    }

    // Get the presentation details
    const presentation = await prisma.presentation.findFirst({
        where: {
            id: params.presentationId,
            courseId: params.courseId,
            userId: session.user.id,
        },
    })

    if (!presentation) {
        redirect(`/dashboard/courses/${params.courseId}/studio`)
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <PresentationResults
                presentation={presentation}
                course={course}
            />
        </div>
    )
}
