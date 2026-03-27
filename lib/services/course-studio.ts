import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { aiQualityService } from "@/lib/services/ai-quality.service"
import { fileExtractionService } from "@/lib/services/file-extraction.service"
import PptxGenJS from "pptxgenjs"
import { promises as fs } from "fs"
import path from "path"

interface GenerationParams {
    presentationId: string
    sources: SourceFile[]
    settings: PresentationSettings
}

interface SourceFile {
    fileName: string
    fileType: string
    fileUrl: string
    content?: string
    pages?: string
}

interface PresentationSettings {
    title: string
    templateStyle?: string
    targetSlides?: number
    targetDuration?: number
    difficultyLevel?: string
    includeQuizzes?: boolean
    includeDiscussions?: boolean
    sectionNumber?: number
}

interface SlideContent {
    slideNumber: number
    title: string
    content: string[]
    notes?: string
    layout: string
}

export class CourseStudioService {
    /**
     * Generate a complete presentation from sources
     */
    async generatePresentation(params: GenerationParams) {
        const { presentationId, sources, settings } = params

        // Step 1: Extract and analyze content from sources
        const extractedContent = await this.extractContent(sources)

        // Step 1.5: NotebookLM-style research synthesis for deeper content
        let enrichedContent = extractedContent
        try {
            const research = await aiQualityService.researchSynthesize(
                settings.title,
                extractedContent.substring(0, 4000),
                (settings.difficultyLevel as 'introductory' | 'intermediate' | 'advanced') || 'intermediate'
            )
            if (research.synthesis) {
                enrichedContent += `\n\n## Research Synthesis\n${research.synthesis}`
                if (research.keyInsights.length > 0) {
                    enrichedContent += `\n\n### Key Insights\n${research.keyInsights.map(i => `- ${i}`).join('\n')}`
                }
            }
        } catch (error) {
            console.error('Research synthesis skipped:', error)
        }

        // Step 2: Generate outline using AI
        const outline = await this.generateOutline(enrichedContent, settings)

        // Step 3: Generate slide content
        const slides = await this.generateSlides(outline, settings)

        // Step 3.5: Gamma AI-style slide enhancement for quality
        let enhancedSlides: SlideContent[] = slides
        try {
            const enhancement = await aiQualityService.enhanceSlides(
                slides.map(s => ({ ...s, notes: s.notes || '' })),
                settings.title,
                settings.templateStyle || 'modern-minimalist'
            )
            if (enhancement.slides.length > 0 && enhancement.overallQuality >= 6) {
                enhancedSlides = enhancement.slides.map(s => ({
                    slideNumber: s.slideNumber,
                    title: s.title,
                    content: s.content,
                    notes: s.notes,
                    layout: s.layout,
                }))
            }
        } catch (error) {
            console.error('Slide enhancement skipped:', error)
        }

        // Step 3.7: Nano Banana - Generate AI images for slides
        let slideImages: Map<number, string> = new Map()
        try {
            const imageResults = await aiQualityService.generateSlideImages(
                enhancedSlides.map(s => ({
                    title: s.title,
                    content: s.content,
                    imageDescriptions: [],
                })),
                settings.title,
                (settings.templateStyle?.includes('academic') ? 'academic' : 'infographic') as 'academic' | 'infographic'
            )
            for (const result of imageResults) {
                if (result.images.length > 0 && result.images[0].svg) {
                    slideImages.set(result.slideIndex, result.images[0].svg)
                }
            }
        } catch (error) {
            console.error('Image generation skipped:', error)
        }

        // Step 4: Create PowerPoint file
        const pptxFile = await this.createPowerPoint(enhancedSlides, settings, slideImages)

        // Step 5: Save slides to database
        await this.saveSlides(presentationId, enhancedSlides)

        return {
            slideCount: slides.length,
            fileUrl: pptxFile.url,
            pdfUrl: pptxFile.pdfUrl,
            previewUrl: pptxFile.previewUrl,
        }
    }

    /**
     * Extract content from source files using file extraction service
     */
    private async extractContent(sources: SourceFile[]): Promise<string> {
        let combinedContent = ""

        for (const source of sources) {
            if (source.content) {
                combinedContent += `\n\n## Source: ${source.fileName}\n${source.content}`
            } else if (source.fileUrl) {
                // Try to extract content from the actual file using extraction service
                try {
                    const filePath = path.join(process.cwd(), "public", source.fileUrl.replace(/^\//, ""))
                    const extracted = await fileExtractionService.extractFromFile(filePath, source.fileName)
                    combinedContent += `\n\n## Source: ${source.fileName}\n${extracted.text}`
                    if (extracted.sections.length > 0) {
                        for (const section of extracted.sections) {
                            combinedContent += `\n### ${section.title}\n${section.content}`
                        }
                    }
                } catch (error) {
                    console.error(`Failed to extract ${source.fileName}:`, error)
                    combinedContent += `\n\n## Source: ${source.fileName}\n[Content from ${source.fileType}]`
                }
            } else {
                combinedContent += `\n\n## Source: ${source.fileName}\n[Content from ${source.fileType}]`
            }
        }

        return combinedContent
    }

    /**
     * Generate presentation outline using AI
     */
    private async generateOutline(
        content: string,
        settings: PresentationSettings
    ): Promise<string> {
        const targetSlides = settings.targetSlides || 25
        const duration = settings.targetDuration || 50

        const prompt = `You are an expert educational content designer. Create a detailed lecture outline for a presentation.

Title: ${settings.title}
    ${settings.sectionNumber ? `Section/Week: ${settings.sectionNumber}` : ""}
Target Slides: ${targetSlides}
Duration: ${duration} minutes
Difficulty: ${settings.difficultyLevel || "intermediate"}

Source Content:
${content.substring(0, 8000)} // Limit content length

Create a structured outline with:
1. Title slide
2. Learning objectives (1-2 slides)
3. Introduction (2-3 slides)
4. Main content sections (12-15 slides)
${settings.includeQuizzes ? "5. Quiz questions (2-3 slides)" : ""}
${settings.includeDiscussions ? "6. Discussion prompts (1-2 slides)" : ""}
7. Summary and conclusion (1-2 slides)
8. Q&A and resources (1 slide)

For each section, provide:
- Slide title
- Key points (3-5 bullet points max per slide)
- Speaker notes

Format as JSON array with this structure:
[
  {
    "slideNumber": 1,
    "title": "Slide Title",
    "points": ["Point 1", "Point 2", "Point 3"],
    "notes": "Speaker notes here"
  }
]`

        try {
            // Use streamChat which is available in MultiAIAdapter
            const result = await multiAI.streamChat([
                { role: "system", content: "You are an expert educational content designer specializing in creating engaging lecture presentations." },
                { role: "user", content: prompt },
            ])

            // Read the stream to get the text
            const reader = result.stream.getReader()
            const decoder = new TextDecoder()
            let fullText = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                fullText += decoder.decode(value, { stream: true })
            }

            return fullText
        } catch (error) {
            console.error("Error generating outline:", error)
            return this.getFallbackOutline(settings.title, targetSlides)
        }
    }

    /**
     * Generate individual slides from outline
     */
    private async generateSlides(
        outline: string,
        settings: PresentationSettings
    ): Promise<SlideContent[]> {
        try {
            // Try to parse AI-generated outline
            const cleanedOutline = outline.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
            const parsedOutline = JSON.parse(cleanedOutline)

            return parsedOutline.map((slide: any) => ({
                slideNumber: slide.slideNumber,
                title: slide.title,
                content: slide.points || [],
                notes: slide.notes || "",
                layout: slide.slideNumber === 1 ? "title-only" : "title-content",
            }))
        } catch (error) {
            console.error("Error parsing outline:", error)
            return this.getFallbackSlides(settings.title)
        }
    }

    /**
     * Create PowerPoint file using pptxgenjs with enhanced quality
     */
    private async createPowerPoint(
        slides: SlideContent[],
        settings: PresentationSettings,
        slideImages: Map<number, string> = new Map()
    ): Promise<{ url: string; pdfUrl: string; previewUrl: string }> {
        const pptx = new PptxGenJS()

        // Apply template style
        const colors = this.applyTemplate(pptx, settings.templateStyle || "modern-minimalist")

        // Add slides with enhanced formatting
        for (const slideData of slides) {
            const slide = pptx.addSlide()

            // Add subtle accent bar at top
            slide.addShape(pptx.ShapeType.rect, {
                x: 0,
                y: 0,
                w: '100%',
                h: 0.06,
                fill: { color: colors.accent },
            })

            if (slideData.layout === "title-only" || slideData.slideNumber === 1) {
                // Enhanced title slide with accent background
                slide.addShape(pptx.ShapeType.rect, {
                    x: 0,
                    y: 1.8,
                    w: '100%',
                    h: 2.5,
                    fill: { color: colors.accent, transparency: 92 },
                })

                slide.addText(slideData.title, {
                    x: 0.8,
                    y: 2,
                    w: 8.5,
                    h: 1.5,
                    fontSize: 40,
                    bold: true,
                    align: "center",
                    color: colors.title,
                    fontFace: colors.headFont,
                })

                // Subtitle with settings title if different
                if (settings.title && settings.title !== slideData.title) {
                    slide.addText(settings.title, {
                        x: 0.8,
                        y: 3.5,
                        w: 8.5,
                        h: 0.6,
                        fontSize: 18,
                        color: colors.subtitle,
                        align: "center",
                        fontFace: colors.bodyFont,
                    })
                }

                // Footer line
                slide.addShape(pptx.ShapeType.rect, {
                    x: 3,
                    y: 4.4,
                    w: 4,
                    h: 0.02,
                    fill: { color: colors.accent },
                })
            } else {
                // Enhanced content slide
                // Title with accent underline
                slide.addText(slideData.title, {
                    x: 0.6,
                    y: 0.25,
                    w: 8.8,
                    h: 0.8,
                    fontSize: 28,
                    bold: true,
                    color: colors.title,
                    fontFace: colors.headFont,
                })

                slide.addShape(pptx.ShapeType.rect, {
                    x: 0.6,
                    y: 1.05,
                    w: 2,
                    h: 0.03,
                    fill: { color: colors.accent },
                })

                // Add bullet points with better formatting
                const hasImage = slideImages.has(slideData.slideNumber - 1)
                const contentWidth = hasImage ? 5.5 : 8.8

                if (slideData.content && slideData.content.length > 0) {
                    slide.addText(
                        slideData.content.map(point => ({
                            text: point,
                            options: {
                                bullet: { type: 'bullet', style: '●' },
                                paraSpaceBefore: 6,
                                paraSpaceAfter: 4,
                            }
                        })),
                        {
                            x: 0.6,
                            y: 1.3,
                            w: contentWidth,
                            h: 3.8,
                            fontSize: 17,
                            color: colors.body,
                            valign: "top",
                            fontFace: colors.bodyFont,
                            lineSpacingMultiple: 1.3,
                        }
                    )
                }

                // Add AI-generated image placeholder indicator if available
                if (hasImage) {
                    slide.addShape(pptx.ShapeType.rect, {
                        x: 6.4,
                        y: 1.3,
                        w: 3,
                        h: 3,
                        fill: { color: colors.accent, transparency: 95 },
                        line: { color: colors.accent, width: 1, dashType: 'dash' },
                        rectRadius: 0.1,
                    })
                    slide.addText('AI Visual', {
                        x: 6.4,
                        y: 2.5,
                        w: 3,
                        h: 0.5,
                        fontSize: 12,
                        color: colors.accent,
                        align: 'center',
                        fontFace: colors.bodyFont,
                    })
                }
            }

            // Slide number in footer
            if (slideData.slideNumber > 1) {
                slide.addText(String(slideData.slideNumber), {
                    x: 9,
                    y: 5.1,
                    w: 0.5,
                    h: 0.3,
                    fontSize: 10,
                    color: colors.subtitle,
                    align: "right",
                })
            }

            // Add speaker notes
            if (slideData.notes) {
                slide.addNotes(slideData.notes)
            }
        }

        // Save the PPTX file to public/uploads/presentations
        const fileName = `presentation-${Date.now()}.pptx`
        const uploadsDir = path.join(process.cwd(), "public/uploads/presentations")
        await fs.mkdir(uploadsDir, { recursive: true })

        const filePath = path.join(uploadsDir, fileName)
        const buffer = await pptx.write({ outputType: "nodebuffer" })
        await fs.writeFile(filePath, buffer as unknown as Uint8Array)

        return {
            url: `/uploads/presentations/${fileName}`,
            pdfUrl: `/uploads/presentations/${fileName.replace(".pptx", ".pdf")}`,
            previewUrl: `/uploads/presentations/${fileName}`,
        }
    }

    /**
     * Apply template styling to presentation and return color scheme
     */
    private applyTemplate(pptx: PptxGenJS, templateStyle: string): {
        accent: string; title: string; subtitle: string; body: string;
        headFont: string; bodyFont: string
    } {
        switch (templateStyle) {
            case "modern-minimalist":
                pptx.layout = "LAYOUT_WIDE"
                pptx.theme = { headFontFace: "Arial", bodyFontFace: "Arial" }
                return { accent: "4F46E5", title: "1E1B4B", subtitle: "6B7280", body: "374151", headFont: "Arial", bodyFont: "Arial" }
            case "academic-classic":
                pptx.layout = "LAYOUT_16x9"
                pptx.theme = { headFontFace: "Times New Roman", bodyFontFace: "Times New Roman" }
                return { accent: "1E3A5F", title: "1E3A5F", subtitle: "4B5563", body: "374151", headFont: "Times New Roman", bodyFont: "Times New Roman" }
            case "corporate-professional":
                pptx.layout = "LAYOUT_16x9"
                pptx.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" }
                return { accent: "0D6EFD", title: "212529", subtitle: "6C757D", body: "343A40", headFont: "Calibri", bodyFont: "Calibri" }
            default:
                pptx.layout = "LAYOUT_16x9"
                return { accent: "4F46E5", title: "1F2937", subtitle: "6B7280", body: "374151", headFont: "Arial", bodyFont: "Arial" }
        }
    }

    /**
     * Save slides to database
     */
    private async saveSlides(presentationId: string, slides: SlideContent[]) {
        const { prisma } = await import("@/lib/prisma")

        for (const slide of slides) {
            await prisma.presentationSlide.create({
                data: {
                    presentationId,
                    slideNumber: slide.slideNumber,
                    title: slide.title,
                    content: JSON.stringify(slide.content),
                    notes: slide.notes,
                    layout: slide.layout,
                },
            })
        }
    }

    /**
     * Fallback outline if AI generation fails
     */
    private getFallbackOutline(title: string, targetSlides: number): string {
        const slides = [
            { slideNumber: 1, title: title, points: [], notes: "Title slide" },
            { slideNumber: 2, title: "Learning Objectives", points: ["Understand key concepts", "Apply knowledge", "Analyze examples"], notes: "Introduce learning goals" },
            { slideNumber: 3, title: "Introduction", points: ["Topic overview", "Why this matters", "Connection to previous material"], notes: "Set context" },
        ]

        for (let i = 4; i <= targetSlides - 2; i++) {
            slides.push({
                slideNumber: i,
                title: `Topic ${i - 3}`,
                points: ["Key concept", "Examples", "Applications"],
                notes: "Main content",
            })
        }

        slides.push({
            slideNumber: targetSlides - 1,
            title: "Summary",
            points: ["Key takeaways", "Review concepts", "Next steps"],
            notes: "Wrap up",
        })

        slides.push({
            slideNumber: targetSlides,
            title: "Questions & Resources",
            points: ["Q&A", "Additional reading", "Contact information"],
            notes: "Closing slide",
        })

        return JSON.stringify(slides)
    }

    /**
     * Fallback slides if parsing fails
     */
    private getFallbackSlides(title: string): SlideContent[] {
        return [
            {
                slideNumber: 1,
                title: title,
                content: [],
                notes: "Title slide",
                layout: "title-only",
            },
            {
                slideNumber: 2,
                title: "Learning Objectives",
                content: [
                    "Understand the main concepts",
                    "Apply knowledge to practical examples",
                    "Analyze key principles",
                ],
                notes: "Introduce the learning objectives for this lecture",
                layout: "title-content",
            },
            {
                slideNumber: 3,
                title: "Summary",
                content: [
                    "Key concepts reviewed",
                    "Practical applications discussed",
                    "Questions and further study",
                ],
                notes: "Summarize the main points of the lecture",
                layout: "title-content",
            },
        ]
    }
}
