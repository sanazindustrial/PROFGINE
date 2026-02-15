/**
 * Course Design Studio Service
 * Implements all phases with governance and AI integration
 */

import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { prisma } from "@/lib/prisma"
import { notificationService } from "@/lib/services/notification.service"
import { exportService, type SyllabusExportData } from "@/lib/services/export.service"
import type {
    CourseDetails,
    EvidenceKitItem,
    ContentAnalysis,
    CourseObjective,
    CourseDesignSection,
    SectionContent,
    SyllabusVersion,
    ReadyCheckReport,
    ReadyCheckResult,
    ReadyCheckType,
    ReadyCheckStatus,
    PromptGovernance,
    FormattingStandard,
    AcademicLevel,
    BloomsLevel,
    GenieResponse,
    GenieQuery,
    AIGenerationRequest,
    AIGenerationResponse,
    AssessmentRubric,
    BulkCourseImport,
} from "@/types/course-design-studio.types"

// =============================================================================
// PROMPT GOVERNANCE - Applied to all AI calls
// =============================================================================

class PromptGovernanceService {
    /**
     * Build governance context for AI prompts
     */
    buildGovernanceContext(courseDetails: Partial<CourseDetails>): PromptGovernance {
        return {
            courseMetadata: courseDetails,
            formattingRules: this.getFormattingRules(courseDetails.formattingStandard || 'APA'),
            roleGuard: {
                canGenerate: true,
                canEdit: false,
                canApprove: false,
                canPublish: false,
            },
            scopeLimits: {
                maxTokens: 4000,
                allowedContentTypes: ['LECTURE', 'READING', 'ASSIGNMENT', 'QUIZ', 'DISCUSSION'],
                restrictedTopics: [],
            },
            forbiddenActions: [
                'Do not auto-publish content',
                'Do not modify course metadata',
                'Do not access external databases',
                'Do not generate content outside course scope',
            ],
        }
    }

    private getFormattingRules(standard: FormattingStandard) {
        const rules = {
            APA: [
                "Use APA 7th edition format for all citations",
                "In-text citations: (Author, Year, p. X)",
                "Reference list entries in hanging indent format",
                "Title case for journal titles, sentence case for article titles",
            ],
            MLA: [
                "Use MLA 9th edition format",
                "In-text citations: (Author Page)",
                "Works Cited page format",
            ],
            CHICAGO: [
                "Use Chicago Manual of Style 17th edition",
                "Footnote/endnote citation style",
                "Bibliography format",
            ],
            HARVARD: [
                "Use Harvard referencing style",
                "In-text: (Author Year)",
                "Reference list alphabetically ordered",
            ],
            IEEE: [
                "Use IEEE citation format",
                "Numbered references in brackets [1]",
                "References section at end",
            ],
            INSTITUTIONAL: [
                "Follow institutional guidelines",
                "Maintain consistency throughout",
            ],
        }
        return [{
            type: 'citation' as const,
            standard,
            rules: rules[standard] || rules.APA,
        }]
    }

    /**
     * Apply governance to a prompt
     */
    governPrompt(basePrompt: string, governance: PromptGovernance): string {
        const contextInjection = `
COURSE CONTEXT (READ ONLY - AI CANNOT MODIFY):
- Academic Level: ${governance.courseMetadata.academicLevel || 'UNDERGRADUATE'}
- Credit Hours: ${governance.courseMetadata.creditHours || 3}
- Learning Model: ${governance.courseMetadata.learningModel || 'LECTURE'}
- Formatting Standard: ${governance.courseMetadata.formattingStandard || 'APA'}
- Delivery Mode: ${governance.courseMetadata.deliveryMode || 'ONLINE'}
- Term Length: ${governance.courseMetadata.termLength || 16} weeks

FORMATTING RULES:
${governance.formattingRules.map(r => r.rules.join('\n')).join('\n')}

SCOPE LIMITS:
- Maximum content length: ${governance.scopeLimits.maxTokens} tokens
- Allowed content types: ${governance.scopeLimits.allowedContentTypes.join(', ')}

FORBIDDEN ACTIONS:
${governance.forbiddenActions.map(a => `- ${a}`).join('\n')}

---
${basePrompt}
`
        return contextInjection
    }
}

// =============================================================================
// MAIN COURSE DESIGN STUDIO SERVICE
// =============================================================================

export class CourseDesignStudioService {
    private governance: PromptGovernanceService

    constructor() {
        this.governance = new PromptGovernanceService()
    }

    // ===========================================================================
    // PHASE 0.5: Course Details & Bulk Import
    // ===========================================================================

    /**
     * Initialize or update course design metadata
     */
    async initializeCourseDesign(
        courseId: string,
        details: Partial<CourseDetails>,
        userId: string
    ) {
        // Check if metadata already exists
        const existing = await prisma.courseDesignMetadata.findUnique({
            where: { courseId },
        })

        if (existing) {
            // Update existing
            const updated = await prisma.courseDesignMetadata.update({
                where: { courseId },
                data: {
                    creditHours: details.creditHours,
                    contactHours: details.contactHours,
                    academicLevel: details.academicLevel,
                    termLength: details.termLength,
                    deliveryMode: details.deliveryMode,
                    prerequisites: details.prerequisites ? JSON.stringify(details.prerequisites) : undefined,
                    programAlignment: details.programAlignment,
                    learningModel: details.learningModel,
                    assessmentWeighting: details.assessmentWeighting ? JSON.stringify(details.assessmentWeighting) : undefined,
                    participationRules: details.participationRules,
                    weeklyWorkloadHours: details.weeklyWorkloadHours,
                    formattingStandard: details.formattingStandard,
                    accessibilityRequired: details.accessibilityRequired,
                    aiUsagePolicy: details.aiUsagePolicy,
                    accreditationBody: details.accreditationBody,
                },
            })

            // Log the update
            await this.logAudit(updated.id, userId, 'UPDATE', 'course_design', updated.id)

            return updated
        }

        // Create new
        const created = await prisma.courseDesignMetadata.create({
            data: {
                courseId,
                creditHours: details.creditHours || 3,
                contactHours: details.contactHours || 3,
                academicLevel: details.academicLevel || 'UNDERGRADUATE',
                termLength: details.termLength || 16,
                deliveryMode: details.deliveryMode || 'ONLINE',
                prerequisites: details.prerequisites ? JSON.stringify(details.prerequisites) : null,
                programAlignment: details.programAlignment,
                learningModel: details.learningModel || 'LECTURE',
                assessmentWeighting: details.assessmentWeighting ? JSON.stringify(details.assessmentWeighting) : null,
                participationRules: details.participationRules,
                weeklyWorkloadHours: details.weeklyWorkloadHours || 9,
                formattingStandard: details.formattingStandard || 'APA',
                accessibilityRequired: details.accessibilityRequired ?? true,
                aiUsagePolicy: details.aiUsagePolicy || 'PERMITTED_WITH_DISCLOSURE',
                accreditationBody: details.accreditationBody,
            },
        })

        await this.logAudit(created.id, userId, 'CREATE', 'course_design', created.id)

        return created
    }

    /**
     * Get course design metadata with all relations
     */
    async getCourseDesign(courseId: string) {
        return await prisma.courseDesignMetadata.findUnique({
            where: { courseId },
            include: {
                course: true,
                evidenceItems: true,
                courseObjectives: { orderBy: { orderIndex: 'asc' } },
                courseSections: {
                    where: { parentSectionId: null },
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        childSections: {
                            orderBy: { orderIndex: 'asc' },
                            include: { contents: { orderBy: { orderIndex: 'asc' } } },
                        },
                        contents: { orderBy: { orderIndex: 'asc' } },
                    },
                },
                syllabusVersions: { orderBy: { version: 'desc' }, take: 1 },
            },
        })
    }

    /**
     * Bulk import courses from CSV/JSON
     */
    async bulkImportCourses(
        importData: BulkCourseImport,
        userId: string
    ) {
        const results: { success: string[]; failed: { course: string; error: string }[] } = {
            success: [],
            failed: [],
        }

        for (const courseData of importData.courses) {
            try {
                if (!courseData.title || !courseData.code) {
                    results.failed.push({
                        course: courseData.title || 'Unknown',
                        error: 'Title and code are required'
                    })
                    continue
                }

                // Create course first
                const course = await prisma.course.create({
                    data: {
                        title: courseData.title,
                        code: courseData.code,
                        description: courseData.programAlignment,
                        instructorId: userId,
                        durationWeeks: courseData.termLength || 16,
                    },
                })

                // Initialize course design metadata
                await this.initializeCourseDesign(course.id, courseData, userId)

                results.success.push(course.id)
            } catch (error) {
                results.failed.push({
                    course: courseData.title || 'Unknown',
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            }
        }

        return results
    }

    // ===========================================================================
    // PHASE 1: Evidence Kit - Material Ingestion
    // ===========================================================================

    /**
     * Add item to Evidence Kit
     */
    async addEvidenceItem(
        courseDesignId: string,
        item: Partial<EvidenceKitItem>,
        userId: string
    ) {
        const evidence = await prisma.evidenceKitItem.create({
            data: {
                courseDesignId,
                title: item.title || item.fileName || 'Untitled',
                fileName: item.fileName || 'unknown',
                fileType: item.fileType || 'OTHER',
                fileUrl: item.fileUrl || '',
                fileSize: item.fileSize,
                mimeType: item.mimeType,
                sourceType: item.sourceType || 'OTHER',
                isbn: item.isbn,
                doi: item.doi,
                externalUrl: item.externalUrl,
                uploadedBy: userId,
                processingStatus: 'PENDING',
            },
        })

        await this.logAudit(courseDesignId, userId, 'CREATE', 'evidence_item', evidence.id)

        // Trigger async processing
        this.processEvidenceItem(evidence.id).catch(console.error)

        return evidence
    }

    /**
     * Process evidence item - extract text, analyze content
     */
    async processEvidenceItem(evidenceId: string) {
        await prisma.evidenceKitItem.update({
            where: { id: evidenceId },
            data: { processingStatus: 'PROCESSING' },
        })

        try {
            const evidence = await prisma.evidenceKitItem.findUnique({
                where: { id: evidenceId },
                include: { courseDesign: true },
            })

            if (!evidence) throw new Error('Evidence item not found')

            // Get course context for AI
            const governance = this.governance.buildGovernanceContext({
                formattingStandard: evidence.courseDesign.formattingStandard as FormattingStandard,
                academicLevel: evidence.courseDesign.academicLevel as AcademicLevel,
            })

            // Generate content summary using AI
            const prompt = this.governance.governPrompt(`
Analyze this uploaded educational material and provide:

1. CONTENT SUMMARY (2-3 paragraphs):
   - What is the main subject matter?
   - What are the key concepts covered?
   - What is the academic level and depth?

2. TOPICS IDENTIFIED (JSON array):
   - List 5-10 main topics with their importance

3. CONCEPTS MAPPING (JSON array):
   - Map key concepts with their relationships

4. POTENTIAL CITATIONS (if identifiable):
   - Authors, titles, years if found in the material

File: ${evidence.fileName}
Type: ${evidence.fileType}

Respond in JSON format:
{
  "summary": "...",
  "topics": ["topic1", "topic2"],
  "concepts": [{"concept": "...", "related": ["..."], "bloomsLevel": "UNDERSTAND"}],
  "citations": []
}
`, governance)

            const result = await multiAI.streamChat([
                { role: 'system', content: 'You are an educational content analyzer. Analyze course materials for academic use.' },
                { role: 'user', content: prompt },
            ])

            // Read stream
            const reader = result.stream.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                fullText += decoder.decode(value, { stream: true })
            }

            // Parse AI response
            let analysis
            try {
                const jsonMatch = fullText.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0])
                }
            } catch {
                analysis = { summary: fullText, topics: [], concepts: [], citations: [] }
            }

            // Update evidence item
            await prisma.evidenceKitItem.update({
                where: { id: evidenceId },
                data: {
                    contentSummary: analysis.summary || null,
                    topicsIdentified: JSON.stringify(analysis.topics || []),
                    conceptsMapping: JSON.stringify(analysis.concepts || []),
                    citationsFound: JSON.stringify(analysis.citations || []),
                    isProcessed: true,
                    processingStatus: 'COMPLETED',
                },
            })
        } catch (error) {
            await prisma.evidenceKitItem.update({
                where: { id: evidenceId },
                data: {
                    processingStatus: 'FAILED',
                    processingError: error instanceof Error ? error.message : 'Processing failed',
                },
            })
        }
    }

    /**
     * Get all evidence items for a course
     */
    async getEvidenceKit(courseDesignId: string) {
        return await prisma.evidenceKitItem.findMany({
            where: { courseDesignId },
            orderBy: { createdAt: 'desc' },
        })
    }

    // ===========================================================================
    // PHASE 2: AI Analysis of Content
    // ===========================================================================

    /**
     * Analyze all evidence items and build content map
     */
    async analyzeContent(courseDesignId: string, userId: string): Promise<ContentAnalysis> {
        const courseDesign = await prisma.courseDesignMetadata.findUnique({
            where: { id: courseDesignId },
            include: { evidenceItems: { where: { isProcessed: true } } },
        })

        if (!courseDesign) throw new Error('Course design not found')

        const governance = this.governance.buildGovernanceContext({
            formattingStandard: courseDesign.formattingStandard as FormattingStandard,
            academicLevel: courseDesign.academicLevel as AcademicLevel,
            termLength: courseDesign.termLength,
        })

        // Combine evidence summaries
        const evidenceSummaries = courseDesign.evidenceItems.map(e => ({
            id: e.id,
            title: e.title,
            summary: e.contentSummary,
            topics: JSON.parse(e.topicsIdentified || '[]'),
        }))

        const prompt = this.governance.governPrompt(`
Based on the following course materials, provide a comprehensive content analysis:

COURSE MATERIALS:
${evidenceSummaries.map(e => `
- ${e.title}:
  Summary: ${e.summary}
  Topics: ${e.topics.join(', ')}
`).join('\n')}

PROVIDE:

1. MAIN TOPICS (with importance ranking):
   - Identify major themes across all materials

2. CONCEPT GRAPH:
   - Show relationships between concepts
   - Identify prerequisites

3. COVERAGE GAPS:
   - What topics might be missing?
   - What needs more depth?

4. CONTENT OVERLAPS:
   - Where do materials cover the same topics?
   - Recommendations for consolidation

5. SUGGESTED WEEKLY STRUCTURE:
   - Recommend which materials for which weeks
   - Based on ${courseDesign.termLength} week term

Respond in JSON format.
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are an educational curriculum designer. Analyze course content for optimal learning structure.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
        }

        await this.logAudit(courseDesignId, userId, 'AI_GENERATE', 'content_analysis', undefined, undefined, undefined, result.provider)

        // Parse and return analysis
        let analysis: ContentAnalysis
        try {
            const jsonMatch = fullText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                analysis = {
                    courseDesignId,
                    analyzedAt: new Date(),
                    mainTopics: parsed.mainTopics || [],
                    conceptGraph: parsed.conceptGraph || [],
                    coverageGaps: parsed.coverageGaps || [],
                    overlaps: parsed.contentOverlaps || [],
                    citationGraph: [],
                    referenceMap: [],
                }
            } else {
                throw new Error('Could not parse analysis')
            }
        } catch {
            analysis = {
                courseDesignId,
                analyzedAt: new Date(),
                mainTopics: [],
                conceptGraph: [],
                coverageGaps: [],
                overlaps: [],
                citationGraph: [],
                referenceMap: [],
            }
        }

        return analysis
    }

    // ===========================================================================
    // PHASE 3: Generate Objectives
    // ===========================================================================

    /**
     * Generate Bloom's-aligned learning objectives
     */
    async generateObjectives(
        courseDesignId: string,
        userId: string,
        options?: {
            targetCount?: number
            bloomsDistribution?: Partial<Record<BloomsLevel, number>>
            evidenceItemIds?: string[]
        }
    ): Promise<CourseObjective[]> {
        const courseDesign = await prisma.courseDesignMetadata.findUnique({
            where: { id: courseDesignId },
            include: {
                course: true,
                evidenceItems: {
                    where: options?.evidenceItemIds
                        ? { id: { in: options.evidenceItemIds } }
                        : { isProcessed: true }
                },
                courseObjectives: { orderBy: { orderIndex: 'asc' } },
            },
        })

        if (!courseDesign) throw new Error('Course design not found')

        const creditHours = courseDesign.creditHours ?? 3

        const governance = this.governance.buildGovernanceContext({
            formattingStandard: courseDesign.formattingStandard as FormattingStandard,
            academicLevel: courseDesign.academicLevel as AcademicLevel,
            creditHours,
            learningModel: courseDesign.learningModel as any,
        })

        const targetCount = options?.targetCount || Math.max(5, creditHours * 3)

        const bloomsGuide = {
            REMEMBER: 'recall, recognize, list, define, identify',
            UNDERSTAND: 'explain, describe, summarize, interpret, classify',
            APPLY: 'apply, demonstrate, use, implement, solve',
            ANALYZE: 'analyze, compare, contrast, differentiate, examine',
            EVALUATE: 'evaluate, assess, critique, judge, justify',
            CREATE: 'create, design, develop, construct, produce',
        }

        const evidenceContext = courseDesign.evidenceItems.map(e =>
            `- ${e.title}: ${e.contentSummary || 'No summary'}`
        ).join('\n')

        const prompt = this.governance.governPrompt(`
Generate ${targetCount} learning objectives for this course.

COURSE: ${courseDesign.course.title}
ACADEMIC LEVEL: ${courseDesign.academicLevel}
CREDIT HOURS: ${courseDesign.creditHours}
LEARNING MODEL: ${courseDesign.learningModel}

EVIDENCE KIT MATERIALS:
${evidenceContext}

BLOOM'S TAXONOMY VERBS:
${Object.entries(bloomsGuide).map(([level, verbs]) => `${level}: ${verbs}`).join('\n')}

REQUIREMENTS:
1. Number objectives hierarchically (1.1, 1.2, 2.1, etc.)
2. Each objective MUST start with a Bloom's verb
3. Align with ${courseDesign.academicLevel} academic rigor
4. Reference specific evidence materials where applicable
5. Distribute across Bloom's levels appropriately for academic level:
   - Undergraduate: More Remember/Understand/Apply
   - Graduate: More Analyze/Evaluate
   - Doctoral: More Evaluate/Create

Respond in JSON array format:
[
  {
    "objectiveNumber": "1.1",
    "description": "Upon completion, students will be able to...",
    "bloomsLevel": "UNDERSTAND",
    "suggestedAssessment": "Quiz, assignment, or project type",
    "evidenceReference": "Material title that supports this"
  }
]
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are an expert curriculum designer specializing in learning outcome development.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
        }

        await this.logAudit(courseDesignId, userId, 'AI_GENERATE', 'objectives', undefined, undefined, undefined, result.provider)

        // Parse objectives
        let generatedObjectives: any[] = []
        try {
            const jsonMatch = fullText.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                generatedObjectives = JSON.parse(jsonMatch[0])
            }
        } catch {
            console.error('Failed to parse objectives')
        }

        // Save to database
        const savedObjectives: CourseObjective[] = []
        for (let i = 0; i < generatedObjectives.length; i++) {
            const obj = generatedObjectives[i]
            const saved = await prisma.courseObjective.create({
                data: {
                    courseDesignId,
                    objectiveNumber: obj.objectiveNumber || `${Math.floor(i / 3) + 1}.${(i % 3) + 1}`,
                    description: obj.description,
                    bloomsLevel: obj.bloomsLevel || 'UNDERSTAND',
                    assessmentMethod: obj.suggestedAssessment,
                    sourceEvidence: obj.evidenceReference,
                    isAIGenerated: true,
                    orderIndex: i,
                },
            })
            savedObjectives.push(saved as unknown as CourseObjective)
        }

        return savedObjectives
    }

    // ===========================================================================
    // PHASE 3.2: Suggest Curriculum
    // ===========================================================================

    /**
     * Generate suggested curriculum structure
     */
    async suggestCurriculum(
        courseDesignId: string,
        userId: string
    ): Promise<CourseDesignSection[]> {
        const courseDesign = await prisma.courseDesignMetadata.findUnique({
            where: { id: courseDesignId },
            include: {
                course: true,
                evidenceItems: { where: { isProcessed: true } },
                courseObjectives: { orderBy: { orderIndex: 'asc' } },
            },
        })

        if (!courseDesign) throw new Error('Course design not found')

        const weeklyWorkloadHours = courseDesign.weeklyWorkloadHours ?? 9

        const governance = this.governance.buildGovernanceContext({
            formattingStandard: courseDesign.formattingStandard as FormattingStandard,
            academicLevel: courseDesign.academicLevel as AcademicLevel,
            termLength: courseDesign.termLength,
            deliveryMode: courseDesign.deliveryMode as any,
            weeklyWorkloadHours,
        })

        const objectivesContext = courseDesign.courseObjectives.map(o =>
            `${o.objectiveNumber}: ${o.description} (${o.bloomsLevel})`
        ).join('\n')

        const evidenceContext = courseDesign.evidenceItems.map(e =>
            `- ${e.title}: ${JSON.parse(e.topicsIdentified || '[]').slice(0, 5).join(', ')}`
        ).join('\n')

        const prompt = this.governance.governPrompt(`
Design a ${courseDesign.termLength}-week curriculum structure for this course.

COURSE: ${courseDesign.course.title}
ACADEMIC LEVEL: ${courseDesign.academicLevel}
DELIVERY MODE: ${courseDesign.deliveryMode}
WEEKLY WORKLOAD: ${courseDesign.weeklyWorkloadHours} hours

LEARNING OBJECTIVES:
${objectivesContext}

AVAILABLE MATERIALS:
${evidenceContext}

REQUIREMENTS:
1. Create ${courseDesign.termLength} weekly modules
2. Each week should map to specific objectives
3. Reference appropriate evidence materials
4. Include variety: lectures, readings, discussions, assignments
5. Build difficulty progressively
6. Account for major assessments (midterm, final if applicable)
7. Include buffer/review weeks as appropriate

Respond in JSON format:
[
  {
    "weekNumber": 1,
    "title": "Week title",
    "description": "Overview of the week",
    "learningOutcomes": ["1.1", "1.2"],
    "contents": [
      { "type": "LECTURE", "title": "...", "durationMinutes": 50 },
      { "type": "READING", "title": "...", "source": "Evidence item title" },
      { "type": "DISCUSSION", "title": "..." },
      { "type": "ASSIGNMENT", "title": "...", "points": 10 }
    ]
  }
]
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are an expert curriculum designer specializing in course structure and pacing.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
        }

        await this.logAudit(courseDesignId, userId, 'AI_GENERATE', 'curriculum', undefined, undefined, undefined, result.provider)

        // Parse curriculum
        let curriculum: any[] = []
        try {
            const jsonMatch = fullText.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                curriculum = JSON.parse(jsonMatch[0])
            }
        } catch {
            console.error('Failed to parse curriculum')
        }

        // Save sections to database
        const savedSections: CourseDesignSection[] = []
        for (let i = 0; i < curriculum.length; i++) {
            const week = curriculum[i]
            const section = await prisma.courseDesignSection.create({
                data: {
                    courseDesignId,
                    title: week.title,
                    description: week.description,
                    sectionType: 'WEEK',
                    weekNumber: week.weekNumber || i + 1,
                    orderIndex: i,
                    learningOutcomes: JSON.stringify(week.learningOutcomes || []),
                    durationMinutes: week.contents?.reduce((sum: number, c: any) => sum + (c.durationMinutes || 0), 0),
                },
            })

            // Add contents
            if (week.contents) {
                for (let j = 0; j < week.contents.length; j++) {
                    const content = week.contents[j]
                    await prisma.sectionContent.create({
                        data: {
                            sectionId: section.id,
                            contentType: content.type || 'LECTURE',
                            title: content.title,
                            description: content.description,
                            isAIGenerated: true,
                            orderIndex: j,
                            isRequired: content.type !== 'RESOURCE',
                            points: content.points,
                        },
                    })
                }
            }

            savedSections.push(section as unknown as CourseDesignSection)
        }

        return savedSections
    }

    // ===========================================================================
    // PHASE 6: Create Lecture Notes
    // ===========================================================================

    /**
     * Generate lecture notes for a section
     */
    async generateLectureNotes(
        sectionId: string,
        userId: string,
        options?: {
            tone?: 'formal' | 'conversational' | 'academic'
            length?: 'brief' | 'moderate' | 'comprehensive'
            includeExamples?: boolean
        }
    ) {
        const section = await prisma.courseDesignSection.findUnique({
            where: { id: sectionId },
            include: {
                courseDesign: { include: { evidenceItems: true, course: true } },
                contents: true,
            },
        })

        if (!section) throw new Error('Section not found')

        const governance = this.governance.buildGovernanceContext({
            formattingStandard: section.courseDesign.formattingStandard as FormattingStandard,
            academicLevel: section.courseDesign.academicLevel as AcademicLevel,
        })

        const evidenceContext = section.courseDesign.evidenceItems
            .filter(e => e.isProcessed)
            .map(e => `${e.title}: ${e.contentSummary}`)
            .join('\n\n')

        const tone = options?.tone || 'academic'
        const length = options?.length || 'moderate'

        const prompt = this.governance.governPrompt(`
Create structured lecture notes for:

COURSE: ${section.courseDesign.course.title}
SECTION: Week ${section.weekNumber} - ${section.title}
DESCRIPTION: ${section.description}
TONE: ${tone}
LENGTH: ${length}

RELEVANT COURSE MATERIALS:
${evidenceContext}

REQUIREMENTS:
1. Use structured headings and subheadings
2. Include key concepts with explanations
3. Add ${options?.includeExamples ? 'practical examples' : 'minimal examples'}
4. Include in-text citations using ${section.courseDesign.formattingStandard} format
5. Add discussion questions at the end
6. Include summary/key takeaways

Provide ONLY the lecture notes content (HTML/Markdown format).
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are an expert educator creating lecture materials. Write in clear, educational prose.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let lectureNotes = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            lectureNotes += decoder.decode(value, { stream: true })
        }

        // Find or create lecture content in section
        const lectureContent = section.contents.find(c => c.contentType === 'LECTURE')

        if (lectureContent) {
            await prisma.sectionContent.update({
                where: { id: lectureContent.id },
                data: {
                    aiGeneratedContent: lectureNotes,
                    isAIGenerated: true,
                    aiDisclosureAdded: true,
                },
            })
        } else {
            await prisma.sectionContent.create({
                data: {
                    sectionId,
                    contentType: 'LECTURE',
                    title: `Lecture: ${section.title}`,
                    aiGeneratedContent: lectureNotes,
                    isAIGenerated: true,
                    orderIndex: 0,
                    aiDisclosureAdded: true,
                },
            })
        }

        await this.logAudit(section.courseDesignId, userId, 'AI_GENERATE', 'lecture_notes', sectionId, undefined, undefined, result.provider)

        return lectureNotes
    }

    // ===========================================================================
    // PHASE 6: Design Assessments
    // ===========================================================================

    /**
     * Generate assessment with rubric
     */
    async designAssessment(
        sectionContentId: string,
        userId: string,
        assessmentType: 'assignment' | 'quiz' | 'project' | 'discussion'
    ): Promise<AssessmentRubric> {
        const content = await prisma.sectionContent.findUnique({
            where: { id: sectionContentId },
            include: {
                section: {
                    include: {
                        courseDesign: {
                            include: { courseObjectives: true },
                        },
                    },
                },
            },
        })

        if (!content) throw new Error('Content not found')

        const courseDesign = content.section.courseDesign
        const governance = this.governance.buildGovernanceContext({
            formattingStandard: courseDesign.formattingStandard as FormattingStandard,
            academicLevel: courseDesign.academicLevel as AcademicLevel,
            aiUsagePolicy: courseDesign.aiUsagePolicy as any,
        })

        const objectives = courseDesign.courseObjectives
            .filter(o => {
                const aligned = JSON.parse(content.section.learningOutcomes || '[]')
                return aligned.includes(o.objectiveNumber)
            })
            .map(o => `${o.objectiveNumber}: ${o.description}`)
            .join('\n')

        const prompt = this.governance.governPrompt(`
Design a ${assessmentType} for:

SECTION: ${content.section.title}
CONTENT: ${content.title}
ACADEMIC LEVEL: ${courseDesign.academicLevel}

ALIGNED OBJECTIVES:
${objectives || 'General course objectives'}

AI USAGE POLICY: ${courseDesign.aiUsagePolicy}

REQUIREMENTS:
1. Create clear ${assessmentType} instructions
2. Generate a rubric with 4-5 criteria
3. Each criterion has 4 performance levels
4. Total points: ${content.points || 100}
5. Align directly with objectives
6. Include AI disclosure statement if applicable

Respond in JSON format:
{
  "title": "Assessment title",
  "instructions": "Detailed instructions...",
  "rubric": {
    "criteria": [
      {
        "name": "Criterion name",
        "description": "What this measures",
        "weight": 25,
        "levels": [
          { "level": 4, "label": "Excellent", "description": "...", "points": 25 },
          { "level": 3, "label": "Good", "description": "...", "points": 20 },
          { "level": 2, "label": "Satisfactory", "description": "...", "points": 15 },
          { "level": 1, "label": "Needs Improvement", "description": "...", "points": 10 }
        ]
      }
    ]
  },
  "aiDisclosure": "AI disclosure statement if needed"
}
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are an assessment design expert specializing in rubric-based evaluation.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
        }

        let assessment
        try {
            const jsonMatch = fullText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                assessment = JSON.parse(jsonMatch[0])
            }
        } catch {
            throw new Error('Failed to parse assessment')
        }

        // Save rubric
        const rubric = await prisma.assessmentRubric.upsert({
            where: { sectionContentId },
            create: {
                sectionContentId,
                title: assessment.title || content.title,
                description: assessment.instructions,
                totalPoints: content.points || 100,
                criteria: JSON.stringify(assessment.rubric?.criteria || []),
                isAIGenerated: true,
                alignedObjectives: JSON.stringify(content.section.learningOutcomes || '[]'),
            },
            update: {
                title: assessment.title || content.title,
                description: assessment.instructions,
                criteria: JSON.stringify(assessment.rubric?.criteria || []),
            },
        })

        // Update content with AI disclosure
        if (assessment.aiDisclosure) {
            await prisma.sectionContent.update({
                where: { id: sectionContentId },
                data: { aiDisclosureAdded: true },
            })
        }

        await this.logAudit(courseDesign.id, userId, 'AI_GENERATE', 'assessment', sectionContentId, undefined, undefined, result.provider)

        return rubric as unknown as AssessmentRubric
    }

    // ===========================================================================
    // PHASE 7: Create Syllabus
    // ===========================================================================

    /**
     * Generate comprehensive syllabus
     */
    async generateSyllabus(
        courseDesignId: string,
        userId: string
    ): Promise<SyllabusVersion> {
        const courseDesign = await prisma.courseDesignMetadata.findUnique({
            where: { id: courseDesignId },
            include: {
                course: true,
                courseObjectives: { orderBy: { orderIndex: 'asc' } },
                courseSections: {
                    orderBy: { orderIndex: 'asc' },
                    include: { contents: { orderBy: { orderIndex: 'asc' } } },
                },
                syllabusVersions: { orderBy: { version: 'desc' }, take: 1 },
            },
        })

        if (!courseDesign) throw new Error('Course design not found')

        const governance = this.governance.buildGovernanceContext({
            formattingStandard: courseDesign.formattingStandard as FormattingStandard,
            academicLevel: courseDesign.academicLevel as AcademicLevel,
            aiUsagePolicy: courseDesign.aiUsagePolicy as any,
        })

        const nextVersion = (courseDesign.syllabusVersions[0]?.version || 0) + 1

        const objectivesText = courseDesign.courseObjectives
            .map(o => `${o.objectiveNumber}. ${o.description}`)
            .join('\n')

        const scheduleText = courseDesign.courseSections
            .map(s => {
                const contents = s.contents.map(c => `  - ${c.title} (${c.contentType})`).join('\n')
                return `Week ${s.weekNumber}: ${s.title}\n${contents}`
            })
            .join('\n\n')

        const assessmentWeight = courseDesign.assessmentWeighting
            ? JSON.parse(courseDesign.assessmentWeighting)
            : { assignments: 40, exams: 30, participation: 15, projects: 15 }

        const prompt = this.governance.governPrompt(`
Generate a complete academic syllabus for:

COURSE INFORMATION:
- Title: ${courseDesign.course.title}
- Code: ${courseDesign.course.code || 'TBD'}
- Credits: ${courseDesign.creditHours}
- Academic Level: ${courseDesign.academicLevel}
- Term: ${courseDesign.course.term || 'Current'}
- Delivery Mode: ${courseDesign.deliveryMode}

LEARNING OBJECTIVES:
${objectivesText}

COURSE SCHEDULE:
${scheduleText}

ASSESSMENT WEIGHTS:
${Object.entries(assessmentWeight).map(([k, v]) => `${k}: ${v}%`).join(', ')}

AI USAGE POLICY: ${courseDesign.aiUsagePolicy}
FORMATTING STANDARD: ${courseDesign.formattingStandard}
ACCESSIBILITY: ${courseDesign.accessibilityRequired ? 'Required' : 'Recommended'}

REQUIREMENTS:
1. Generate complete syllabus in Markdown format
2. Include all standard sections:
   - Course Information
   - Instructor Information (placeholder)
   - Course Description
   - Learning Objectives
   - Required Materials
   - Course Schedule
   - Assessment & Grading
   - Course Policies (attendance, late work, academic integrity)
   - AI Usage Policy (detailed)
   - Accessibility Statement
   - Support Resources
3. Use ${courseDesign.formattingStandard} formatting
4. Professional academic tone

Generate the complete syllabus document.
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are an expert academic administrator creating official course syllabi.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let syllabusContent = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            syllabusContent += decoder.decode(value, { stream: true })
        }

        // Create syllabus version
        const syllabus = await prisma.syllabusVersion.create({
            data: {
                courseDesignId,
                version: nextVersion,
                status: 'DRAFT',
                content: syllabusContent,
                compiledFrom: JSON.stringify({
                    courseDetails: true,
                    objectives: courseDesign.courseObjectives.map(o => o.id),
                    sections: courseDesign.courseSections.map(s => s.id),
                    assessments: [],
                }),
                academicPolicies: JSON.stringify([
                    { type: 'integrity', title: 'Academic Integrity', content: 'Standard policy' },
                    { type: 'ai_usage', title: 'AI Usage Policy', content: courseDesign.aiUsagePolicy },
                ]),
                aiDisclosure: courseDesign.aiUsagePolicy === 'PERMITTED_WITH_DISCLOSURE'
                    ? 'This course permits AI tool usage with proper disclosure and citation.'
                    : null,
                accessibilityStatement: courseDesign.accessibilityRequired
                    ? 'This course is designed to be accessible. Contact instructor for accommodations.'
                    : null,
            },
        })

        await this.logAudit(courseDesignId, userId, 'AI_GENERATE', 'syllabus', syllabus.id, undefined, undefined, result.provider)

        return syllabus as unknown as SyllabusVersion
    }

    // ===========================================================================
    // PHASE 8: Ready-Check Validation
    // ===========================================================================

    /**
     * Run comprehensive ready-check validation
     */
    async runReadyCheck(courseDesignId: string, userId: string): Promise<ReadyCheckReport> {
        const courseDesign = await prisma.courseDesignMetadata.findUnique({
            where: { id: courseDesignId },
            include: {
                courseObjectives: true,
                courseSections: { include: { contents: true } },
                syllabusVersions: { orderBy: { version: 'desc' }, take: 1 },
                evidenceItems: true,
            },
        })

        if (!courseDesign) throw new Error('Course design not found')

        const checks: ReadyCheckResult[] = []

        // 1. Objective Coverage Check
        const objectiveCoverage = await this.checkObjectiveCoverage(courseDesign)
        checks.push(objectiveCoverage)

        // 2. Citation Compliance Check
        const citationCheck = await this.checkCitationCompliance(courseDesign)
        checks.push(citationCheck)

        // 3. Accessibility Check
        const accessibilityCheck = await this.checkAccessibility(courseDesign)
        checks.push(accessibilityCheck)

        // 4. AI Disclosure Check
        const aiDisclosureCheck = await this.checkAIDisclosure(courseDesign)
        checks.push(aiDisclosureCheck)

        // 5. Policy Completeness Check
        const policyCheck = await this.checkPolicyCompleteness(courseDesign)
        checks.push(policyCheck)

        // 6. Workload Balance Check
        const workloadCheck = await this.checkWorkloadBalance(courseDesign)
        checks.push(workloadCheck)

        // Save results
        for (const check of checks) {
            await prisma.readyCheckResult.create({
                data: {
                    courseDesignId,
                    checkType: check.checkType,
                    status: check.status,
                    score: check.score,
                    issues: JSON.stringify(check.issues),
                    suggestions: JSON.stringify(check.suggestions),
                    details: check.details,
                },
            })
        }

        // Calculate overall
        const criticalFails = checks.filter(c => c.status === 'FAILED')
        const warnings = checks.filter(c => c.status === 'WARNING')
        const avgScore = checks.reduce((sum, c) => sum + (c.score || 0), 0) / checks.length

        const overallStatus: ReadyCheckStatus =
            criticalFails.length > 0 ? 'FAILED' :
                warnings.length > 0 ? 'WARNING' : 'PASSED'

        const report: ReadyCheckReport = {
            courseDesignId,
            overallStatus,
            overallScore: avgScore,
            checks,
            summary: `Ready-check completed: ${checks.filter(c => c.status === 'PASSED').length}/${checks.length} passed`,
            canPublish: criticalFails.length === 0,
            blockers: criticalFails.map(c => `${c.checkType}: ${c.issues[0]?.message || 'Failed'}`),
            createdAt: new Date(),
        }

        await this.logAudit(courseDesignId, userId, 'AI_GENERATE', 'ready_check', undefined, undefined, JSON.stringify(report))

        return report
    }

    private async checkObjectiveCoverage(courseDesign: any): Promise<ReadyCheckResult> {
        const objectives = courseDesign.courseObjectives
        const sections = courseDesign.courseSections

        const coveredObjectives = new Set<string>()
        for (const section of sections) {
            const outcomes = JSON.parse(section.learningOutcomes || '[]')
            outcomes.forEach((o: string) => coveredObjectives.add(o))
        }

        const uncovered = objectives.filter((o: any) => !coveredObjectives.has(o.objectiveNumber))
        const coveragePercent = ((objectives.length - uncovered.length) / objectives.length) * 100

        return {
            id: '',
            courseDesignId: courseDesign.id,
            checkType: 'OBJECTIVE_COVERAGE',
            status: coveragePercent >= 90 ? 'PASSED' : coveragePercent >= 70 ? 'WARNING' : 'FAILED',
            score: coveragePercent,
            issues: uncovered.map((o: any) => ({
                severity: 'warning' as const,
                message: `Objective ${o.objectiveNumber} not addressed in any section`,
                objectId: o.id,
            })),
            suggestions: uncovered.length > 0 ? [{
                type: 'add' as const,
                message: 'Add sections or content addressing uncovered objectives',
                autoFixAvailable: false,
            }] : [],
            createdAt: new Date(),
        }
    }

    private async checkCitationCompliance(courseDesign: any): Promise<ReadyCheckResult> {
        const sections = courseDesign.courseSections
        let contentWithCitations = 0
        let totalContent = 0

        for (const section of sections) {
            for (const content of section.contents) {
                if (content.aiGeneratedContent || content.content) {
                    totalContent++
                    if (content.citationRequired === false || content.aiGeneratedContent?.includes('(') || content.content?.includes('(')) {
                        contentWithCitations++
                    }
                }
            }
        }

        const compliancePercent = totalContent > 0 ? (contentWithCitations / totalContent) * 100 : 100

        return {
            id: '',
            courseDesignId: courseDesign.id,
            checkType: 'CITATION_COMPLIANCE',
            status: compliancePercent >= 80 ? 'PASSED' : compliancePercent >= 60 ? 'WARNING' : 'FAILED',
            score: compliancePercent,
            issues: compliancePercent < 80 ? [{
                severity: 'warning' as const,
                message: `Only ${compliancePercent.toFixed(0)}% of content has proper citations`,
            }] : [],
            suggestions: [{
                type: 'review' as const,
                message: 'Review content for proper citation format',
                autoFixAvailable: false,
            }],
            createdAt: new Date(),
        }
    }

    private async checkAccessibility(courseDesign: any): Promise<ReadyCheckResult> {
        // Simplified accessibility check
        const issues = []

        if (!courseDesign.accessibilityRequired) {
            issues.push({
                severity: 'info' as const,
                message: 'Accessibility not marked as required',
            })
        }

        return {
            id: '',
            courseDesignId: courseDesign.id,
            checkType: 'ACCESSIBILITY_WCAG',
            status: issues.length === 0 ? 'PASSED' : 'WARNING',
            score: issues.length === 0 ? 100 : 80,
            issues,
            suggestions: [{
                type: 'review' as const,
                message: 'Ensure all content meets WCAG 2.1 AA standards',
                autoFixAvailable: false,
            }],
            createdAt: new Date(),
        }
    }

    private async checkAIDisclosure(courseDesign: any): Promise<ReadyCheckResult> {
        const sections = courseDesign.courseSections
        let aiContent = 0
        let disclosedContent = 0

        for (const section of sections) {
            for (const content of section.contents) {
                if (content.isAIGenerated) {
                    aiContent++
                    if (content.aiDisclosureAdded) {
                        disclosedContent++
                    }
                }
            }
        }

        const disclosurePercent = aiContent > 0 ? (disclosedContent / aiContent) * 100 : 100

        return {
            id: '',
            courseDesignId: courseDesign.id,
            checkType: 'AI_DISCLOSURE',
            status: disclosurePercent === 100 ? 'PASSED' : disclosurePercent >= 80 ? 'WARNING' : 'FAILED',
            score: disclosurePercent,
            issues: disclosurePercent < 100 ? [{
                severity: courseDesign.aiUsagePolicy === 'PERMITTED_WITH_DISCLOSURE' ? 'critical' as const : 'warning' as const,
                message: `${aiContent - disclosedContent} AI-generated items missing disclosure`,
            }] : [],
            suggestions: [{
                type: 'add' as const,
                message: 'Add AI disclosure to all AI-generated content',
                autoFixAvailable: true,
                autoFixAction: 'add_ai_disclosure',
            }],
            createdAt: new Date(),
        }
    }

    private async checkPolicyCompleteness(courseDesign: any): Promise<ReadyCheckResult> {
        const syllabus = courseDesign.syllabusVersions[0]
        const issues = []

        if (!syllabus) {
            issues.push({
                severity: 'critical' as const,
                message: 'No syllabus generated',
            })
        } else {
            const policies = JSON.parse(syllabus.academicPolicies || '[]')
            const requiredPolicies = ['integrity', 'ai_usage']

            for (const required of requiredPolicies) {
                if (!policies.find((p: any) => p.type === required)) {
                    issues.push({
                        severity: 'warning' as const,
                        message: `Missing ${required} policy`,
                    })
                }
            }
        }

        return {
            id: '',
            courseDesignId: courseDesign.id,
            checkType: 'POLICY_COMPLETENESS',
            status: issues.find(i => i.severity === 'critical') ? 'FAILED' : issues.length > 0 ? 'WARNING' : 'PASSED',
            score: issues.length === 0 ? 100 : 70,
            issues,
            suggestions: [],
            createdAt: new Date(),
        }
    }

    private async checkWorkloadBalance(courseDesign: any): Promise<ReadyCheckResult> {
        const sections = courseDesign.courseSections
        const expectedHours = courseDesign.weeklyWorkloadHours || 9
        const issues = []

        for (const section of sections) {
            const totalMinutes = section.durationMinutes ||
                section.contents.reduce((sum: number, c: any) => sum + (c.durationMinutes || 30), 0)
            const hours = totalMinutes / 60

            if (hours > expectedHours * 1.5) {
                issues.push({
                    severity: 'warning' as const,
                    message: `Week ${section.weekNumber} exceeds expected workload (${hours.toFixed(1)}h vs ${expectedHours}h)`,
                    location: `Week ${section.weekNumber}`,
                })
            } else if (hours < expectedHours * 0.5) {
                issues.push({
                    severity: 'info' as const,
                    message: `Week ${section.weekNumber} may have light workload (${hours.toFixed(1)}h vs ${expectedHours}h)`,
                    location: `Week ${section.weekNumber}`,
                })
            }
        }

        return {
            id: '',
            courseDesignId: courseDesign.id,
            checkType: 'WORKLOAD_BALANCE',
            status: issues.filter(i => i.severity === 'warning').length > sections.length / 3 ? 'WARNING' : 'PASSED',
            score: 100 - (issues.filter(i => i.severity === 'warning').length * 10),
            issues,
            suggestions: issues.length > 0 ? [{
                type: 'modify' as const,
                message: 'Rebalance content across weeks for consistent workload',
                autoFixAvailable: false,
            }] : [],
            createdAt: new Date(),
        }
    }

    // ===========================================================================
    // PHASE 9: Publish
    // ===========================================================================

    /**
     * Publish course design
     */
    async publishCourse(courseDesignId: string, userId: string) {
        // Run final ready check
        const readyCheck = await this.runReadyCheck(courseDesignId, userId)

        if (!readyCheck.canPublish) {
            return {
                success: false,
                error: 'Cannot publish: Ready-check failed',
                blockers: readyCheck.blockers,
            }
        }

        // Lock the course design
        const courseDesign = await prisma.courseDesignMetadata.update({
            where: { id: courseDesignId },
            data: {
                isLocked: true,
                lockedAt: new Date(),
                lockedBy: userId,
                versionId: `v${Date.now()}`,
            },
            include: {
                course: {
                    include: {
                        instructor: true,
                        enrollments: { include: { user: true } },
                        modules: true,
                    }
                },
                syllabusVersions: { where: { status: 'DRAFT' }, take: 1 },
                courseObjectives: true,
            }
        })

        // Mark syllabus as published
        await prisma.syllabusVersion.updateMany({
            where: { courseDesignId, status: 'DRAFT' },
            data: { status: 'PUBLISHED', isApproved: true, approvedBy: userId, approvedAt: new Date() },
        })

        // Mark sections as published
        await prisma.courseDesignSection.updateMany({
            where: { courseDesignId },
            data: { isPublished: true },
        })

        // Generate exports (PDF, Word, PPTX)
        let exportUrls: { pdfUrl?: string; wordUrl?: string; pptxUrl?: string } = {}
        try {
            const syllabus = courseDesign.syllabusVersions[0]
            let syllabusContent: Record<string, any> | undefined
            if (syllabus?.content) {
                try {
                    syllabusContent = typeof syllabus.content === 'string'
                        ? JSON.parse(syllabus.content)
                        : syllabus.content as Record<string, any>
                } catch { syllabusContent = undefined }
            }

            const exportData: SyllabusExportData = {
                courseTitle: courseDesign.course.title,
                courseCode: courseDesign.course.code || undefined,
                semester: syllabusContent?.semester,
                instructor: {
                    name: courseDesign.course.instructor.name || 'Instructor',
                    email: courseDesign.course.instructor.email,
                    office: syllabusContent?.instructorInfo?.office,
                    officeHours: syllabusContent?.instructorInfo?.officeHours,
                },
                description: courseDesign.course.description || undefined,
                objectives: courseDesign.courseObjectives.map(o => o.description),
                modules: courseDesign.course.modules.map((m, i) => ({
                    title: m.title,
                    week: i + 1,
                    topics: m.description ? [m.description] : [],
                })),
                gradingPolicy: syllabusContent?.gradingPolicy,
                policies: syllabusContent?.policies,
            }

            const exports = await exportService.exportSyllabusAll(exportData)

            if (exports.pdf.success) exportUrls.pdfUrl = exports.pdf.url
            if (exports.docx.success) exportUrls.wordUrl = exports.docx.url
            if (exports.pptx.success) exportUrls.pptxUrl = exports.pptx.url

            // Update syllabus version with export URLs
            if (syllabus) {
                await prisma.syllabusVersion.update({
                    where: { id: syllabus.id },
                    data: { pdfUrl: exportUrls.pdfUrl, wordUrl: exportUrls.wordUrl },
                })
            }
        } catch (exportError) {
            console.error('[PublishCourse] Export error:', exportError)
        }

        // Send notifications to enrolled students
        let notificationResult = { sent: 0, failed: 0, total: 0 }
        try {
            const result = await notificationService.notifyCoursePublished(
                courseDesign.course.id,
                userId
            )
            notificationResult = { sent: result.sent, failed: result.failed, total: result.total }
        } catch (notifyError) {
            console.error('[PublishCourse] Notification error:', notifyError)
        }

        await this.logAudit(courseDesignId, userId, 'PUBLISH', 'course_design', courseDesignId)

        return {
            success: true,
            publishedAt: new Date(),
            version: courseDesign.versionId,
            exports: exportUrls,
            notifications: {
                sent: notificationResult.sent,
                failed: notificationResult.failed,
                total: notificationResult.total,
            },
        }
    }

    // ===========================================================================
    // ASK PROFESSOR GENIE
    // ===========================================================================

    /**
     * Handle Ask Professor GENIE query
     */
    async askGenie(query: GenieQuery, userId: string): Promise<GenieResponse> {
        const courseDesign = await prisma.courseDesignMetadata.findFirst({
            where: { courseId: query.courseId },
            include: {
                course: true,
                evidenceItems: { where: { isProcessed: true } },
                courseObjectives: true,
                courseSections: { include: { contents: true } },
            },
        })

        if (!courseDesign) {
            return {
                message: "I couldn't find the course design. Please ensure the course is set up first.",
                suggestedActions: [{ type: 'navigate', label: 'Set up course', target: '/course-details' }],
                references: [],
                followUpQuestions: [],
            }
        }

        const governance = this.governance.buildGovernanceContext({
            formattingStandard: courseDesign.formattingStandard as FormattingStandard,
            academicLevel: courseDesign.academicLevel as AcademicLevel,
            termLength: courseDesign.termLength,
        })

        // Build context about current course state
        const courseContext = `
COURSE: ${courseDesign.course.title}
CURRENT PHASE: ${query.context.currentPhase}
ACADEMIC LEVEL: ${courseDesign.academicLevel}
TERM LENGTH: ${courseDesign.termLength} weeks

COURSE STATE:
- Evidence Items: ${courseDesign.evidenceItems.length} uploaded
- Objectives: ${courseDesign.courseObjectives.length} defined
- Sections: ${courseDesign.courseSections.length} created

${query.context.currentSectionId ? `CURRENT SECTION: ${courseDesign.courseSections.find(s => s.id === query.context.currentSectionId)?.title}` : ''}

AVAILABLE TOOLS:
- Generate Objectives
- Suggest Curriculum  
- Create Lecture Notes
- Design Assessments
- Create Syllabus
- Run Ready-Check
`

        const prompt = this.governance.governPrompt(`
You are Professor GENIE, an AI advisor for course design. You help instructors but NEVER directly modify course content.

${courseContext}

USER QUESTION: ${query.message}

RULES:
1. Provide helpful guidance based on current course state
2. Reference specific evidence materials when relevant
3. Suggest which tools to use for actions
4. Never promise to directly make changes
5. Be concise but thorough

Respond in JSON format:
{
  "message": "Your helpful response here",
  "suggestedActions": [
    { "type": "generate|navigate|review", "label": "Action description", "target": "tool or section" }
  ],
  "references": [
    { "type": "evidence|objective|section", "id": "...", "title": "...", "excerpt": "..." }
  ],
  "followUpQuestions": ["Question 1?", "Question 2?"]
}
`, governance)

        const result = await multiAI.streamChat([
            { role: 'system', content: 'You are Professor GENIE, a helpful AI advisor for course design. You guide but never directly modify content.' },
            { role: 'user', content: prompt },
        ])

        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
        }

        // Save conversation
        let conversation = query.conversationId
            ? await prisma.genieConversation.findUnique({ where: { id: query.conversationId } })
            : null

        if (!conversation) {
            conversation = await prisma.genieConversation.create({
                data: {
                    courseId: query.courseId,
                    userId,
                    context: JSON.stringify(query.context),
                },
            })
        }

        await prisma.genieMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: query.message,
                context: JSON.stringify(query.context),
            },
        })

        // Parse response
        let response: GenieResponse
        try {
            const jsonMatch = fullText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                response = JSON.parse(jsonMatch[0])
            } else {
                response = {
                    message: fullText,
                    suggestedActions: [],
                    references: [],
                    followUpQuestions: [],
                }
            }
        } catch {
            response = {
                message: fullText,
                suggestedActions: [],
                references: [],
                followUpQuestions: [],
            }
        }

        await prisma.genieMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: response.message,
                context: JSON.stringify({
                    suggestedActions: response.suggestedActions,
                    references: response.references,
                }),
            },
        })

        return response
    }

    // ===========================================================================
    // AUDIT LOGGING
    // ===========================================================================

    private async logAudit(
        courseDesignId: string,
        userId: string,
        action: string,
        targetType: string,
        targetId?: string,
        previousValue?: string,
        newValue?: string,
        aiProvider?: string
    ) {
        await prisma.courseAuditLog.create({
            data: {
                courseDesignId,
                userId,
                action: action as any,
                targetType,
                targetId,
                previousValue,
                newValue,
                aiProvider,
            },
        })
    }
}

// Export singleton
export const courseDesignStudioService = new CourseDesignStudioService()
