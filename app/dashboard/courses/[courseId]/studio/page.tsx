import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CourseStudioDesign } from "@/components/course-studio-design"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@prisma/client"

export default async function CourseStudioPage({
    params,
}: {
    params: { courseId: string }
}) {
    const session = await requireSession()
    if (!session) {
        redirect("/login")
    }

    // Verify user has access to this course
    const course = await prisma.course.findFirst({
        where: session.user.role === UserRole.ADMIN
            ? { id: params.courseId }
            : { id: params.courseId, instructorId: session.user.id },
    })

    if (!course) {
        redirect("/dashboard")
    }

    // Get existing presentations for this course
    const presentations = await prisma.presentation.findMany({
        where: {
            courseId: params.courseId,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 10,
    })

    return (
        <div className="container mx-auto py-8 px-4 animate-in fade-in-50 duration-500">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Course Studio Design</h1>
                    <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                </div>
                <p className="text-gray-900 dark:text-gray-100">
                    Course: <span className="font-semibold">{course.title}</span> {course.code ? `(${course.code})` : ""}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Studio Panel */}
                <div className="lg:col-span-2">
                    <CourseStudioDesign courseId={params.courseId} />
                </div>

                {/* Sidebar - Recent Presentations */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            📊 Recent Presentations
                            <Badge variant="outline" className="text-xs">{presentations.length}</Badge>
                        </h3>
                        {presentations.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">No presentations yet</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Create your first one above!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {presentations.map((pres) => (
                                    <div
                                        key={pres.id}
                                        className="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors hover:border-blue-300"
                                        onClick={() => window.location.href = `/dashboard/courses/${params.courseId}/studio/results/${pres.id}`}
                                    >
                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{pres.title}</div>
                                        <div className="text-xs text-gray-700 dark:text-gray-200 mt-1 flex items-center gap-2">
                                            <span>{pres.slideCount} slides</span>
                                            <span>•</span>
                                            <Badge variant={pres.status === "COMPLETED" ? "default" : "secondary"} className="text-xs">
                                                {pres.status}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                            {new Date(pres.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                            💡 Quick Tips
                        </h3>
                        <ul className="text-sm space-y-2 text-gray-800 dark:text-gray-100">
                            <li>✓ Upload course materials for better content</li>
                            <li>✓ Choose template that matches your style</li>
                            <li>✓ Include quizzes for interactive learning</li>
                            <li>✓ Add discussions to boost engagement</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tips</h4>
                        <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                            <li>• Upload textbook chapters for best results</li>
                            <li>• Include lecture notes for personalized content</li>
                            <li>• Use 20-25 slides for 50-minute lectures</li>
                            <li>• Add quizzes to boost engagement</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✨ Features</h4>
                        <ul className="text-sm text-green-900 dark:text-green-100 space-y-1">
                            <li>• AI-powered content generation</li>
                            <li>• Multiple professional templates</li>
                            <li>• Automatic slide structuring</li>
                            <li>• Export to PPTX and PDF</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
