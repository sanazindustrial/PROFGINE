import { prisma } from "@/lib/prisma"

/**
 * Updates course syllabus based on modules, assignments, discussions, and resources
 * Automatically called when course structure changes
 */
export async function updateCourseSyllabus(courseId: string): Promise<string> {
    try {
        // Fetch course with all related data
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        contents: {
                            include: {
                                assignment: {
                                    select: {
                                        id: true,
                                        title: true,
                                        type: true,
                                        points: true,
                                        dueAt: true
                                    }
                                }
                            },
                            orderBy: { orderIndex: "asc" }
                        }
                    },
                    orderBy: { orderIndex: "asc" }
                },
                assignments: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        points: true,
                        dueAt: true
                    }
                },
                discussions: {
                    select: {
                        id: true,
                        title: true,
                        prompt: true
                    }
                },
                instructor: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!course) {
            throw new Error(`Course not found: ${courseId}`)
        }

        // Build syllabus document
        let syllabus = generateSyllabusMarkdown(course)

        // Store syllabus (if you have a syllabus field in Course model)
        // await prisma.course.update({
        //     where: { id: courseId },
        //     data: { syllabus }
        // })

        console.log(`✅ Syllabus updated for course: ${course.title}`)
        return syllabus
    } catch (error) {
        console.error("Error updating syllabus:", error)
        throw error
    }
}

/**
 * Generates formatted syllabus markdown from course data
 */
function generateSyllabusMarkdown(course: any): string {
    let md = `# ${course.title}\n\n`

    // Course Information
    md += `## Course Information\n\n`
    if (course.code) md += `**Course Code:** ${course.code}\n`
    if (course.instructor) {
        md += `**Instructor:** ${course.instructor.name || "TBD"}\n`
        if (course.instructor.email) {
            md += `**Email:** ${course.instructor.email}\n`
        }
    }
    if (course.durationWeeks) {
        md += `**Duration:** ${course.durationWeeks} weeks\n`
    }
    md += `\n`

    // Course Description
    if (course.description) {
        md += `## Course Description\n\n`
        md += `${course.description}\n\n`
    }

    // Learning Objectives
    md += `## Learning Objectives\n\n`
    md += `By the end of this course, students will be able to:\n`
    md += `- Master core concepts and principles\n`
    md += `- Apply knowledge through practical assignments\n`
    md += `- Engage in meaningful discussions\n`
    md += `- Demonstrate proficiency through assessments\n\n`

    // Course Schedule (Weekly Modules)
    if (course.modules && course.modules.length > 0) {
        md += `## Course Schedule\n\n`

        for (const module of course.modules) {
            md += `### Week ${module.weekNo}: ${module.title}\n`

            if (module.description) {
                md += `${module.description}\n\n`
            }

            if (module.contents && module.contents.length > 0) {
                md += `**Topics & Activities:**\n\n`

                // Group contents by type
                const files = module.contents.filter((c: any) => c.type === "FILE")
                const assignments = module.contents.filter((c: any) => c.type === "ASSIGNMENT")
                const quizzes = module.contents.filter((c: any) => c.type === "QUIZ")
                const discussions = module.contents.filter((c: any) => c.type === "DISCUSSION")
                const links = module.contents.filter((c: any) => c.type === "LINK")
                const pages = module.contents.filter((c: any) => c.type === "PAGE")
                const videos = module.contents.filter((c: any) => c.type === "VIDEO")

                // Readings & Materials
                if (files.length > 0 || links.length > 0 || videos.length > 0) {
                    md += `**📚 Readings & Materials:**\n`
                    files.forEach((c: any) => {
                        const req = c.isRequired ? "⭐ " : ""
                        md += `- ${req}${c.title}\n`
                    })
                    links.forEach((c: any) => {
                        const req = c.isRequired ? "⭐ " : ""
                        md += `- ${req}${c.title}${c.url ? ` - [Link](${c.url})` : ""}\n`
                    })
                    videos.forEach((c: any) => {
                        const req = c.isRequired ? "⭐ " : ""
                        md += `- ${req}${c.title} 📹\n`
                    })
                    md += `\n`
                }

                // Assignments
                if (assignments.length > 0) {
                    md += `**✍️ Assignments:**\n`
                    assignments.forEach((c: any) => {
                        md += `- **${c.title}**`
                        if (c.points) md += ` (${c.points} points)`
                        if (c.dueDate) {
                            md += ` - Due: ${new Date(c.dueDate).toLocaleDateString()}`
                        }
                        if (c.assignment?.type) {
                            md += ` [${c.assignment.type}]`
                        }
                        md += `\n`
                    })
                    md += `\n`
                }

                // Quizzes
                if (quizzes.length > 0) {
                    md += `**📝 Quizzes:**\n`
                    quizzes.forEach((c: any) => {
                        md += `- **${c.title}**`
                        if (c.points) md += ` (${c.points} points)`
                        if (c.dueDate) {
                            md += ` - Due: ${new Date(c.dueDate).toLocaleDateString()}`
                        }
                        md += `\n`
                    })
                    md += `\n`
                }

                // Discussions
                if (discussions.length > 0) {
                    md += `**💬 Discussion Topics:**\n`
                    discussions.forEach((c: any) => {
                        md += `- ${c.title}\n`
                    })
                    md += `\n`
                }

                // Pages
                if (pages.length > 0) {
                    md += `**📄 Course Pages:**\n`
                    pages.forEach((c: any) => {
                        md += `- ${c.title}\n`
                    })
                    md += `\n`
                }
            }

            md += `---\n\n`
        }
    }

    // Grading & Assessment
    md += `## Grading & Assessment\n\n`

    const allAssignments = course.modules?.flatMap((m: any) =>
        m.contents?.filter((c: any) => c.type === "ASSIGNMENT" || c.type === "QUIZ") || []
    ) || []

    if (allAssignments.length > 0) {
        md += `### Assignments & Quizzes\n\n`
        md += `| Assessment | Type | Points | Due Date |\n`
        md += `|------------|------|--------|----------|\n`

        let totalPoints = 0
        allAssignments.forEach((item: any) => {
            const title = item.title || "Untitled"
            const type = item.type || (item.assignment?.type || "Assignment")
            const points = item.points || item.assignment?.points || 0
            const dueDate = item.dueDate || item.assignment?.dueAt
            const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString() : "TBD"

            md += `| ${title} | ${type} | ${points} | ${dueDateStr} |\n`
            totalPoints += points
        })

        md += `\n**Total Points:** ${totalPoints}\n\n`

        // Grading Scale
        md += `### Grading Scale\n\n`
        md += `- A: 90-100%\n`
        md += `- B: 80-89%\n`
        md += `- C: 70-79%\n`
        md += `- D: 60-69%\n`
        md += `- F: Below 60%\n\n`
    }

    // Course Policies
    md += `## Course Policies\n\n`
    md += `### Attendance\n`
    md += `Regular attendance and participation are expected.\n\n`
    md += `### Late Work\n`
    md += `Late submissions may be accepted with instructor approval. A penalty may apply.\n\n`
    md += `### Academic Integrity\n`
    md += `All work submitted must be your own. Plagiarism will result in disciplinary action.\n\n`

    // Resources
    md += `## Course Resources\n\n`

    const allResources = course.modules?.flatMap((m: any) =>
        m.contents?.filter((c: any) =>
            c.type === "FILE" || c.type === "LINK" || c.type === "VIDEO" || c.type === "PAGE"
        ) || []
    ) || []

    if (allResources.length > 0) {
        allResources.forEach((resource: any) => {
            md += `- **${resource.title}**`
            if (resource.type === "LINK" && resource.url) {
                md += ` - [Access Here](${resource.url})`
            } else if (resource.type === "FILE" && resource.fileUrl) {
                md += ` - [Download](${resource.fileUrl})`
            } else if (resource.type === "VIDEO") {
                md += ` 📹`
            }
            md += `\n`
        })
    } else {
        md += `Additional resources will be provided throughout the course.\n`
    }

    md += `\n---\n\n`
    md += `*This syllabus is subject to change. Students will be notified of any updates.*\n`

    return md
}

/**
 * Exports syllabus as downloadable file
 */
export async function exportSyllabus(courseId: string, format: "md" | "pdf" = "md") {
    const syllabus = await updateCourseSyllabus(courseId)

    if (format === "md") {
        return syllabus
    }

    // TODO: Add PDF generation using a library like puppeteer or pdfkit
    return syllabus
}
