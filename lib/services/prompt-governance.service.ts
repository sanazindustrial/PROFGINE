/**
 * Prompt Governance Service
 * IEEE SRS Compliant Implementation
 * 
 * Ensures all AI interactions are:
 * - Context-aware
 * - Policy-compliant
 * - Role-appropriate
 * - Non-authoritative (unless explicitly allowed)
 * - Auditable
 * 
 * NO RAW PROMPTS GO DIRECTLY TO AI MODELS. EVER.
 */

import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import crypto from "crypto"

// =============================================================================
// TYPES & ENUMS
// =============================================================================

export type PromptType = 'ADVISORY' | 'GENERATION' | 'VALIDATION' | 'EXPORT'
export type PromptAuthority = 'SUGGEST_ONLY' | 'DRAFT_ONLY' | 'READ_ONLY' | 'TRANSFORM_ONLY'
export type GuardrailCategory = 'AUTHORITY' | 'SCOPE' | 'COMPLIANCE' | 'RBAC' | 'SAFETY'
export type GovernanceDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE'
export type FormattingStandard = 'APA' | 'MLA' | 'CHICAGO' | 'HARVARD' | 'IEEE' | 'INSTITUTIONAL'
export type AcademicLevel = 'UNDERGRADUATE' | 'GRADUATE' | 'DOCTORAL' | 'PROFESSIONAL' | 'CERTIFICATE'

export interface PromptTemplate {
    id: string
    type: PromptType
    authority: PromptAuthority
    systemPrompt: string
    developerContext: string
    allowedActions: string[]
    blockedActions: string[]
}

export interface GovernanceContext {
    userId: string
    userRole: UserRole
    courseId?: string
    courseMetadata?: CourseMetadataContext
    evidenceKitRefs?: EvidenceReference[]
    formattingStandard: FormattingStandard
    academicLevel: AcademicLevel
    policyPack: PolicyPack
    toolInvoked: string
}

export interface CourseMetadataContext {
    title: string
    code: string
    creditHours: number
    termLength: number
    deliveryMode: string
    learningModel: string
    aiUsagePolicy: string
    accreditationBody?: string
}

export interface EvidenceReference {
    sourceId: string
    title: string
    type: string
    location?: string // e.g., "Ch2 p45-47"
}

export interface PolicyPack {
    aiDisclosureRequired: boolean
    integrityStatementRequired: boolean
    accessibilityRequired: boolean
    institutionalPolicies: string[]
}

export interface GovernedPrompt {
    promptId: string
    originalPrompt: string
    governedPrompt: string
    decision: GovernanceDecision
    blockReason?: string
    metadata: {
        userId: string
        userRole: UserRole
        toolInvoked: string
        courseId?: string
        metadataSnapshotId?: string
        evidenceSnapshotId?: string
        timestamp: Date
    }
}

export interface PromptAuditRecord {
    id: string
    promptId: string
    userId: string
    userRole: UserRole
    toolInvoked: string
    promptType: PromptType
    courseId?: string
    metadataSnapshotId?: string
    evidenceSnapshotId?: string
    aiModel?: string
    inputHash: string
    outputHash?: string
    decision: GovernanceDecision
    blockReason?: string
    timestamp: Date
}

// =============================================================================
// FORBIDDEN PATTERNS - NON-NEGOTIABLE
// =============================================================================

const FORBIDDEN_PATTERNS: RegExp[] = [
    /publish\s*(now|this|course|content|immediately)/i,
    /override\s*(ready.?check|validation|governance)/i,
    /skip\s*(apa|mla|formatting|validation|review)/i,
    /bypass\s*(check|validation|approval|governance)/i,
    /fabricate\s*(source|citation|reference)/i,
    /fake\s*(citation|reference|source)/i,
    /give\s*(answer\s*key|answers|solutions)\s*(to|for)?\s*(active|current)/i,
    /auto.?publish/i,
    /disable\s*(ai\s*disclosure|governance|policy)/i,
    /delete\s*(all|course|student)/i,
    /modify\s*(grades?|scores?)\s*directly/i,
]

const ESCALATION_PATTERNS: RegExp[] = [
    /export\s*answer\s*key/i,
    /publish\s*without\s*validation/i,
    /disable\s*ai\s*disclosure/i,
    /override\s*policy/i,
]

// =============================================================================
// PROMPT TEMPLATES - GOVERNED
// =============================================================================

const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
    // Ask Professor GENIE - Advisory Only
    GENIE_ADVISORY: {
        id: 'genie_advisory',
        type: 'ADVISORY',
        authority: 'SUGGEST_ONLY',
        systemPrompt: `You are Ask Professor GENIE, an advisory assistant for course design. 
You provide suggestions only. You CANNOT:
- Publish or make changes to course data
- Modify student records or grades
- Bypass governance or validation checks
- Fabricate citations or sources

If evidence is missing from the Evidence Kit, clearly state this and recommend adding sources.
All responses are non-binding suggestions that require explicit user action to implement.`,
        developerContext: '',
        allowedActions: ['Suggest', 'Explain', 'Critique', 'Compare options', 'Recommend'],
        blockedActions: ['Create final syllabus', 'Publish', 'Override Ready-Check', 'Modify grades'],
    },

    // Generate Objectives
    GENERATE_OBJECTIVES: {
        id: 'generate_objectives',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Generate draft learning objectives aligned with Bloom's taxonomy.
Output must be structured JSON. Label all content as "AI-ASSISTED DRAFT".
Do NOT publish or finalize - this creates drafts only.`,
        developerContext: '',
        allowedActions: ['Generate draft objectives', 'Align with Bloom levels', 'Link to evidence'],
        blockedActions: ['Finalize objectives', 'Publish', 'Modify course metadata'],
    },

    // Suggest Curriculum
    SUGGEST_CURRICULUM: {
        id: 'suggest_curriculum',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Create a draft curriculum outline with weekly topics and activities.
Output must be structured JSON. All content is DRAFT until instructor approval.
Link content to Evidence Kit sources where available.`,
        developerContext: '',
        allowedActions: ['Draft curriculum', 'Map objectives to weeks', 'Suggest readings'],
        blockedActions: ['Finalize curriculum', 'Auto-assign grades', 'Publish'],
    },

    // Create Lecture Notes
    CREATE_LECTURE_NOTES: {
        id: 'create_lecture_notes',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Create draft lecture notes with proper formatting.
Apply citation style as specified. Insert "[CITATION NEEDED]" for missing sources.
Add "AI-assisted draft" disclosure footer.`,
        developerContext: '',
        allowedActions: ['Draft notes', 'Apply citations', 'Structure content'],
        blockedActions: ['Finalize notes', 'Remove AI disclosure', 'Publish'],
    },

    // Create Presentations
    CREATE_PRESENTATIONS: {
        id: 'create_presentations',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Create draft presentation slides with proper structure.
Each slide must have alt-text placeholders for accessibility.
Content is DRAFT only until instructor review.`,
        developerContext: '',
        allowedActions: ['Draft slides', 'Add accessibility placeholders', 'Structure content'],
        blockedActions: ['Finalize presentations', 'Auto-publish', 'Skip accessibility'],
    },

    // Design Assessments
    DESIGN_ASSESSMENTS: {
        id: 'design_assessments',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Create draft assessments aligned with learning objectives.
Include rubric criteria and point values. Mark as "DRAFT - Requires Review".
Link each question to specific objectives.`,
        developerContext: '',
        allowedActions: ['Draft assessments', 'Create rubrics', 'Align to objectives'],
        blockedActions: ['Finalize assessments', 'Reveal answer keys', 'Auto-grade'],
    },

    // Ready-Check Validation
    READY_CHECK: {
        id: 'ready_check',
        type: 'VALIDATION',
        authority: 'READ_ONLY',
        systemPrompt: `Validate course content for compliance and completeness.
NEVER rewrite content - only evaluate and report.
Return pass/fail status with actionable fixes.`,
        developerContext: '',
        allowedActions: ['Evaluate', 'Report issues', 'Suggest fixes'],
        blockedActions: ['Modify content', 'Auto-fix', 'Bypass validation'],
    },

    // Export Formatter
    EXPORT_FORMAT: {
        id: 'export_format',
        type: 'EXPORT',
        authority: 'TRANSFORM_ONLY',
        systemPrompt: `Format content for export according to specified standard.
Apply citation style. Embed required metadata.
Do not alter semantic content - transform only.`,
        developerContext: '',
        allowedActions: ['Format', 'Apply style', 'Transform structure'],
        blockedActions: ['Alter content meaning', 'Remove disclosures', 'Bypass formatting'],
    },

    // Discussion Feedback
    DISCUSSION_FEEDBACK: {
        id: 'discussion_feedback',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Generate draft feedback for student discussion posts.
Feedback is AI-ASSISTED and requires instructor approval before release.
Be constructive and aligned with rubric criteria.`,
        developerContext: '',
        allowedActions: ['Draft feedback', 'Suggest improvements', 'Align to rubric'],
        blockedActions: ['Finalize grades', 'Auto-release feedback', 'Modify student records'],
    },

    // Grading Assistance
    GRADING_ASSIST: {
        id: 'grading_assist',
        type: 'GENERATION',
        authority: 'DRAFT_ONLY',
        systemPrompt: `Provide AI-assisted grading suggestions based on rubric.
All grades are DRAFT and require instructor confirmation.
Label suggestions as "AI-Assisted - Pending Review".`,
        developerContext: '',
        allowedActions: ['Suggest scores', 'Draft feedback', 'Identify rubric alignment'],
        blockedActions: ['Finalize grades', 'Submit to gradebook', 'Override instructor'],
    },
}

// =============================================================================
// PROMPT GOVERNANCE ENGINE
// =============================================================================

export class PromptGovernanceEngine {
    private formatters: Map<FormattingStandard, FormattingRules>

    constructor() {
        this.formatters = new Map([
            ['APA', {
                name: 'APA 7th Edition',
                citationRules: [
                    'Use APA 7th edition format for all citations',
                    'In-text citations: (Author, Year, p. X)',
                    'Reference list entries in hanging indent format',
                    'Title case for journal titles, sentence case for article titles',
                ],
                headingRules: [
                    'Level 1: Centered, Bold, Title Case',
                    'Level 2: Left-Aligned, Bold, Title Case',
                    'Level 3: Left-Aligned, Bold Italic, Title Case',
                ],
            }],
            ['MLA', {
                name: 'MLA 9th Edition',
                citationRules: [
                    'Use MLA 9th edition format',
                    'In-text citations: (Author Page)',
                    'Works Cited page format',
                ],
                headingRules: [
                    'No specific heading format required',
                    'Maintain consistent style throughout',
                ],
            }],
            ['CHICAGO', {
                name: 'Chicago Manual of Style 17th Edition',
                citationRules: [
                    'Use Chicago Manual of Style 17th edition',
                    'Footnote/endnote citation style',
                    'Bibliography format',
                ],
                headingRules: [
                    'Use consistent heading hierarchy',
                ],
            }],
            ['HARVARD', {
                name: 'Harvard Referencing',
                citationRules: [
                    'Use Harvard referencing style',
                    'In-text: (Author Year)',
                    'Reference list alphabetically ordered',
                ],
                headingRules: [],
            }],
            ['IEEE', {
                name: 'IEEE Citation Format',
                citationRules: [
                    'Use IEEE citation format',
                    'Numbered references in brackets [1]',
                    'References section at end',
                ],
                headingRules: [],
            }],
            ['INSTITUTIONAL', {
                name: 'Institutional Guidelines',
                citationRules: [
                    'Follow institutional guidelines',
                    'Maintain consistency throughout',
                ],
                headingRules: [],
            }],
        ])
    }

    /**
     * Main governance entry point - process user prompt through all guardrails
     */
    async governPrompt(
        userPrompt: string,
        templateId: string,
        context: GovernanceContext
    ): Promise<GovernedPrompt> {
        const promptId = this.generatePromptId()
        const template = PROMPT_TEMPLATES[templateId]

        if (!template) {
            return this.createBlockedPrompt(
                promptId,
                userPrompt,
                context,
                `Unknown template: ${templateId}`
            )
        }

        // Step 1: Check forbidden patterns (BLOCK)
        const forbiddenCheck = this.checkForbiddenPatterns(userPrompt)
        if (forbiddenCheck.blocked) {
            const reason = forbiddenCheck.reason || 'Forbidden action detected'
            await this.logAudit(promptId, context, template.type, 'BLOCK', reason)
            return this.createBlockedPrompt(promptId, userPrompt, context, reason)
        }

        // Step 2: Check escalation patterns (ESCALATE)
        const escalationCheck = this.checkEscalationPatterns(userPrompt, context.userRole)
        if (escalationCheck.escalate) {
            const escalationReason = escalationCheck.reason || 'Escalation required'
            await this.logAudit(promptId, context, template.type, 'ESCALATE', escalationReason)
            return this.createBlockedPrompt(
                promptId,
                userPrompt,
                context,
                `Requires admin approval: ${escalationReason}`
            )
        }

        // Step 3: Apply RBAC guard
        const rbacCheck = this.checkRBAC(context.userRole, template)
        if (!rbacCheck.allowed) {
            const reason = rbacCheck.reason || 'Access denied'
            await this.logAudit(promptId, context, template.type, 'BLOCK', reason)
            return this.createBlockedPrompt(promptId, userPrompt, context, reason)
        }

        // Step 4: Build governed prompt with context injection
        const governedPrompt = this.buildGovernedPrompt(userPrompt, template, context)

        // Step 5: Log the governed prompt
        await this.logAudit(promptId, context, template.type, 'ALLOW')

        return {
            promptId,
            originalPrompt: userPrompt,
            governedPrompt,
            decision: 'ALLOW',
            metadata: {
                userId: context.userId,
                userRole: context.userRole,
                toolInvoked: context.toolInvoked,
                courseId: context.courseId,
                metadataSnapshotId: context.courseId ? await this.getMetadataSnapshotId(context.courseId) : undefined,
                evidenceSnapshotId: context.courseId ? await this.getEvidenceSnapshotId(context.courseId) : undefined,
                timestamp: new Date(),
            },
        }
    }

    /**
     * Check for forbidden action patterns
     */
    private checkForbiddenPatterns(prompt: string): { blocked: boolean; reason?: string } {
        for (const pattern of FORBIDDEN_PATTERNS) {
            if (pattern.test(prompt)) {
                return {
                    blocked: true,
                    reason: `Forbidden action detected: ${pattern.toString()}`,
                }
            }
        }
        return { blocked: false }
    }

    /**
     * Check for escalation-required patterns
     */
    private checkEscalationPatterns(
        prompt: string,
        role: UserRole
    ): { escalate: boolean; reason?: string } {
        // Admins don't need escalation
        if (role === UserRole.ADMIN) {
            return { escalate: false }
        }

        for (const pattern of ESCALATION_PATTERNS) {
            if (pattern.test(prompt)) {
                return {
                    escalate: true,
                    reason: `Action requires admin approval: ${pattern.toString()}`,
                }
            }
        }
        return { escalate: false }
    }

    /**
     * Apply Role-Based Access Control
     */
    private checkRBAC(
        role: UserRole,
        template: PromptTemplate
    ): { allowed: boolean; reason?: string } {
        // Students can only use limited tools
        if (role === UserRole.STUDENT) {
            const studentAllowedTemplates = ['GENIE_ADVISORY']
            if (!studentAllowedTemplates.includes(template.id.toUpperCase())) {
                return {
                    allowed: false,
                    reason: 'Students cannot access instructor-only tools',
                }
            }
        }

        // All roles can use advisory and validation
        return { allowed: true }
    }

    /**
     * Build the fully governed prompt with context injection
     */
    private buildGovernedPrompt(
        userPrompt: string,
        template: PromptTemplate,
        context: GovernanceContext
    ): string {
        const formatting = this.formatters.get(context.formattingStandard) || this.formatters.get('APA')!

        // Build developer context
        const developerContext = `
ROLE: ${context.userRole}
TOOL: ${context.toolInvoked}
${context.courseMetadata ? `
COURSE CONTEXT:
- Title: ${context.courseMetadata.title} (${context.courseMetadata.code})
- Academic Level: ${context.academicLevel}
- Term Length: ${context.courseMetadata.termLength} weeks
- Delivery Mode: ${context.courseMetadata.deliveryMode}
- Learning Model: ${context.courseMetadata.learningModel}
- AI Policy: ${context.courseMetadata.aiUsagePolicy}
${context.courseMetadata.accreditationBody ? `- Accreditation: ${context.courseMetadata.accreditationBody}` : ''}
` : ''}
FORMATTING STANDARD: ${formatting.name}
Citation Rules:
${formatting.citationRules.map(r => `- ${r}`).join('\n')}

POLICIES ENABLED:
${context.policyPack?.aiDisclosureRequired ? '- AI disclosure required on all generated content' : ''}
${context.policyPack?.integrityStatementRequired ? '- Academic integrity statement required' : ''}
${context.policyPack?.accessibilityRequired ? '- Accessibility compliance required' : ''}
${(context.policyPack?.institutionalPolicies || []).map(p => `- ${p}`).join('\n')}

AUTHORITY LEVEL: ${template.authority}
ALLOWED ACTIONS: ${template.allowedActions.join(', ')}
BLOCKED ACTIONS: ${template.blockedActions.join(', ')}

${context.evidenceKitRefs && context.evidenceKitRefs.length > 0 ? `
EVIDENCE KIT REFERENCES (Use these as primary sources):
${context.evidenceKitRefs.map(e => `- [${e.sourceId}] ${e.title} (${e.type})${e.location ? ` - ${e.location}` : ''}`).join('\n')}
` : 'NOTE: No Evidence Kit materials uploaded for this course.'}
`

        // Combine system prompt, developer context, and user prompt
        return `
=== SYSTEM (IMMUTABLE) ===
${template.systemPrompt}

=== GOVERNANCE CONTEXT ===
${developerContext}

=== USER REQUEST ===
${userPrompt}

=== OUTPUT REQUIREMENTS ===
- All content must be labeled as "${template.authority === 'DRAFT_ONLY' ? 'AI-ASSISTED DRAFT' : template.authority}"
- Apply ${formatting.name} citation format where applicable
- Do not perform blocked actions: ${template.blockedActions.join(', ')}
${context.policyPack?.aiDisclosureRequired ? '- Include AI disclosure statement' : ''}
`.trim()
    }

    /**
     * Create a blocked prompt response
     */
    private createBlockedPrompt(
        promptId: string,
        originalPrompt: string,
        context: GovernanceContext,
        reason: string
    ): GovernedPrompt {
        return {
            promptId,
            originalPrompt,
            governedPrompt: '',
            decision: 'BLOCK',
            blockReason: reason,
            metadata: {
                userId: context.userId,
                userRole: context.userRole,
                toolInvoked: context.toolInvoked,
                courseId: context.courseId,
                timestamp: new Date(),
            },
        }
    }

    /**
     * Generate unique prompt ID
     */
    private generatePromptId(): string {
        return `PG-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    }

    /**
     * Get metadata snapshot ID for audit trail
     */
    private async getMetadataSnapshotId(courseId: string): Promise<string | undefined> {
        const metadata = await prisma.courseDesignMetadata.findFirst({
            where: { courseId },
            select: { id: true },
        })
        return metadata?.id
    }

    /**
     * Get evidence snapshot ID for audit trail
     */
    private async getEvidenceSnapshotId(courseId: string): Promise<string | undefined> {
        const metadata = await prisma.courseDesignMetadata.findFirst({
            where: { courseId },
            select: { id: true },
        })
        if (!metadata) return undefined

        // Create a hash of current evidence state
        const evidence = await prisma.evidenceKitItem.findMany({
            where: { courseDesignId: metadata.id },
            select: { id: true, updatedAt: true },
            orderBy: { id: 'asc' },
        })
        
        if (evidence.length === 0) return undefined

        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(evidence))
            .digest('hex')
            .substring(0, 16)

        return `EK-${hash}`
    }

    /**
     * Log prompt to audit trail
     */
    private async logAudit(
        promptId: string,
        context: GovernanceContext,
        promptType: PromptType,
        decision: GovernanceDecision,
        blockReason?: string
    ): Promise<void> {
        try {
            // Use raw query for audit logging (model may not be migrated yet)
            await prisma.$executeRaw`
                INSERT INTO prompt_audit_logs (
                    id, prompt_id, user_id, user_role, tool_invoked, 
                    prompt_type, course_id, decision, block_reason, timestamp
                ) VALUES (
                    ${crypto.randomUUID()}, ${promptId}, ${context.userId}, 
                    ${context.userRole}, ${context.toolInvoked}, 
                    ${promptType}, ${context.courseId || null}, 
                    ${decision}, ${blockReason || null}, NOW()
                )
            `
        } catch (error) {
            // Don't fail the main operation if audit logging fails
            // Table may not exist yet if migration hasn't run
            console.warn('Prompt audit logging skipped (table may not exist):', error instanceof Error ? error.message : 'Unknown error')
        }
    }

    /**
     * Log AI response hash for auditability
     */
    async logResponseHash(
        promptId: string,
        aiModel: string,
        responseText: string
    ): Promise<void> {
        const outputHash = crypto.createHash('sha256')
            .update(responseText)
            .digest('hex')

        try {
            // Use raw query for audit logging (model may not be migrated yet)
            await prisma.$executeRaw`
                UPDATE prompt_audit_logs 
                SET ai_model = ${aiModel}, output_hash = ${outputHash}
                WHERE prompt_id = ${promptId}
            `
        } catch (error) {
            // Table may not exist yet if migration hasn't run
            console.warn('Response hash logging skipped:', error instanceof Error ? error.message : 'Unknown error')
        }
    }

    /**
     * Get template by ID
     */
    getTemplate(templateId: string): PromptTemplate | undefined {
        return PROMPT_TEMPLATES[templateId]
    }

    /**
     * List available templates for a role
     */
    getAvailableTemplates(role: UserRole): PromptTemplate[] {
        const templates = Object.values(PROMPT_TEMPLATES)
        
        if (role === UserRole.STUDENT) {
            return templates.filter(t => t.id === 'genie_advisory')
        }

        return templates
    }
}

// =============================================================================
// HELPER TYPES
// =============================================================================

interface FormattingRules {
    name: string
    citationRules: string[]
    headingRules: string[]
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const promptGovernance = new PromptGovernanceEngine()

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create governance context from session and course data
 */
export async function createGovernanceContext(
    userId: string,
    userRole: UserRole,
    toolInvoked: string,
    courseId?: string
): Promise<GovernanceContext> {
    let courseMetadata: CourseMetadataContext | undefined
    let evidenceKitRefs: EvidenceReference[] = []
    let formattingStandard: FormattingStandard = 'APA'
    let academicLevel: AcademicLevel = 'UNDERGRADUATE'

    if (courseId) {
        const design = await prisma.courseDesignMetadata.findFirst({
            where: { courseId },
            include: {
                course: { select: { title: true, code: true } },
                evidenceItems: {
                    select: { id: true, title: true, sourceType: true },
                    take: 10,
                },
            },
        })

        if (design) {
            courseMetadata = {
                title: design.course.title,
                code: design.course.code || '',
                creditHours: design.creditHours || 3,
                termLength: design.termLength || 16,
                deliveryMode: design.deliveryMode || 'ONLINE',
                learningModel: design.learningModel || 'LECTURE',
                aiUsagePolicy: design.aiUsagePolicy || 'PERMITTED_WITH_DISCLOSURE',
                accreditationBody: design.accreditationBody || undefined,
            }

            formattingStandard = (design.formattingStandard as FormattingStandard) || 'APA'
            academicLevel = (design.academicLevel as AcademicLevel) || 'UNDERGRADUATE'

            evidenceKitRefs = design.evidenceItems.map(e => ({
                sourceId: e.id,
                title: e.title,
                type: e.sourceType,
            }))
        }
    }

    // Get institutional policies
    const policyPack: PolicyPack = {
        aiDisclosureRequired: true, // Default enabled
        integrityStatementRequired: true,
        accessibilityRequired: true,
        institutionalPolicies: [
            'Academic integrity policy applies to all coursework',
            'Proper attribution required for all sources',
        ],
    }

    return {
        userId,
        userRole,
        courseId,
        courseMetadata,
        evidenceKitRefs,
        formattingStandard,
        academicLevel,
        policyPack,
        toolInvoked,
    }
}
