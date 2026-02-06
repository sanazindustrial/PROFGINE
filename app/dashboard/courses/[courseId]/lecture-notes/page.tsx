import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CourseStudioDesign } from "@/components/course-studio-design"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@prisma/client"
import { FileText } from "lucide-react"

export default async function LectureNotesPage({
    params,
}: {
    params: { courseId: string }
}) {
    const session = await requireSession()
    if (!session) {
        redirect("/login")
    }

    const course = await prisma.course.findFirst({
        where: session.user.role === UserRole.ADMIN
            ? { id: params.courseId }
            : { id: params.courseId, instructorId: session.user.id },
    })

    if (!course) {
        redirect("/dashboard")
    }

    return (
        <div className="container mx-auto py-8 px-4 animate-in fade-in-50 duration-500">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Lecture Notes Studio
                    </h1>
                    <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                </div>
                <p className="text-gray-900 dark:text-gray-100">
                    Course: <span className="font-semibold">{course.title}</span> {course.code ? `(${course.code})` : ""}
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-4 py-3 text-sm text-orange-900 dark:text-orange-100">
                    <FileText className="size-4" />
                    Create lecture notes for each section (1-52). Select the section number and generate structured notes.
                </div>

                <CourseStudioDesign
                    courseId={params.courseId}
                    headerTitle="Lecture Notes Builder"
                    headerDescription="Upload materials and generate structured lecture notes with clear sections and summaries"
                    enableSectionNumber
                    includeSectionInTitle
                    sectionLabel="Section / Week Number (1-52)"
                />
            </div>
        </div>
    )
}