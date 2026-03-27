/**
 * AI Quality Enhancement Service
 * Provides NotebookLM-style deep research, Gamma AI-style presentation enhancement,
 * and multi-pass content quality improvement for all content generation.
 */

import { multiAI } from "@/adaptors/multi-ai.adaptor"
import type { ChatMessage } from "@/types/ai.types"

export interface QualityEnhancementResult {
    enhanced: boolean
    content: string
    improvements: string[]
    qualityScore: number // 1-10
    provider: string
}

export interface ResearchSynthesisResult {
    synthesis: string
    keyInsights: string[]
    suggestedTopics: string[]
    academicDepth: 'introductory' | 'intermediate' | 'advanced'
    provider: string
}

export interface SlideEnhancementResult {
    slides: EnhancedSlide[]
    overallQuality: number
    improvements: string[]
    provider: string
}

export interface EnhancedSlide {
    slideNumber: number
    title: string
    content: string[]
    notes: string
    layout: string
    visualSuggestions: string[]
    imageDescriptions: string[]
}

export interface ImageGenerationResult {
    svg: string
    altText: string
    refinedPrompt: string
    palette: string[]
    style: 'academic' | 'infographic' | 'diagram' | 'photo-realistic' | 'illustration'
    provider: string
}

class AIQualityService {
    /**
     * NotebookLM-style deep research synthesis
     * Uses AI to deeply analyze a topic and produce research-grade content
     */
    async researchSynthesize(
        topic: string,
        context: string = '',
        depth: 'introductory' | 'intermediate' | 'advanced' = 'intermediate'
    ): Promise<ResearchSynthesisResult> {
        const messages: ChatMessage[] = [
            {
                role: "system",
                content: `You are an advanced academic research synthesizer (NotebookLM-style). 
Your task is to deeply analyze the given topic and produce comprehensive, well-structured research content.

Level: ${depth}

Guidelines:
- Provide factual, well-researched content with academic rigor
- Include key concepts, theories, and frameworks
- Reference important scholars and research (without fabricating citations)
- Organize content with clear structure and flow
- Include real-world applications and examples
- Highlight connections between concepts
- Identify areas of debate or ongoing research

Output as JSON:
{
  "synthesis": "comprehensive research content as markdown",
  "keyInsights": ["insight1", "insight2", ...],
  "suggestedTopics": ["related topic for further exploration", ...],
  "academicDepth": "${depth}"
}`
            },
            {
                role: "user",
                content: `Research and synthesize the following topic for academic use:\n\nTopic: ${topic}\n${context ? `\nAdditional Context: ${context}` : ''}`
            }
        ]

        try {
            const { stream, provider } = await multiAI.streamChat(messages)
            const text = await this.readStream(stream)

            try {
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const parsed = JSON.parse(cleaned)
                return {
                    synthesis: parsed.synthesis || text,
                    keyInsights: parsed.keyInsights || [],
                    suggestedTopics: parsed.suggestedTopics || [],
                    academicDepth: parsed.academicDepth || depth,
                    provider,
                }
            } catch {
                return {
                    synthesis: text,
                    keyInsights: [],
                    suggestedTopics: [],
                    academicDepth: depth,
                    provider,
                }
            }
        } catch (error) {
            console.error('Research synthesis failed:', error)
            return {
                synthesis: `Research synthesis for "${topic}" is currently unavailable. Please try again later.`,
                keyInsights: [],
                suggestedTopics: [],
                academicDepth: depth,
                provider: 'none',
            }
        }
    }

    /**
     * Enhance content quality with multi-pass AI review
     * Runs content through AI for academic quality improvement
     */
    async enhanceContent(
        content: string,
        contentType: 'lecture' | 'syllabus' | 'presentation' | 'discussion' | 'assessment',
        options: { multiPass?: boolean; targetAudience?: string } = {}
    ): Promise<QualityEnhancementResult> {
        const { multiPass = true, targetAudience = 'undergraduate students' } = options

        const enhancementPrompt = this.getEnhancementPrompt(contentType, targetAudience)

        const messages: ChatMessage[] = [
            { role: "system", content: enhancementPrompt },
            { role: "user", content: `Please enhance the following ${contentType} content:\n\n${content}` }
        ]

        try {
            const { stream, provider } = await multiAI.streamChat(messages)
            let enhanced = await this.readStream(stream)

            const improvements: string[] = []

            // Second pass for quality verification if multiPass is enabled
            if (multiPass) {
                const verifyMessages: ChatMessage[] = [
                    {
                        role: "system",
                        content: `You are a quality assurance reviewer for academic content. Review the following enhanced ${contentType} and:
1. Fix any factual inaccuracies
2. Improve clarity where needed
3. Ensure proper academic tone
4. Check for completeness
5. Rate quality 1-10

Output as JSON:
{
  "content": "the final improved content",
  "improvements": ["improvement1", "improvement2"],
  "qualityScore": 8
}`
                    },
                    { role: "user", content: enhanced }
                ]

                try {
                    const { stream: verifyStream } = await multiAI.streamChat(verifyMessages)
                    const verifyText = await this.readStream(verifyStream)
                    const cleaned = verifyText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                    const parsed = JSON.parse(cleaned)

                    enhanced = parsed.content || enhanced
                    improvements.push(...(parsed.improvements || []))

                    return {
                        enhanced: true,
                        content: enhanced,
                        improvements,
                        qualityScore: parsed.qualityScore || 7,
                        provider,
                    }
                } catch {
                    // Second pass parsing failed, use first pass result
                }
            }

            return {
                enhanced: true,
                content: enhanced,
                improvements,
                qualityScore: 7,
                provider,
            }
        } catch (error) {
            console.error('Content enhancement failed:', error)
            return {
                enhanced: false,
                content,
                improvements: [],
                qualityScore: 5,
                provider: 'none',
            }
        }
    }

    /**
     * Gamma AI-style presentation enhancement
     * Improves slide content, suggests visuals, and optimizes layouts
     */
    async enhanceSlides(
        slides: Array<{ slideNumber: number; title: string; content: string[]; notes: string; layout: string }>,
        topic: string,
        style: string = 'modern-minimalist'
    ): Promise<SlideEnhancementResult> {
        const messages: ChatMessage[] = [
            {
                role: "system",
                content: `You are an expert presentation designer (Gamma AI-style). Enhance the following slides for maximum visual impact and educational effectiveness.

Design Style: ${style}

For each slide:
1. Improve title for clarity and engagement
2. Refine bullet points (max 5-7 per slide, concise)
3. Add descriptive speaker notes
4. Suggest visual elements (charts, diagrams, images)
5. Recommend the best layout
6. Suggest image descriptions for AI image generation

Output as JSON array:
[{
  "slideNumber": 1,
  "title": "Enhanced Title",
  "content": ["point1", "point2"],
  "notes": "Detailed speaker notes...",
  "layout": "title-content",
  "visualSuggestions": ["Add a comparison chart", "Include a diagram"],
  "imageDescriptions": ["A professional photo of...", "An infographic showing..."]
}]`
            },
            {
                role: "user",
                content: `Topic: ${topic}\n\nSlides to enhance:\n${JSON.stringify(slides, null, 2)}`
            }
        ]

        try {
            const { stream, provider } = await multiAI.streamChat(messages)
            const text = await this.readStream(stream)

            try {
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const parsed = JSON.parse(cleaned)

                const enhancedSlides: EnhancedSlide[] = parsed.map((s: any) => ({
                    slideNumber: s.slideNumber,
                    title: s.title,
                    content: s.content || [],
                    notes: s.notes || '',
                    layout: s.layout || 'title-content',
                    visualSuggestions: s.visualSuggestions || [],
                    imageDescriptions: s.imageDescriptions || [],
                }))

                return {
                    slides: enhancedSlides,
                    overallQuality: 8,
                    improvements: ['Enhanced slide titles', 'Improved content structure', 'Added visual suggestions', 'Enhanced speaker notes'],
                    provider,
                }
            } catch {
                // Parsing failed, return originals with basic enhancement
                return {
                    slides: slides.map(s => ({
                        ...s,
                        visualSuggestions: [],
                        imageDescriptions: [],
                    })),
                    overallQuality: 6,
                    improvements: ['Enhancement parsing failed - used original content'],
                    provider,
                }
            }
        } catch (error) {
            console.error('Slide enhancement failed:', error)
            return {
                slides: slides.map(s => ({
                    ...s,
                    visualSuggestions: [],
                    imageDescriptions: [],
                })),
                overallQuality: 5,
                improvements: [],
                provider: 'none',
            }
        }
    }

    /**
     * Generate enhanced lecture notes from a topic
     * Creates comprehensive, well-structured lecture notes with academic depth
     */
    async generateEnhancedLectureNotes(
        topic: string,
        courseContext: string = '',
        duration: number = 50
    ): Promise<{ notes: string; outline: string[]; keyTerms: Array<{ term: string; definition: string }>; provider: string }> {
        const messages: ChatMessage[] = [
            {
                role: "system",
                content: `You are an expert academic lecture note generator. Create comprehensive, well-structured lecture notes.

Duration: ${duration} minutes
Format: Detailed markdown with clear sections

Requirements:
1. Start with learning objectives (3-5)
2. Include an outline of major topics
3. Provide detailed content for each section with:
   - Key concepts and definitions
   - Examples and applications
   - Critical analysis questions
   - Visual/diagram descriptions
4. Include a glossary of key terms
5. End with a summary and review questions
6. Add discussion prompts throughout

Output as JSON:
{
  "notes": "full lecture notes in markdown",
  "outline": ["Section 1 title", "Section 2 title", ...],
  "keyTerms": [{"term": "Term", "definition": "Definition"}, ...]
}`
            },
            {
                role: "user",
                content: `Generate detailed lecture notes for:\nTopic: ${topic}\n${courseContext ? `Course Context: ${courseContext}` : ''}\nDuration: ${duration} minutes`
            }
        ]

        try {
            const { stream, provider } = await multiAI.streamChat(messages)
            const text = await this.readStream(stream)

            try {
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const parsed = JSON.parse(cleaned)
                return {
                    notes: parsed.notes || text,
                    outline: parsed.outline || [],
                    keyTerms: parsed.keyTerms || [],
                    provider,
                }
            } catch {
                return { notes: text, outline: [], keyTerms: [], provider }
            }
        } catch (error) {
            console.error('Lecture notes generation failed:', error)
            return {
                notes: `Lecture notes for "${topic}" could not be generated. Please try again.`,
                outline: [],
                keyTerms: [],
                provider: 'none',
            }
        }
    }

    private getEnhancementPrompt(contentType: string, targetAudience: string): string {
        const prompts: Record<string, string> = {
            lecture: `You are an expert academic content enhancer. Improve the following lecture content for ${targetAudience}:
- Add depth and academic rigor
- Include real-world examples and case studies
- Improve structure and flow
- Add critical thinking prompts
- Ensure factual accuracy
- Use clear, engaging language
Return the enhanced content only.`,
            syllabus: `You are an expert curriculum designer. Enhance the following syllabus content:
- Ensure clear learning objectives aligned with Bloom's taxonomy
- Improve course structure and progression
- Add assessment alignment details
- Enhance policy clarity
- Include accessibility considerations
Return the enhanced content only.`,
            presentation: `You are an expert presentation designer. Enhance the following presentation content:
- Improve slide titles for clarity and impact
- Optimize bullet points (5-7 max per slide)
- Add transition prompts between slides
- Suggest visual elements
- Improve speaker notes
Return the enhanced content only.`,
            discussion: `You are an expert discussion facilitator. Enhance the following discussion content:
- Add Socratic questioning prompts
- Include multiple perspectives
- Deepen critical analysis opportunities
- Add scaffolding for different skill levels
Return the enhanced content only.`,
            assessment: `You are an expert assessment designer. Enhance the following assessment content:
- Align with Bloom's taxonomy levels
- Vary question types and cognitive demands
- Improve rubric clarity and specificity
- Ensure fairness and inclusivity
Return the enhanced content only.`,
        }
        return prompts[contentType] || prompts.lecture
    }

    /**
     * Nano Banana (Gamma AI-style) image generation
     * Generates descriptive image prompts and SVG/placeholder visuals for slides and content
     */
    async generateImage(
        description: string,
        context: string = '',
        style: 'academic' | 'infographic' | 'diagram' | 'photo-realistic' | 'illustration' = 'academic'
    ): Promise<ImageGenerationResult> {
        const messages: ChatMessage[] = [
            {
                role: "system",
                content: `You are an expert visual content creator for educational materials (Nano Banana / Gamma AI style).
Generate a detailed, production-ready SVG image based on the description.

Style: ${style}
Purpose: Educational presentation or lecture material

Guidelines:
- Create clean, professional SVG graphics
- Use appropriate colors for the style (academic = blues/grays, infographic = vibrant, diagram = structured)
- Include labels and annotations where helpful
- Keep text readable at presentation sizes
- Use proper SVG elements (rect, circle, text, path, line, polygon)
- Ensure the SVG is well-structured with viewBox="0 0 800 600"

Also provide:
1. An alt-text description for accessibility
2. A refined prompt that could be used with external image generation APIs (DALL-E, Midjourney, etc.)
3. Color palette used

Output as JSON:
{
  "svg": "<svg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'>...</svg>",
  "altText": "Descriptive alt text for screen readers",
  "refinedPrompt": "A detailed prompt for external AI image generation",
  "palette": ["#color1", "#color2", "#color3"],
  "style": "${style}"
}`
            },
            {
                role: "user",
                content: `Create a visual for: ${description}${context ? `\n\nContext: ${context}` : ''}`
            }
        ]

        try {
            const { stream, provider } = await multiAI.streamChat(messages)
            const text = await this.readStream(stream)

            try {
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const parsed = JSON.parse(cleaned)

                // Sanitize SVG to prevent XSS
                const safeSvg = this.sanitizeSvg(parsed.svg || '')

                return {
                    svg: safeSvg,
                    altText: parsed.altText || description,
                    refinedPrompt: parsed.refinedPrompt || description,
                    palette: parsed.palette || ['#4F46E5', '#6B7280', '#F3F4F6'],
                    style,
                    provider,
                }
            } catch {
                return this.generateFallbackImage(description, style)
            }
        } catch (error) {
            console.error('Image generation failed:', error)
            return this.generateFallbackImage(description, style)
        }
    }

    /**
     * Generate multiple images for a set of slides
     */
    async generateSlideImages(
        slides: Array<{ title: string; content: string[]; imageDescriptions?: string[] }>,
        topic: string,
        style: 'academic' | 'infographic' | 'diagram' | 'photo-realistic' | 'illustration' = 'academic'
    ): Promise<Array<{ slideIndex: number; images: ImageGenerationResult[] }>> {
        const results: Array<{ slideIndex: number; images: ImageGenerationResult[] }> = []

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i]
            const descriptions = slide.imageDescriptions?.length
                ? slide.imageDescriptions
                : [`Visual representation of: ${slide.title} - ${slide.content.slice(0, 3).join(', ')}`]

            const images: ImageGenerationResult[] = []
            for (const desc of descriptions.slice(0, 2)) { // Max 2 images per slide
                const image = await this.generateImage(desc, `Topic: ${topic}, Slide: ${slide.title}`, style)
                images.push(image)
            }
            results.push({ slideIndex: i, images })
        }

        return results
    }

    private sanitizeSvg(svg: string): string {
        // Remove any script tags, event handlers, and dangerous elements
        return svg
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\bon\w+\s*=/gi, 'data-removed=')
            .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
            .replace(/<object\b[^>]*>.*?<\/object>/gi, '')
            .replace(/<embed\b[^>]*>/gi, '')
            .replace(/javascript\s*:/gi, '')
            .replace(/data\s*:\s*text\/html/gi, '')
    }

    private generateFallbackImage(description: string, style: string): ImageGenerationResult {
        const colors: Record<string, { bg: string; accent: string; text: string }> = {
            academic: { bg: '#EEF2FF', accent: '#4F46E5', text: '#1E1B4B' },
            infographic: { bg: '#FFF7ED', accent: '#EA580C', text: '#431407' },
            diagram: { bg: '#F0FDF4', accent: '#16A34A', text: '#14532D' },
            'photo-realistic': { bg: '#F8FAFC', accent: '#0EA5E9', text: '#0C4A6E' },
            illustration: { bg: '#FDF4FF', accent: '#A855F7', text: '#3B0764' },
        }
        const c = colors[style] || colors.academic

        const svg = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="${c.bg}" rx="12"/>
  <rect x="40" y="40" width="720" height="520" fill="white" rx="8" stroke="${c.accent}" stroke-width="2" opacity="0.8"/>
  <rect x="40" y="40" width="720" height="80" fill="${c.accent}" rx="8 8 0 0"/>
  <text x="400" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">${this.escapeXml(description.substring(0, 60))}</text>
  <circle cx="400" cy="340" r="100" fill="${c.accent}" opacity="0.15"/>
  <text x="400" y="345" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${c.text}">Visual Placeholder</text>
  <text x="400" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${c.accent}">AI-generated visual • Nano Banana</text>
</svg>`

        return {
            svg,
            altText: description,
            refinedPrompt: description,
            palette: [c.bg, c.accent, c.text],
            style: style as ImageGenerationResult['style'],
            provider: 'fallback',
        }
    }

    private escapeXml(text: string): string {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    private async readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let result = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            result += decoder.decode(value, { stream: true })
        }

        return result
    }
}

export const aiQualityService = new AIQualityService()
