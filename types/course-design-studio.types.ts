/**
 * Course Design Studio Types
 * Comprehensive type definitions for the AI Course Design Studio with governance
 */

// =============================================================================
// PHASE 0 & 0.5: Course Context & Metadata Types
// =============================================================================

export type AcademicLevel = 'UNDERGRADUATE' | 'GRADUATE' | 'DOCTORAL' | 'PROFESSIONAL' | 'CERTIFICATE'
export type DeliveryMode = 'ONLINE' | 'HYBRID' | 'IN_PERSON' | 'HYFLEX'
export type LearningModel = 'LECTURE' | 'CASE_BASED' | 'PROJECT_BASED' | 'FLIPPED' | 'SEMINAR' | 'LAB' | 'PRACTICUM' | 'MIXED'
export type FormattingStandard = 'APA' | 'MLA' | 'CHICAGO' | 'HARVARD' | 'IEEE' | 'INSTITUTIONAL'
export type AIUsagePolicy = 'NOT_PERMITTED' | 'PERMITTED_WITH_DISCLOSURE' | 'PERMITTED_ALL' | 'COURSE_SPECIFIC'

/** Core course details (Phase 0.5 bulk data) */
export interface CourseDetails {
    // Core Information
    courseId: string
    title: string
    code: string
    creditHours: number
    contactHours: number
    academicLevel: AcademicLevel
    termLength: number // weeks
    deliveryMode: DeliveryMode
    prerequisites: string[]
    programAlignment: string

    // Instructional Parameters
    learningModel: LearningModel
    assessmentWeighting: AssessmentWeighting
    participationRules: string
    weeklyWorkloadHours: number

    // Governance & Standards
    formattingStandard: FormattingStandard
    accessibilityRequired: boolean
    aiUsagePolicy: AIUsagePolicy
    accreditationBody?: string

    // Versioning
    versionId: string
    isLocked: boolean
}

export interface AssessmentWeighting {
    exams?: number
    assignments?: number
    projects?: number
    participation?: number
    quizzes?: number
    discussions?: number
    final?: number
}

/** Bulk course import format */
export interface BulkCourseImport {
    format: 'csv' | 'xlsx' | 'json'
    courses: Partial<CourseDetails>[]
    validationErrors?: ValidationError[]
}

// =============================================================================
// PHASE 1: Evidence Kit Types
// =============================================================================

export type EvidenceFileType = 'TEXTBOOK' | 'ARTICLE' | 'LECTURE_SLIDES' | 'VIDEO' | 'NOTES' | 'SYLLABUS' | 'RUBRIC' | 'EXTERNAL_LINK' | 'OTHER'
export type EvidenceSourceType = 'TEXTBOOK' | 'JOURNAL_ARTICLE' | 'CONFERENCE_PAPER' | 'WEB_RESOURCE' | 'VIDEO_LECTURE' | 'INSTRUCTOR_NOTES' | 'INSTITUTIONAL_POLICY' | 'OTHER'
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

/** Evidence Kit item - uploaded course material */
export interface EvidenceKitItem {
    id: string
    courseDesignId: string

    // File info
    title: string
    fileName: string
    fileType: EvidenceFileType
    fileUrl: string
    fileSize?: number
    mimeType?: string

    // AI Analysis results
    extractedText?: string
    contentSummary?: string
    topicsIdentified: string[]
    conceptsMapping: ConceptMapping[]
    citationsFound: Citation[]
    pageCount?: number
    chapterMapping?: ChapterMapping[]

    // Source indexing
    sourceType: EvidenceSourceType
    isbn?: string
    doi?: string
    externalUrl?: string

    // Processing
    uploadedBy: string
    isProcessed: boolean
    processingStatus: ProcessingStatus
    processingError?: string
    semanticChunks?: SemanticChunk[]

    createdAt: Date
    updatedAt: Date
}

export interface ConceptMapping {
    concept: string
    pages: string
    relatedConcepts: string[]
    bloomsLevel?: BloomsLevel
}

export interface Citation {
    type: 'book' | 'article' | 'web' | 'other'
    authors: string[]
    title: string
    year: number
    publisher?: string
    journal?: string
    volume?: string
    pages?: string
    doi?: string
    url?: string
    formattedAPA: string
    formattedMLA: string
    formattedChicago: string
    inTextAPA: string
}

export interface ChapterMapping {
    chapter: string
    title: string
    startPage: number
    endPage: number
    topics: string[]
}

export interface SemanticChunk {
    id: string
    text: string
    pageReference: string
    embedding?: number[] // Vector embedding for similarity search
    concepts: string[]
}

// =============================================================================
// PHASE 2: AI Analysis Types
// =============================================================================

export interface ContentAnalysis {
    courseDesignId: string
    analyzedAt: Date

    // Content mapping
    mainTopics: Topic[]
    conceptGraph: ConceptNode[]

    // Learning coverage
    coverageGaps: CoverageGap[]
    overlaps: ContentOverlap[]

    // Citation graph
    citationGraph: CitationNode[]
    referenceMap: ReferenceMapEntry[]
}

export interface Topic {
    id: string
    name: string
    importance: 'high' | 'medium' | 'low'
    evidenceItems: string[] // Evidence kit item IDs
    pageReferences: string[]
    suggestedWeeks: number[]
}

export interface ConceptNode {
    id: string
    concept: string
    prerequisites: string[]
    relatedConcepts: string[]
    bloomsLevel: BloomsLevel
    suggestedObjectives: string[]
}

export interface CoverageGap {
    topic: string
    reason: string
    suggestion: string
    severity: 'critical' | 'warning' | 'info'
}

export interface ContentOverlap {
    topics: string[]
    sources: string[]
    recommendation: string
}

export interface CitationNode {
    id: string
    source: string
    citedBy: string[]
    citesTo: string[]
    importance: number
}

export interface ReferenceMapEntry {
    evidenceItemId: string
    title: string
    usedIn: { sectionId: string; context: string }[]
}

// =============================================================================
// PHASE 3: Course Objectives Types
// =============================================================================

export type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'

export interface CourseObjective {
    id: string
    courseDesignId: string
    objectiveNumber: string // e.g., "1.1", "2.3"
    description: string
    bloomsLevel: BloomsLevel
    assessmentMethod?: string
    alignedModules: string[]
    sourceEvidence: string[] // Evidence Kit item IDs
    isAIGenerated: boolean
    isApproved: boolean
    approvedBy?: string
    approvedAt?: Date
    orderIndex: number
}

export interface ObjectiveGenerationParams {
    courseDesignId: string
    academicLevel: AcademicLevel
    creditHours: number
    learningModel: LearningModel
    evidenceItems: string[]
    existingObjectives?: CourseObjective[]
    targetCount?: number
    bloomsDistribution?: Partial<Record<BloomsLevel, number>>
}

export interface GeneratedObjective {
    description: string
    bloomsLevel: BloomsLevel
    suggestedAssessment: string
    evidenceReference: string
    confidence: number // 0-1
}

// =============================================================================
// PHASE 4 & 5: Course Structure Types
// =============================================================================

export type DesignSectionType = 'MODULE' | 'WEEK' | 'UNIT' | 'CHAPTER' | 'LESSON' | 'PAGE'
export type SectionContentType = 'LECTURE' | 'READING' | 'ASSIGNMENT' | 'QUIZ' | 'DISCUSSION' | 'VIDEO' | 'EXTERNAL_LINK' | 'RESOURCE' | 'PROJECT'

/** Course section for drag-and-drop structure */
export interface CourseDesignSection {
    id: string
    courseDesignId: string
    parentSectionId?: string
    title: string
    description?: string
    sectionType: DesignSectionType
    weekNumber?: number
    orderIndex: number
    isPublished: boolean
    durationMinutes?: number
    learningOutcomes: string[] // Objective IDs

    // Nested structure
    childSections?: CourseDesignSection[]
    contents?: SectionContent[]

    createdAt: Date
    updatedAt: Date
}

/** Content within a section */
export interface SectionContent {
    id: string
    sectionId: string
    evidenceItemId?: string // Link to Evidence Kit
    contentType: SectionContentType
    title: string
    description?: string
    content?: string // Rich text/HTML
    aiGeneratedContent?: string
    isAIGenerated: boolean
    orderIndex: number
    isRequired: boolean
    dueDate?: Date
    points?: number

    // Governance
    citationRequired: boolean
    aiDisclosureAdded: boolean
    wcagCompliant?: boolean

    // Related
    rubric?: AssessmentRubric
}

/** Drag and drop event */
export interface DragDropEvent {
    type: 'section' | 'content' | 'evidence'
    sourceId: string
    targetId: string
    position: 'before' | 'after' | 'inside'
}

// =============================================================================
// PHASE 6: Assessment & Rubric Types
// =============================================================================

export interface AssessmentRubric {
    id: string
    sectionContentId: string
    title: string
    description?: string
    totalPoints: number
    criteria: RubricCriterion[]
    isAIGenerated: boolean
    alignedObjectives: string[]
}

export interface RubricCriterion {
    id: string
    name: string
    description: string
    weight: number
    levels: PerformanceLevel[]
}

export interface PerformanceLevel {
    level: number
    label: string // e.g., "Excellent", "Good", "Satisfactory", "Needs Improvement"
    description: string
    points: number
}

// =============================================================================
// PHASE 7: Syllabus Types
// =============================================================================

export type SyllabusStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'

export interface SyllabusVersion {
    id: string
    courseDesignId: string
    version: number
    status: SyllabusStatus
    content: string // Full syllabus HTML/Markdown
    pdfUrl?: string
    wordUrl?: string

    // Compilation sources
    compiledFrom: SyllabusCompilationSource

    // Governance
    academicPolicies: AcademicPolicy[]
    aiDisclosure: string
    accessibilityStatement: string

    // Approval
    isApproved: boolean
    approvedBy?: string
    approvedAt?: Date
}

export interface SyllabusCompilationSource {
    courseDetails: boolean
    objectives: string[]
    sections: string[]
    assessments: string[]
    customSections: SyllabusCustomSection[]
}

export interface SyllabusCustomSection {
    title: string
    content: string
    orderIndex: number
}

export interface AcademicPolicy {
    type: 'integrity' | 'attendance' | 'grading' | 'late_work' | 'accommodation' | 'ai_usage' | 'other'
    title: string
    content: string
}

// =============================================================================
// PHASE 8: Ready-Check Validation Types
// =============================================================================

export type ReadyCheckType =
    | 'OBJECTIVE_COVERAGE'
    | 'CITATION_COMPLIANCE'
    | 'ACCESSIBILITY_WCAG'
    | 'AI_DISCLOSURE'
    | 'POLICY_COMPLETENESS'
    | 'CONTENT_ALIGNMENT'
    | 'WORKLOAD_BALANCE'

export type ReadyCheckStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING'

export interface ReadyCheckResult {
    id: string
    courseDesignId: string
    checkType: ReadyCheckType
    status: ReadyCheckStatus
    score?: number // 0-100
    issues: ReadyCheckIssue[]
    suggestions: ReadyCheckSuggestion[]
    details?: string
    createdAt: Date
}

export interface ReadyCheckIssue {
    severity: 'critical' | 'warning' | 'info'
    message: string
    location?: string // e.g., "Section 3 > Assignment 1"
    objectId?: string
}

export interface ReadyCheckSuggestion {
    type: 'add' | 'modify' | 'remove' | 'review'
    message: string
    autoFixAvailable: boolean
    autoFixAction?: string
}

/** Complete Ready-Check report */
export interface ReadyCheckReport {
    courseDesignId: string
    overallStatus: ReadyCheckStatus
    overallScore: number
    checks: ReadyCheckResult[]
    summary: string
    canPublish: boolean
    blockers: string[]
    createdAt: Date
}

// =============================================================================
// PHASE 9: Publish & Audit Types
// =============================================================================

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'AI_GENERATE'
    | 'AI_REFINE'
    | 'APPROVE'
    | 'PUBLISH'
    | 'REVERT'
    | 'IMPORT'
    | 'EXPORT'

export interface CourseAuditLog {
    id: string
    courseDesignId: string
    userId: string
    action: AuditAction
    targetType: string
    targetId?: string
    previousValue?: any
    newValue?: any
    aiProvider?: string
    aiPrompt?: string // Governed/sanitized
    createdAt: Date
}

export interface PublishResult {
    success: boolean
    publishedAt?: Date
    version: number
    notifications: NotificationSent[]
    errors?: string[]
}

export interface NotificationSent {
    recipientType: 'student' | 'instructor' | 'admin'
    count: number
    method: 'email' | 'in_app' | 'lms'
}

// =============================================================================
// ASK PROFESSOR GENIE Types
// =============================================================================

export interface GenieConversation {
    id: string
    courseId: string
    userId: string
    context: GenieContext
    messages: GenieMessage[]
    createdAt: Date
    updatedAt: Date
}

export interface GenieMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    context?: GenieMessageContext
    createdAt: Date
}

export interface GenieContext {
    currentPhase: string
    currentSectionId?: string
    referencedObjectives?: string[]
    referencedEvidence?: string[]
}

export interface GenieMessageContext {
    phase: string
    references: { type: string; id: string; title: string }[]
    suggestedActions?: string[]
}

export interface GenieQuery {
    courseId: string
    message: string
    context: GenieContext
    conversationId?: string
}

export interface GenieResponse {
    message: string
    suggestedActions: GenieAction[]
    references: GenieReference[]
    followUpQuestions: string[]
}

export interface GenieAction {
    type: 'navigate' | 'generate' | 'edit' | 'review'
    label: string
    target: string
    params?: Record<string, any>
}

export interface GenieReference {
    type: 'evidence' | 'objective' | 'section' | 'policy'
    id: string
    title: string
    excerpt?: string
}

// =============================================================================
// GOVERNANCE Types
// =============================================================================

/** Prompt governance - injected into all AI calls */
export interface PromptGovernance {
    courseMetadata: Partial<CourseDetails>
    formattingRules: FormattingRule[]
    roleGuard: RoleGuard
    scopeLimits: ScopeLimits
    forbiddenActions: string[]
}

export interface FormattingRule {
    type: 'citation' | 'heading' | 'list' | 'accessibility'
    standard: FormattingStandard
    rules: string[]
}

export interface RoleGuard {
    canGenerate: boolean
    canEdit: boolean
    canApprove: boolean
    canPublish: boolean
}

export interface ScopeLimits {
    maxTokens: number
    allowedContentTypes: SectionContentType[]
    restrictedTopics: string[]
}

// =============================================================================
// UI State Types
// =============================================================================

export interface CourseDesignStudioState {
    currentPhase: CourseDesignPhase
    courseId: string
    courseDesignId?: string

    // Phase states
    courseDetails?: CourseDetails
    evidenceKit: EvidenceKitItem[]
    contentAnalysis?: ContentAnalysis
    objectives: CourseObjective[]
    sections: CourseDesignSection[]
    syllabus?: SyllabusVersion
    readyCheckReport?: ReadyCheckReport

    // UI state
    selectedSectionId?: string
    isDragging: boolean
    unsavedChanges: boolean

    // GENIE
    genieOpen: boolean
    genieConversation?: GenieConversation
}

export type CourseDesignPhase =
    | 'context-setup'        // Phase 0
    | 'course-details'       // Phase 0.5
    | 'material-ingestion'   // Phase 1
    | 'content-analysis'     // Phase 2
    | 'generate-objectives'  // Phase 3.1
    | 'suggest-curriculum'   // Phase 3.2
    | 'build-sections'       // Phase 4
    | 'populate-content'     // Phase 5
    | 'create-content'       // Phase 6
    | 'create-syllabus'      // Phase 7
    | 'ready-check'          // Phase 8
    | 'publish'              // Phase 9

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface ValidationError {
    field: string
    message: string
    code: string
}

export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: string
    validationErrors?: ValidationError[]
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}

/** Unified AI generation request */
export interface AIGenerationRequest {
    type: 'objectives' | 'curriculum' | 'lecture_notes' | 'assessment' | 'rubric' | 'syllabus'
    courseDesignId: string
    context: {
        courseDetails: Partial<CourseDetails>
        evidenceItems?: string[]
        targetSection?: string
        existingContent?: string
    }
    options?: {
        tone?: 'formal' | 'conversational' | 'academic'
        length?: 'brief' | 'moderate' | 'comprehensive'
        includeExamples?: boolean
        citationStyle?: FormattingStandard
    }
}

export interface AIGenerationResponse {
    success: boolean
    content: any
    provider: string
    tokensUsed: number
    governanceApplied: string[]
    citations?: Citation[]
    requiresReview: boolean
}
