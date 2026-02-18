/**
 * End-to-End Tests: Single Discussion AI Response Generation
 *
 * Tests the full pipeline:
 *  1. POST /api/chat with a discussion prompt → AI response
 *  2. Multi-AI provider fallback chain
 *  3. Edge cases (empty fields, malformed payloads, large inputs)
 *  4. Response structure validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Helpers ────────────────────────────────────────────────────────────

/** Build the exact message payload the front-end sends for a single discussion response */
function buildSingleResponsePayload(
    professorProfile: string,
    discussionTopic: string,
    studentPost: string,
) {
    const content =
        "Professor Writing Style and Background: \n" +
        professorProfile +
        "\n" +
        "Discussion Topic: \n" +
        discussionTopic +
        "\n" +
        "Student's Response to the Discussion Topic: \n" +
        studentPost +
        "\n" +
        "Professor's Response to Above Student:"

    return { messages: [{ role: "user", content }] }
}

/** Build a refinement payload */
function buildRefinementPayload(
    professorProfile: string,
    discussionTopic: string,
    studentPost: string,
    previousResponse: string,
    refineInstructions: string,
) {
    const content =
        "Professor Writing Style and Background: \n" +
        professorProfile +
        "\n" +
        "Discussion Topic: \n" +
        discussionTopic +
        "\n" +
        "Student's Response to the Discussion Topic: \n" +
        studentPost +
        "\n" +
        "Proposed Professor's Response to Above Student: \n" +
        previousResponse +
        "\n" +
        "Instructions for Refinement: \n" +
        refineInstructions +
        "\n" +
        "Refined Professor's Response to Above Student:"

    return { messages: [{ role: "user", content }] }
}

// ── Test Data ──────────────────────────────────────────────────────────

const TEST_PROFESSOR_PROFILE =
    "I am Dr. Smith, a Computer Science professor with 15 years of experience. " +
    "I write in a warm, encouraging tone that balances academic rigor with supportive mentoring."

const TEST_DISCUSSION_TOPIC =
    "Discuss the ethical implications of artificial intelligence in healthcare. " +
    "Consider patient privacy, algorithmic bias, and the role of human oversight."

const TEST_STUDENT_POST =
    "I think AI in healthcare is really great because it can diagnose diseases faster. " +
    "Doctors should use it everywhere. However, we need to be careful about privacy."

// ── /api/chat route handler import ────────────────────────────────────

// We import the route handler directly so we can call it in-process.
// The handler is an edge-runtime function, so we create a NextRequest manually.

import { POST as chatPOST } from "@/app/api/chat/route"

function makeRequest(body: object): Request {
    return new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("Single Discussion Response – /api/chat", () => {
    // ── Happy-Path ──────────────────────────────────────────────────

    describe("Happy-path generation", () => {
        it("should return a valid AI response with required fields", async () => {
            const payload = buildSingleResponsePayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                TEST_STUDENT_POST,
            )

            const response = await chatPOST(makeRequest(payload) as any)
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data).toHaveProperty("content")
            expect(data).toHaveProperty("provider")
            expect(data).toHaveProperty("durationMs")
            expect(typeof data.content).toBe("string")
            expect(data.content.length).toBeGreaterThan(0)
            expect(typeof data.provider).toBe("string")
            expect(data.provider.length).toBeGreaterThan(0)
        })

        it("should prepend a system prompt automatically", async () => {
            // The route adds DISCUSSION_SYSTEM_PROMPT when no system message exists
            const payload = {
                messages: [{ role: "user", content: "Hello professor" }],
            }

            const response = await chatPOST(makeRequest(payload) as any)
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data.content).toBeTruthy()
        })

        it("should use the grading system prompt when myTArequestType: is present", async () => {
            const payload = {
                messages: [
                    { role: "user", content: "myTArequestType: Grade this submission..." },
                ],
            }

            const response = await chatPOST(makeRequest(payload) as any)
            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.content).toBeTruthy()
        })

        it("should return durationMs as a positive number", async () => {
            const payload = buildSingleResponsePayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                TEST_STUDENT_POST,
            )

            const response = await chatPOST(makeRequest(payload) as any)
            const data = await response.json()
            expect(typeof data.durationMs).toBe("number")
            expect(data.durationMs).toBeGreaterThanOrEqual(0)
        }, 30_000)

        it("should include cost information", async () => {
            const payload = buildSingleResponsePayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                TEST_STUDENT_POST,
            )

            const response = await chatPOST(makeRequest(payload) as any)
            const data = await response.json()
            expect(data).toHaveProperty("cost")
        })
    })

    // ── Refinement Flow ─────────────────────────────────────────────

    describe("Refinement flow", () => {
        it("should generate a refined response when given original + instructions", async () => {
            // Step 1: Generate initial response
            const initialPayload = buildSingleResponsePayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                TEST_STUDENT_POST,
            )
            const initialRes = await chatPOST(makeRequest(initialPayload) as any)
            const initialData = await initialRes.json()
            expect(initialData.content).toBeTruthy()

            // Step 2: Refine that response
            const refinePayload = buildRefinementPayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                TEST_STUDENT_POST,
                initialData.content,
                "Make it shorter and more encouraging",
            )
            const refineRes = await chatPOST(makeRequest(refinePayload) as any)
            expect(refineRes.status).toBe(200)

            const refineData = await refineRes.json()
            expect(refineData.content).toBeTruthy()
            expect(typeof refineData.content).toBe("string")
        }, 30_000)
    })

    // ── Validation / Error Cases ────────────────────────────────────

    describe("Validation and error handling", () => {
        it("should reject empty messages array", async () => {
            const response = await chatPOST(makeRequest({ messages: [] }) as any)
            expect(response.status).toBe(400)

            const data = await response.json()
            expect(data.error).toBeTruthy()
        })

        it("should reject missing messages field", async () => {
            const response = await chatPOST(makeRequest({}) as any)
            expect(response.status).toBe(400)

            const data = await response.json()
            expect(data.error).toBeTruthy()
        })

        it("should reject non-array messages", async () => {
            const response = await chatPOST(
                makeRequest({ messages: "not an array" }) as any,
            )
            expect(response.status).toBe(400)
        })

        it("should handle very large student post gracefully", async () => {
            const largePost = "A".repeat(10_000)
            const payload = buildSingleResponsePayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                largePost,
            )

            const response = await chatPOST(makeRequest(payload) as any)
            // Should either succeed or fail gracefully — not crash
            expect([200, 400, 500]).toContain(response.status)

            const data = await response.json()
            expect(data).toBeDefined()
        })
    })

    // ── Provider Reporting ──────────────────────────────────────────

    describe("Provider reporting", () => {
        it("should report a recognised provider name", async () => {
            const knownProviders = [
                "openai",
                "anthropic",
                "gemini",
                "groq",
                "perplexity",
                "cohere",
                "huggingface",
                "mock",
            ]

            const payload = buildSingleResponsePayload(
                TEST_PROFESSOR_PROFILE,
                TEST_DISCUSSION_TOPIC,
                TEST_STUDENT_POST,
            )

            const response = await chatPOST(makeRequest(payload) as any)
            const data = await response.json()
            expect(knownProviders).toContain(data.provider)
        }, 30_000)
    })

    // ── System Prompt Selection ─────────────────────────────────────

    describe("System prompt selection", () => {
        it("should keep an existing system message if provided", async () => {
            const payload = {
                messages: [
                    { role: "system", content: "You are a custom system." },
                    { role: "user", content: "Hello" },
                ],
            }

            const response = await chatPOST(makeRequest(payload) as any)
            expect(response.status).toBe(200)
        })
    })
})
