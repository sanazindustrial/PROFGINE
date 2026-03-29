/**
 * AI Ethics & Explainability Layer for Professor GENIE
 *
 * Provides:
 * - AI transparency metadata on every response
 * - Ethical guardrails for educational content
 * - Bias detection flags
 * - Content provenance and confidence signaling
 * - Audit trail for AI-generated content
 */

export interface AIEthicsMetadata {
    /** Unique trace ID for audit logging */
    traceId: string
    /** ISO timestamp of generation */
    generatedAt: string
    /** AI model/provider used */
    provider: string
    /** Disclosure: this content is AI-generated */
    aiGenerated: true
    /** Confidence level (low/medium/high) */
    confidence: "low" | "medium" | "high"
    /** Ethical flags raised during generation */
    ethicsFlags: string[]
    /** Content categories detected */
    contentCategories: string[]
    /** Whether human review is recommended */
    humanReviewRecommended: boolean
    /** Explanation of why the AI produced this response */
    reasoning?: string
}

export interface EthicsCheckResult {
    passed: boolean
    flags: string[]
    blockedReason?: string
}

// Topics that require extra care in educational settings
const SENSITIVE_EDUCATIONAL_TOPICS = [
    /\b(suicide|self[- ]harm|eating disorder)\b/i,
    /\b(racial|ethnic)\s+(superiority|inferiority)\b/i,
    /\b(political\s+propaganda|indoctrination)\b/i,
    /\b(plagiari[sz]e|cheat|buy\s+essay)\b/i,
    /\b(hack|exploit|bypass\s+security)\b/i,
]

// Patterns indicating potential bias in grading/feedback
const BIAS_INDICATORS = [
    /\b(always|never)\s+(fail|succeed|wrong|right)\b/i,
    /\b(obviously|clearly)\s+(wrong|incorrect|stupid)\b/i,
    /\b(students? like (you|them))\b/i,
    /\b(typical (male|female|man|woman))\b/i,
]

// Content that should never be generated for educational AI
const PROHIBITED_CONTENT = [
    /\b(generate|write|create)\s+(malware|virus|exploit)\b/i,
    /\b(how to|instructions for)\s+(hack|break into|steal)\b/i,
    /\b(complete\s+the\s+assignment\s+for\s+me)\b/i,
]

/**
 * Pre-generation ethics check on user input.
 * Runs before the AI processes the request.
 */
export function preGenerationEthicsCheck(userMessage: string): EthicsCheckResult {
    const flags: string[] = []

    // Check for prohibited content requests
    for (const pattern of PROHIBITED_CONTENT) {
        if (pattern.test(userMessage)) {
            return {
                passed: false,
                flags: ["prohibited_content"],
                blockedReason: "This request falls outside the educational scope of Professor GENIE.",
            }
        }
    }

    // Flag sensitive topics (don't block — just flag for metadata)
    for (const pattern of SENSITIVE_EDUCATIONAL_TOPICS) {
        if (pattern.test(userMessage)) {
            flags.push("sensitive_topic")
            break
        }
    }

    // Check for academic integrity concerns
    if (/\b(write my|do my|complete my)\s+(essay|paper|assignment|homework)\b/i.test(userMessage)) {
        flags.push("academic_integrity_concern")
    }

    return { passed: true, flags }
}

/**
 * Post-generation ethics check on AI output.
 * Runs after the AI generates a response.
 */
export function postGenerationEthicsCheck(aiResponse: string): EthicsCheckResult {
    const flags: string[] = []

    // Check for potential bias in grading feedback
    for (const pattern of BIAS_INDICATORS) {
        if (pattern.test(aiResponse)) {
            flags.push("potential_bias_detected")
            break
        }
    }

    // Check if response contains absolute/unfair grading language
    if (/\b(you will fail|guaranteed.*[FA]|hopeless|give up)\b/i.test(aiResponse)) {
        flags.push("discouraging_language")
    }

    // Check for hallucination indicators (overly specific citations without grounding)
    if (/\b(according to.*(?:page|chapter)\s+\d+)\b/i.test(aiResponse)) {
        flags.push("unverified_citation")
    }

    return { passed: true, flags }
}

/**
 * Generate ethics metadata for an AI response.
 */
export function createEthicsMetadata(
    provider: string,
    inputFlags: string[],
    outputFlags: string[],
    options?: { reasoning?: string }
): AIEthicsMetadata {
    const allFlags = [...new Set([...inputFlags, ...outputFlags])]
    const contentCategories: string[] = []

    if (inputFlags.includes("sensitive_topic")) contentCategories.push("sensitive")
    if (inputFlags.includes("academic_integrity_concern")) contentCategories.push("academic_integrity")
    if (outputFlags.includes("potential_bias_detected")) contentCategories.push("bias_review")
    if (outputFlags.includes("unverified_citation")) contentCategories.push("citation_review")

    return {
        traceId: generateTraceId(),
        generatedAt: new Date().toISOString(),
        provider,
        aiGenerated: true,
        confidence: allFlags.length === 0 ? "high" : allFlags.length <= 2 ? "medium" : "low",
        ethicsFlags: allFlags,
        contentCategories,
        humanReviewRecommended: allFlags.length > 0,
        reasoning: options?.reasoning,
    }
}

/**
 * AI Disclosure text to include in UI.
 */
export const AI_DISCLOSURE = {
    short: "AI-generated content — review before use.",
    full: "This content was generated by AI (Professor GENIE). It should be reviewed by a qualified educator before use in academic settings. AI-generated content may contain inaccuracies and should not be the sole basis for grading decisions.",
    grading: "AI-assisted grading suggestion — final grading decisions should always be made by the instructor. This feedback is provided as a starting point and may not capture all nuances of the student's work.",
    discussion: "AI-generated discussion response — this content is meant to assist the professor in formulating responses. It should be personalized and verified before posting.",
}

function generateTraceId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return `pg-${timestamp}-${random}`
}
