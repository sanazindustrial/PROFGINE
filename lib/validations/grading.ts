import { z } from "zod"

// ============================================================================
// ENUM VALIDATIONS
// ============================================================================

export const FeedbackStyleEnum = z.enum([
  "ENCOURAGING_MENTOR",
  "CRITICAL_PEER", 
  "SCHOLARLY_ADVISOR",
  "TECHNICAL_LEAD"
])

export const AcademicLevelEnum = z.enum([
  "UNDERGRADUATE",
  "GRADUATE", 
  "DOCTORAL"
])

export const AssignmentTypeEnum = z.enum([
  "PROJECT",
  "DISSERTATION",
  "REPORT",
  "LAB",
  "DISCUSSION",
  "ESSAY",
  "QUIZ",
  "CASE_STUDY"
])

export const UncertaintyLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH"])

export const NudgeTypeEnum = z.enum([
  "MOTIVATIONAL",
  "REMINDER",
  "ESCALATION",
  "SUPPORT_OFFER"
])

export const InterventionStatusEnum = z.enum([
  "PENDING",
  "SENT",
  "ACKNOWLEDGED",
  "ACTION_TAKEN",
  "ESCALATED"
])

// ============================================================================
// READY-GATE SELF-EVALUATION SCHEMAS
// ============================================================================

export const SelfReflectionSchema = z.object({
  criterion: z.string(),
  selfScore: z.number().min(0).max(100),
  note: z.string().min(10, "Please provide a meaningful reflection"),
})

export const OutcomeMasterySchema = z.object({
  outcomeId: z.string(),
  masteryLevel: z.enum(["NOVICE", "DEVELOPING", "PROFICIENT", "EXEMPLARY"]),
  evidence: z.string().optional(),
})

export const ReadyGateSelfEvaluationSchema = z.object({
  submissionId: z.string().uuid(),
  reflections: z.array(SelfReflectionSchema).min(1, "At least one reflection is required"),
  outcomesMastery: z.array(OutcomeMasterySchema).optional(),
  
  // Compliance checks
  structureCheck: z.boolean(),
  citationsCheck: z.boolean(),
  evidenceCheck: z.boolean(),
  accessibilityCheck: z.boolean(),
})

// ============================================================================
// AI-USE STATEMENT SCHEMAS
// ============================================================================

export const AIToolUsageSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  purpose: z.string().min(10, "Describe how you used this tool"),
  sections: z.array(z.string()).optional(), // Which sections AI assisted with
})

export const VerificationStepSchema = z.object({
  step: z.string(),
  description: z.string(),
  completed: z.boolean(),
})

export const AIUseStatementSchema = z.object({
  submissionId: z.string().uuid(),
  toolsUsed: z.array(AIToolUsageSchema),
  verificationSteps: z.array(VerificationStepSchema).optional(),
  collaborationReflection: z.string().min(20, "Please reflect on your AI collaboration"),
  hasProcessEvidence: z.boolean(),
  draftVersionsCount: z.number().min(0),
  changeLogAvailable: z.boolean(),
})

// ============================================================================
// FEEDBACK CYCLE SCHEMAS (THE "SANDWICH")
// ============================================================================

export const ConstructiveFeedbackItemSchema = z.object({
  criterion: z.string(),
  finding: z.string(),
  rationale: z.string().describe("Must cite specific lines/sections for explainable grading"),
  lineReferences: z.array(z.number()),
  uncertaintyBadge: UncertaintyLevelEnum,
})

export const HeatmapSegmentSchema = z.object({
  startLine: z.number(),
  endLine: z.number(),
  text: z.string(),
  rubricCriterion: z.string(),
  evidenceStrength: z.enum(["STRONG", "MODERATE", "WEAK"]),
  aiConfidence: z.number().min(0).max(1),
})

export const ProcessAnomalySchema = z.object({
  type: z.enum(["ONE_CLICK_PASTE", "NO_DRAFTS", "RAPID_COMPLETION", "STYLE_INCONSISTENCY", "OTHER"]),
  description: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  evidence: z.string().optional(),
})

export const FeedbackCycleSchema = z.object({
  submissionId: z.string().uuid(),
  feedbackStyle: FeedbackStyleEnum,
  academicLevel: AcademicLevelEnum,
  fieldOfStudy: z.string().optional(),
  
  // The "Sandwich" Layers - enforcing minimum quality
  topBunPositive: z.string().min(20, "Motivational opening is required - highlight specific strengths"),
  fillingConstructive: z.array(ConstructiveFeedbackItemSchema).min(1, "At least one growth area must be identified"),
  bottomBunMotivational: z.string().min(20, "Actionable next steps and encouragement required"),
  
  // AI Analysis
  heatmapData: z.array(HeatmapSegmentSchema).optional(),
  uncertaintyScore: z.number().min(0).max(1).optional(),
  processAnomalies: z.array(ProcessAnomalySchema).optional(),
})

// ============================================================================
// GRADING GOVERNANCE SCHEMAS
// ============================================================================

export const AuditLogEntrySchema = z.object({
  action: z.string(),
  performedBy: z.string(),
  timestamp: z.string().datetime(),
  previousValue: z.any().optional(),
  newValue: z.any().optional(),
  rationale: z.string().optional(),
})

export const GradingGovernanceSchema = z.object({
  feedbackCycleId: z.string().uuid(),
  isBlindGraded: z.boolean().default(false),
  irrValue: z.number().optional().describe("Computed inter-rater reliability for consensus"),
  varianceDetected: z.boolean().default(false),
  biasFlag: z.boolean().default(false),
  fairnessCheckPassed: z.boolean().default(true),
  
  // Override tracking - mandatory rationale for manual changes
  wasOverridden: z.boolean().default(false),
  originalAIScore: z.number().optional(),
  finalScore: z.number().optional(),
  overrideRationale: z.string().optional().refine((val, ctx) => {
    // If wasOverridden is true, rationale must be provided
    // This will be validated at the API level
    return true
  }, { message: "Override rationale is mandatory for manual edits" }),
  overriddenBy: z.string().uuid().optional(),
  
  auditLog: z.array(AuditLogEntrySchema).optional(),
})

// ============================================================================
// CONSENSUS REVIEW SCHEMAS
// ============================================================================

export const CriterionScoreSchema = z.object({
  criterion: z.string(),
  score: z.number().min(0).max(100),
  rationale: z.string(),
})

export const ConsensusReviewSchema = z.object({
  submissionId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  reviewerRole: z.enum(["TA", "FACULTY", "EXTERNAL"]),
  weight: z.number().min(0.1).max(3).default(1.0),
  
  scores: z.array(CriterionScoreSchema).min(1),
  overallScore: z.number().min(0).max(100),
  
  confidenceLevel: UncertaintyLevelEnum,
  requiresReconciliation: z.boolean().default(false),
  reconciliationNote: z.string().optional(),
})

// ============================================================================
// INTERVENTION NUDGE SCHEMAS
// ============================================================================

export const ActionableStepSchema = z.object({
  step: z.number(),
  action: z.string(),
  estimatedMinutes: z.number().optional(),
  resourceLink: z.string().url().optional(),
})

export const InterventionNudgeSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  submissionId: z.string().uuid().optional(),
  
  nudgeType: NudgeTypeEnum,
  
  // Sandwich content
  positivePart: z.string().min(10, "Positive acknowledgment required"),
  constructivePart: z.string().min(10, "Constructive feedback required"),
  motivationalPart: z.string().min(10, "Motivational closing required"),
  
  actionableSteps: z.array(ActionableStepSchema).optional(),
  estimatedTime: z.string().optional(),
  
  triggerEvent: z.string(),
  triggerData: z.any().optional(),
  
  escalationLevel: z.number().min(0).max(2).default(0),
})

// ============================================================================
// FINAL BUNDLE SCHEMAS
// ============================================================================

export const SkillTagSchema = z.object({
  skillId: z.string(),
  skillName: z.string(),
  proficiencyLevel: z.enum(["NOVICE", "DEVELOPING", "PROFICIENT", "EXEMPLARY"]),
  evidenceLinks: z.array(z.string()).optional(),
})

export const FinalBundleSchema = z.object({
  submissionId: z.string().uuid(),
  
  submissionSnapshot: z.any(),
  rubricSnapshot: z.any(),
  feedbackSnapshot: z.any(),
  aiUseStatementSnapshot: z.any().optional(),
  changeLog: z.array(AuditLogEntrySchema).optional(),
  vivaSummary: z.string().optional(),
  
  skillsMapTags: z.array(SkillTagSchema).optional(),
})

// ============================================================================
// CONSENSUS MODEL CALCULATION TYPES
// ============================================================================

export interface ConsensusResult {
  finalScore: number
  weightedMean: number
  standardDeviation: number
  requiresReconciliation: boolean
  governanceFlag?: "HIGH_VARIANCE_DETECTED" | "LOW_CONFIDENCE" | "BIAS_DETECTED" | null
  reviewerScores: Array<{ reviewerId: string; score: number; weight: number }>
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FeedbackStyle = z.infer<typeof FeedbackStyleEnum>
export type AcademicLevel = z.infer<typeof AcademicLevelEnum>
export type UncertaintyLevel = z.infer<typeof UncertaintyLevelEnum>
export type NudgeType = z.infer<typeof NudgeTypeEnum>
export type InterventionStatus = z.infer<typeof InterventionStatusEnum>

export type ReadyGateSelfEvaluation = z.infer<typeof ReadyGateSelfEvaluationSchema>
export type AIUseStatement = z.infer<typeof AIUseStatementSchema>
export type FeedbackCycle = z.infer<typeof FeedbackCycleSchema>
export type GradingGovernance = z.infer<typeof GradingGovernanceSchema>
export type ConsensusReview = z.infer<typeof ConsensusReviewSchema>
export type InterventionNudge = z.infer<typeof InterventionNudgeSchema>
export type FinalBundle = z.infer<typeof FinalBundleSchema>
