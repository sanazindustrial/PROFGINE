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
