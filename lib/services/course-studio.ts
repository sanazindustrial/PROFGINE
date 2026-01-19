import { multiAI } from "@/adaptors/multi-ai.adaptor"
import PptxGenJS from "pptxgenjs"

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

    // Step 2: Generate outline using AI
    const outline = await this.generateOutline(extractedContent, settings)

    // Step 3: Generate slide content
    const slides = await this.generateSlides(outline, settings)

    // Step 4: Create PowerPoint file
    const pptxFile = await this.createPowerPoint(slides, settings)

    // Step 5: Save slides to database
    await this.saveSlides(presentationId, slides)

    return {
      slideCount: slides.length,
      fileUrl: pptxFile.url,
      pdfUrl: pptxFile.pdfUrl,
      previewUrl: pptxFile.previewUrl,
    }
  }

  /**
   * Extract content from source files
   */
  private async extractContent(sources: SourceFile[]): Promise<string> {
    let combinedContent = ""

    for (const source of sources) {
      if (source.content) {
        combinedContent += `\n\n## Source: ${source.fileName}\n${source.content}`
      } else {
        // In production, implement file reading and parsing
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
   * Create PowerPoint file using pptxgenjs
   */
  private async createPowerPoint(
    slides: SlideContent[],
    settings: PresentationSettings
  ): Promise<{ url: string; pdfUrl: string; previewUrl: string }> {
    const pptx = new PptxGenJS()

    // Apply template style
    this.applyTemplate(pptx, settings.templateStyle || "modern-minimalist")

    // Add slides
    for (const slideData of slides) {
      const slide = pptx.addSlide()

      if (slideData.layout === "title-only") {
        // Title slide
        slide.addText(slideData.title, {
          x: 0.5,
          y: 2.5,
          w: 9,
          h: 1.5,
          fontSize: 44,
          bold: true,
          align: "center",
          color: "363636",
        })
      } else {
        // Content slide
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 32,
          bold: true,
          color: "363636",
        })

        // Add bullet points
        if (slideData.content && slideData.content.length > 0) {
          slide.addText(slideData.content.map(point => ({ text: point, options: { bullet: true } })), {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4,
            fontSize: 18,
            color: "555555",
            valign: "top",
          })
        }
      }

      // Add speaker notes
      if (slideData.notes) {
        slide.addNotes(slideData.notes)
      }
    }

    // In production, save to cloud storage (S3, Azure Blob, etc.)
    // For now, return mock URLs
    const fileName = `presentation-${Date.now()}.pptx`
    
    // Generate the file (this would be saved to storage in production)
    // await pptx.writeFile({ fileName })

    return {
      url: `/downloads/${fileName}`,
      pdfUrl: `/downloads/${fileName.replace(".pptx", ".pdf")}`,
      previewUrl: `/preview/${fileName}`,
    }
  }

  /**
   * Apply template styling to presentation
   */
  private applyTemplate(pptx: PptxGenJS, templateStyle: string) {
    switch (templateStyle) {
      case "modern-minimalist":
        pptx.layout = "LAYOUT_WIDE"
        pptx.theme = {
          headFontFace: "Arial",
          bodyFontFace: "Arial",
        }
        break
      case "academic-classic":
        pptx.layout = "LAYOUT_16x9"
        pptx.theme = {
          headFontFace: "Times New Roman",
          bodyFontFace: "Times New Roman",
        }
        break
      case "corporate-professional":
        pptx.layout = "LAYOUT_16x9"
        pptx.theme = {
          headFontFace: "Calibri",
          bodyFontFace: "Calibri",
        }
        break
      default:
        pptx.layout = "LAYOUT_16x9"
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
