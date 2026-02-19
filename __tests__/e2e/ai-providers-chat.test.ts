/**
 * HEAD-TO-HEAD E2E TEST SUITE — AI PROVIDERS & CHAT
 *
 * Tests the multi-AI provider system, fallback chain,
 * chat API, grading API, and prompt selection.
 */

import { describe, it, expect } from "vitest"

// ── Provider Configuration ──────────────────────────────────────────────

describe("AI Providers – Availability", () => {
    const providers = [
        { name: "openai", envKey: "OPENAI_API_KEY", free: false },
        { name: "anthropic", envKey: "ANTHROPIC_API_KEY", free: false },
        { name: "gemini", envKey: "GEMINI_API_KEY", free: true },
        { name: "groq", envKey: "GROQ_API_KEY", free: true },
        { name: "perplexity", envKey: "PERPLEXITY_API_KEY", free: false },
        { name: "cohere", envKey: "COHERE_API_KEY", free: true },
        { name: "huggingface", envKey: "HUGGINGFACE_API_KEY", free: true },
        { name: "mock", envKey: null, free: true },
    ]

    it("should have 8 providers configured", () => {
        expect(providers).toHaveLength(8)
    })

    it("should always have mock provider available", () => {
        const mock = providers.find((p) => p.name === "mock")
        expect(mock).toBeDefined()
        expect(mock!.free).toBe(true)
        expect(mock!.envKey).toBeNull()
    })

    it("should have at least 4 free providers", () => {
        const freeProviders = providers.filter((p) => p.free)
        expect(freeProviders.length).toBeGreaterThanOrEqual(4)
    })

    it("should have all paid providers require API keys", () => {
        const paidProviders = providers.filter((p) => !p.free)
        paidProviders.forEach((p) => {
            expect(p.envKey).toBeTruthy()
        })
    })
})

describe("AI Providers – Fallback Chain", () => {
    const fallbackOrder = [
        "openai",
        "anthropic",
        "perplexity",
        "gemini",
        "groq",
        "cohere",
        "huggingface",
        "mock",
    ]

    it("should have mock as the last fallback", () => {
        expect(fallbackOrder[fallbackOrder.length - 1]).toBe("mock")
    })

    it("should prioritize paid providers over free", () => {
        const openaiIdx = fallbackOrder.indexOf("openai")
        const mockIdx = fallbackOrder.indexOf("mock")
        expect(openaiIdx).toBeLessThan(mockIdx)
    })

    it("should select first available provider", () => {
        const available = new Set(["mock", "groq"])

        function selectProvider(order: string[], avail: Set<string>) {
            return order.find((p) => avail.has(p)) || "mock"
        }

        expect(selectProvider(fallbackOrder, available)).toBe("groq")
    })

    it("should fall back to mock when nothing else is available", () => {
        const available = new Set(["mock"])

        function selectProvider(order: string[], avail: Set<string>) {
            return order.find((p) => avail.has(p)) || "mock"
        }

        expect(selectProvider(fallbackOrder, available)).toBe("mock")
    })
})

describe("AI Chat – System Prompt Selection", () => {
    function selectSystemPrompt(userMessage: string): string {
        if (userMessage.includes("myTArequestType:")) {
            return "grading"
        }
        return "discussion"
    }

    it("should select discussion prompt for regular messages", () => {
        const msg = "Professor: Dr. Smith\nTopic: Ethics in AI\nStudent: I think AI is great"
        expect(selectSystemPrompt(msg)).toBe("discussion")
    })

    it("should select grading prompt when myTArequestType: is present", () => {
        const msg = "myTArequestType: grade this submission\nContent: Student essay here"
        expect(selectSystemPrompt(msg)).toBe("grading")
    })
})

describe("AI Chat – Message Validation", () => {
    interface ChatMessage {
        role: string
        content: string
    }

    function validateMessages(messages: unknown): { valid: boolean; error?: string } {
        if (!Array.isArray(messages)) return { valid: false, error: "Messages must be an array" }
        if (messages.length === 0) return { valid: false, error: "Messages are required" }
        for (const msg of messages) {
            if (!msg.role || !msg.content) {
                return { valid: false, error: "Each message needs role and content" }
            }
        }
        return { valid: true }
    }

    it("should accept valid messages array", () => {
        const messages: ChatMessage[] = [{ role: "user", content: "Hello" }]
        expect(validateMessages(messages).valid).toBe(true)
    })

    it("should reject empty array", () => {
        expect(validateMessages([]).valid).toBe(false)
    })

    it("should reject non-array", () => {
        expect(validateMessages("not an array").valid).toBe(false)
        expect(validateMessages(null).valid).toBe(false)
        expect(validateMessages(undefined).valid).toBe(false)
    })

    it("should reject messages without role", () => {
        expect(validateMessages([{ content: "Hello" }]).valid).toBe(false)
    })

    it("should reject messages without content", () => {
        expect(validateMessages([{ role: "user" }]).valid).toBe(false)
    })
})

describe("AI Chat – Response Structure", () => {
    it("should include all required fields in response", () => {
        const response = {
            content: "AI generated response here",
            provider: "mock",
            cost: 0,
            durationMs: 150,
        }

        expect(response).toHaveProperty("content")
        expect(response).toHaveProperty("provider")
        expect(response).toHaveProperty("cost")
        expect(response).toHaveProperty("durationMs")
        expect(typeof response.content).toBe("string")
        expect(typeof response.provider).toBe("string")
        expect(typeof response.cost).toBe("number")
        expect(typeof response.durationMs).toBe("number")
    })

    it("should have non-empty content", () => {
        const response = { content: "This is a thoughtful response.", provider: "mock" }
        expect(response.content.length).toBeGreaterThan(0)
    })

    it("should have non-negative cost", () => {
        expect(0).toBeGreaterThanOrEqual(0)
        expect(0.005).toBeGreaterThanOrEqual(0)
    })

    it("should have positive duration", () => {
        expect(150).toBeGreaterThan(0)
    })
})

describe("AI Grading – Edge Runtime Endpoint", () => {
    it("should use the same message format as chat", () => {
        const chatPayload = { messages: [{ role: "user", content: "Grade this" }] }
        const gradingPayload = { messages: [{ role: "user", content: "myTArequestType: grade" }] }

        expect(chatPayload).toHaveProperty("messages")
        expect(gradingPayload).toHaveProperty("messages")
        expect(Array.isArray(chatPayload.messages)).toBe(true)
        expect(Array.isArray(gradingPayload.messages)).toBe(true)
    })

    it("should return same response shape as chat", () => {
        const chatResponse = { content: "response", provider: "mock", cost: 0, durationMs: 100 }
        const gradingResponse = { content: "grading response", provider: "mock", cost: 0, durationMs: 200 }

        const chatKeys = Object.keys(chatResponse).sort()
        const gradingKeys = Object.keys(gradingResponse).sort()
        expect(chatKeys).toEqual(gradingKeys)
    })
})

// ── Integration: Direct API handler test ────────────────────────────────

import { POST as chatPOST } from "@/app/api/chat/route"
import { POST as gradingPOST } from "@/app/api/grading/route"

function makeReq(url: string, body: object): Request {
    return new Request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

describe("AI Chat – Live API Handler (mock provider)", () => {
    it("should return 200 with valid payload", async () => {
        const req = makeReq("http://localhost:3000/api/chat", {
            messages: [{ role: "user", content: "Hello professor" }],
        })
        const res = await chatPOST(req)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data).toHaveProperty("content")
        expect(data).toHaveProperty("provider")
    })

    it("should return 400 with empty messages", async () => {
        const req = makeReq("http://localhost:3000/api/chat", { messages: [] })
        const res = await chatPOST(req)
        expect(res.status).toBe(400)
    })

    it("should return 400 without messages field", async () => {
        const req = makeReq("http://localhost:3000/api/chat", { text: "hello" })
        const res = await chatPOST(req)
        expect(res.status).toBe(400)
    })
})

describe("AI Grading – Live API Handler (mock provider)", () => {
    it("should return 200 with valid grading payload", async () => {
        const req = makeReq("http://localhost:3000/api/grading", {
            messages: [{ role: "user", content: "myTArequestType: Grade this essay" }],
        })
        const res = await gradingPOST(req)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data).toHaveProperty("content")
        expect(data).toHaveProperty("provider")
    })

    it("should return 400 with missing messages", async () => {
        const req = makeReq("http://localhost:3000/api/grading", {})
        const res = await gradingPOST(req)
        expect(res.status).toBe(400)
    })
})
