import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { fileExtractionService } from "@/lib/services/file-extraction.service"
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    TableRow,
    TableCell,
    Table,
    WidthType,
    BorderStyle,
    ShadingType,
    PageBreak,
} from "docx"
import { promises as fs } from "fs"
import path from "path"
import type { ChatMessage } from "@/types/ai.types"

interface LectureNotesParams {
    title: string
    description: string
    sources: Array<{ fileName: string; fileType: string; fileUrl: string }> | string[]
    settings: {
        difficultyLevel?: string
        targetDuration?: number
        includeQuizzes?: boolean
        includeDiscussions?: boolean
    }
}

interface LectureNotesResult {
    url: string
    googleDocsUrl: string
    fileName: string
}

interface ParsedSection {
    heading: string
    level: number
    paragraphs: string[]
}

export class LectureNotesService {
    /**
     * Generate lecture notes from an existing presentation
     */
    async generateFromPresentation(presentation: {
        title: string
        description?: string | null
        targetDuration?: number | null
        metadata?: string | null
        slides: Array<{
            slideNumber: number
            title: string | null
            content: string | null
            notes: string | null
        }>
    }): Promise<LectureNotesResult> {
        // Build content from slides
        let slideContent = ""
        for (const slide of presentation.slides) {
            slideContent += `\n## Slide ${slide.slideNumber}: ${slide.title || "Untitled"}\n`
            if (slide.content) {
                try {
                    const contentArr = JSON.parse(slide.content)
                    if (Array.isArray(contentArr)) {
                        slideContent += contentArr.map((p: string) => `- ${p}`).join("\n")
                    } else {
                        slideContent += slide.content
                    }
                } catch {
                    slideContent += slide.content
                }
            }
            if (slide.notes) {
                slideContent += `\nSpeaker Notes: ${slide.notes}\n`
            }
        }

        const metadata = presentation.metadata ? JSON.parse(presentation.metadata) : {}

        // Use AI to expand slide content into comprehensive lecture notes
        const lectureText = await this.generateLectureText(
            presentation.title,
            presentation.description || "",
            slideContent,
            metadata.difficultyLevel || "intermediate",
            presentation.targetDuration || 50
        )

        // Parse AI output and create .docx
        const sections = this.parseLectureText(lectureText)
        return this.createDocx(presentation.title, sections)
    }

    /**
     * Generate standalone lecture notes (not from existing presentation)
     */
    async generateStandalone(params: LectureNotesParams): Promise<LectureNotesResult> {
        // Extract content from sources
        let sourceContent = ""
        for (const source of params.sources) {
            if (typeof source === "string") {
                // URL string
                try {
                    const filePath = path.join(process.cwd(), "public", source.replace(/^\//, ""))
                    const ext = path.extname(source).toLowerCase()
                    const fileName = path.basename(source)
                    const extracted = await fileExtractionService.extractFromFile(filePath, fileName)
                    sourceContent += `\n\n## Source: ${fileName}\n${extracted.text}`
                } catch (error) {
                    console.error(`Failed to extract source: ${source}`, error)
                }
            } else {
                // Source object
                try {
                    const filePath = path.join(process.cwd(), "public", source.fileUrl.replace(/^\//, ""))
                    const extracted = await fileExtractionService.extractFromFile(filePath, source.fileName)
                    sourceContent += `\n\n## Source: ${source.fileName}\n${extracted.text}`
                } catch (error) {
                    console.error(`Failed to extract ${source.fileName}:`, error)
                }
            }
        }

        const lectureText = await this.generateLectureText(
            params.title,
            params.description,
            sourceContent,
            params.settings.difficultyLevel || "intermediate",
            params.settings.targetDuration || 50
        )

        const sections = this.parseLectureText(lectureText)
        return this.createDocx(params.title, sections)
    }

    /**
     * Use AI to generate comprehensive lecture notes text
     */
    private async generateLectureText(
        title: string,
        description: string,
        sourceContent: string,
        difficulty: string,
        duration: number
    ): Promise<string> {
        const prompt = `You are an expert university professor. Create comprehensive, detailed LECTURE NOTES for the following topic.

IMPORTANT: These are LECTURE NOTES, NOT PowerPoint slides. Lecture notes should be:
- Written in full, flowing paragraphs (NOT bullet points)
- Comprehensive and self-explanatory (a student should understand the topic fully from reading these alone)
- Include detailed theoretical foundations, real-world examples, and case studies
- Academic rigor with accessible language

Title: ${title}
${description ? `Description: ${description}` : ""}
Difficulty Level: ${difficulty}
Lecture Duration: ${duration} minutes

${sourceContent ? `Source Material:\n${sourceContent.substring(0, 6000)}` : ""}

Generate the lecture notes with these EXACT section headers (use ## for main sections, ### for subsections):

## Learning Objectives
Write 4-6 specific, measurable learning objectives using Bloom's taxonomy verbs.

## Key Terms and Definitions
Define 8-12 essential terms with clear, concise definitions.

## Theoretical Foundation
Write 4-6 detailed paragraphs covering the core theoretical framework. Include citations where appropriate. Explain WHY these theories matter and HOW they connect.

## Detailed Content
### [Subtopic 1 Title]
Write 3-4 paragraphs of detailed explanation.

### [Subtopic 2 Title]
Write 3-4 paragraphs of detailed explanation.

### [Subtopic 3 Title]
Write 3-4 paragraphs of detailed explanation.

(Add more subtopics as needed for the topic)

## Case Study
Write a detailed case study (3-4 paragraphs) that grounds the theory in a real or realistic scenario. Include analysis questions.

## Applications and Real-World Connections
Write 2-3 paragraphs connecting the theory to current practice, industry, or daily life.

## Discussion Questions
Provide 5-7 thought-provoking discussion questions that encourage critical thinking.

## Summary and Key Takeaways
Write 2-3 paragraphs summarizing the main points. List 5-7 key takeaways.

## Extended Reading List
Provide 5-8 academic references (books, journal articles, online resources).

## Pre-Class Preparation
Brief instructions for what students should read or do BEFORE the next lecture.

Write in an authoritative but accessible academic style. Each section should be substantial.`

        const messages: ChatMessage[] = [
            { role: "system", content: "You are an expert university professor creating comprehensive lecture notes. Write in detailed, flowing paragraphs. Use markdown headers (## and ###) to structure the content. Do NOT use bullet-point only sections except for Learning Objectives, Key Terms, Discussion Questions, and Reading List." },
            { role: "user", content: prompt },
        ]

        try {
            const { stream } = await multiAI.streamChat(messages)
            const reader = stream.getReader()
            const decoder = new TextDecoder()
            let text = ""
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                text += decoder.decode(value, { stream: true })
            }
            return text || this.getFallbackLectureNotes(title)
        } catch (error) {
            console.error("AI lecture notes generation failed:", error)
            return this.getFallbackLectureNotes(title)
        }
    }

    /**
     * Parse the AI-generated text into structured sections
     */
    private parseLectureText(text: string): ParsedSection[] {
        const sections: ParsedSection[] = []
        const lines = text.split("\n")
        let currentSection: ParsedSection | null = null

        for (const line of lines) {
            const h2Match = line.match(/^## (.+)/)
            const h3Match = line.match(/^### (.+)/)

            if (h2Match) {
                if (currentSection) sections.push(currentSection)
                currentSection = { heading: h2Match[1].trim(), level: 2, paragraphs: [] }
            } else if (h3Match) {
                if (currentSection) sections.push(currentSection)
                currentSection = { heading: h3Match[1].trim(), level: 3, paragraphs: [] }
            } else if (currentSection) {
                const trimmed = line.trim()
                if (trimmed) {
                    currentSection.paragraphs.push(trimmed)
                }
            }
        }

        if (currentSection) sections.push(currentSection)
        return sections
    }

    /**
     * Create a .docx file from parsed sections
     */
    private async createDocx(title: string, sections: ParsedSection[]): Promise<LectureNotesResult> {
        const children: Paragraph[] = []

        // Title
        children.push(
            new Paragraph({
                children: [new TextRun({ text: title, bold: true, size: 52, font: "Calibri", color: "1F2937" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            })
        )

        // Subtitle line
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Comprehensive Lecture Notes", size: 28, font: "Calibri", color: "6B7280", italics: true }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
            })
        )

        // Date
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, size: 22, font: "Calibri", color: "9CA3AF" }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            })
        )

        // Horizontal rule
        children.push(
            new Paragraph({
                children: [new TextRun({ text: "━".repeat(60), size: 16, color: "D1D5DB" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            })
        )

        // Sections
        for (const section of sections) {
            // Section heading
            children.push(
                new Paragraph({
                    text: section.heading,
                    heading: section.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
                    spacing: { before: 360, after: 160 },
                })
            )

            // Section paragraphs
            for (const para of section.paragraphs) {
                // Check if it's a list item
                if (para.startsWith("- ") || para.startsWith("• ") || para.match(/^\d+\.\s/)) {
                    const text = para.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "")
                    children.push(
                        new Paragraph({
                            children: [new TextRun({ text, size: 24, font: "Calibri" })],
                            bullet: { level: 0 },
                            spacing: { after: 60 },
                        })
                    )
                } else if (para.startsWith("**") && para.endsWith("**")) {
                    // Bold line (term definition header)
                    children.push(
                        new Paragraph({
                            children: [new TextRun({ text: para.replace(/\*\*/g, ""), bold: true, size: 24, font: "Calibri" })],
                            spacing: { after: 80 },
                        })
                    )
                } else {
                    // Regular paragraph - handle inline bold/italic
                    const runs = this.parseInlineFormatting(para)
                    children.push(
                        new Paragraph({
                            children: runs,
                            spacing: { after: 160, line: 360 },
                        })
                    )
                }
            }
        }

        // Footer
        children.push(
            new Paragraph({
                children: [new TextRun({ text: "" })],
                spacing: { before: 600 },
            })
        )
        children.push(
            new Paragraph({
                children: [new TextRun({ text: "━".repeat(60), size: 16, color: "D1D5DB" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            })
        )
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Generated by Professor GENIE — AI-Powered Lecture Notes", size: 20, font: "Calibri", color: "9CA3AF", italics: true }),
                ],
                alignment: AlignmentType.CENTER,
            })
        )

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                    },
                },
                children,
            }],
        })

        // Save .docx file
        const fileName = `lecture-notes-${Date.now()}.docx`
        const uploadsDir = path.join(process.cwd(), "public/uploads/lecture-notes")
        await fs.mkdir(uploadsDir, { recursive: true })

        const filePath = path.join(uploadsDir, fileName)
        const docBuffer = await Packer.toBuffer(doc)
        await fs.writeFile(filePath, new Uint8Array(docBuffer.buffer, docBuffer.byteOffset, docBuffer.byteLength))

        const url = `/uploads/lecture-notes/${fileName}`

        return {
            url,
            googleDocsUrl: url, // Same .docx — upload to Google Drive for Google Docs
            fileName,
        }
    }

    /**
     * Parse inline markdown formatting into TextRun objects
     */
    private parseInlineFormatting(text: string): TextRun[] {
        const runs: TextRun[] = []
        // Simple parser for **bold** and *italic*
        const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)

        for (const part of parts) {
            if (part.startsWith("**") && part.endsWith("**")) {
                runs.push(new TextRun({
                    text: part.slice(2, -2),
                    bold: true,
                    size: 24,
                    font: "Calibri",
                }))
            } else if (part.startsWith("*") && part.endsWith("*")) {
                runs.push(new TextRun({
                    text: part.slice(1, -1),
                    italics: true,
                    size: 24,
                    font: "Calibri",
                }))
            } else if (part) {
                runs.push(new TextRun({
                    text: part,
                    size: 24,
                    font: "Calibri",
                }))
            }
        }

        return runs.length > 0 ? runs : [new TextRun({ text, size: 24, font: "Calibri" })]
    }

    /**
     * Fallback lecture notes if AI generation fails
     */
    private getFallbackLectureNotes(title: string): string {
        return `## Learning Objectives
- Understand the fundamental concepts of ${title}
- Apply key principles to real-world scenarios
- Analyze and evaluate related case studies
- Synthesize knowledge for practical implementation

## Key Terms and Definitions
- **Core Concept**: The fundamental idea or principle underlying ${title}
- **Framework**: The structured approach to understanding this topic
- **Application**: How these concepts are used in practice
- **Analysis**: Breaking down complex ideas into components

## Theoretical Foundation
${title} is a fundamental topic in its field that requires careful study and understanding. The theoretical underpinning of this subject draws from established academic research and practical applications.

The key frameworks that inform our understanding include foundational theories that have been developed and refined over decades of scholarly work. These theories provide the lens through which we examine and analyze the subject matter.

Understanding the historical context is essential for appreciating how current knowledge has evolved. Early contributions laid the groundwork for the sophisticated understanding we have today.

## Detailed Content
### Introduction to ${title}
This section provides a comprehensive overview of the topic, establishing the context and relevance for students. The material here builds upon prerequisite knowledge and introduces new concepts systematically.

### Core Principles
The core principles of ${title} form the backbone of our study. These principles guide our analysis and inform our practical applications.

### Advanced Applications
Building on the foundational concepts, we explore how these ideas manifest in complex, real-world scenarios. This analysis helps bridge the gap between theory and practice.

## Case Study
Consider a scenario where the principles of ${title} are applied in a professional context. This case study illustrates the practical implications of the theoretical frameworks discussed above.

The analysis of this case reveals important insights about how theory translates into practice, and highlights common challenges that practitioners face.

## Discussion Questions
1. How do the core principles of ${title} apply to your field of study?
2. What are the main challenges in implementing these concepts in practice?
3. How has the understanding of this topic evolved over time?
4. What ethical considerations arise in the application of these principles?
5. How might emerging trends affect the future development of this field?

## Summary and Key Takeaways
This lecture has covered the essential aspects of ${title}, from theoretical foundations to practical applications. The key points to remember include the core principles, their applications, and the analytical frameworks used to evaluate them.

## Extended Reading List
- Consult your course textbook for foundational reading
- Academic journals in the field provide current research perspectives
- Industry publications offer practical implementation insights

## Pre-Class Preparation
Review the assigned readings and prepare 2-3 questions about concepts you found challenging or particularly interesting.`
    }
}
