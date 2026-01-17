import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CourseStudioDesign } from "@/components/course-studio-design"

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
    where: {
      id: params.courseId,
      instructorId: session.user.id,
    },
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Course Studio Design</h1>
        <p className="text-gray-600">
          Course: {course.title} {course.code ? `(${course.code})` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Studio Panel */}
        <div className="lg:col-span-2">
          <CourseStudioDesign courseId={params.courseId} />
        </div>

        {/* Sidebar - Recent Presentations */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Recent Presentations</h3>
            {presentations.length === 0 ? (
              <p className="text-sm text-gray-500">No presentations yet</p>
            ) : (
              <div className="space-y-2">
                {presentations.map((pres) => (
                  <div
                    key={pres.id}
                    className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-medium text-sm truncate">{pres.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pres.slideCount} slides • {pres.status}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(pres.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload textbook chapters for best results</li>
              <li>• Include lecture notes for personalized content</li>
              <li>• Use 20-25 slides for 50-minute lectures</li>
              <li>• Add quizzes to boost engagement</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✨ Features</h4>
            <ul className="text-sm text-green-800 space-y-1">
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
