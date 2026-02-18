/**
 * End-to-End Tests: Bulk Discussion — Web Scan + Batch AI Response Generation
 *
 * Tests the full pipeline:
 *  1. POST /api/discussion/scan-web  → parse student posts
 *  2. POST /api/chat (per student)   → AI response for each
 *  3. Edge cases (bad URL, empty content, HTML sanitisation)
 *  4. CSV export / copy-all shape validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Route handler imports ─────────────────────────────────────────────
import { POST as scanPOST } from "@/app/api/discussion/scan-web/route"
import { POST as chatPOST } from "@/app/api/chat/route"

// ── Helpers ────────────────────────────────────────────────────────────

function makeScanRequest(body: object): Request {
    return new Request("http://localhost:3000/api/discussion/scan-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

function makeChatRequest(body: object): Request {
    return new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

// ── Test Data ──────────────────────────────────────────────────────────

const MULTI_STUDENT_PASTE = `
Student 1: John Smith
I believe that artificial intelligence in healthcare presents both tremendous opportunities and significant challenges. 
The ability to rapidly analyze medical images and patient data could revolutionize early diagnosis, potentially saving 
countless lives. However, we must remain vigilant about the biases that can be embedded in training data, which may 
lead to disparate outcomes across demographic groups.

Student 2: Jane Doe
From my research, I found that AI-driven diagnostic tools have shown remarkable accuracy in detecting certain conditions, 
sometimes surpassing human radiologists. But the ethical implications cannot be ignored. Patient consent for data usage, 
the transparency of algorithmic decision-making, and the potential displacement of healthcare workers are all critical 
issues that need to be addressed before widespread adoption.

Student 3: Alex Martinez
While I appreciate the potential benefits of AI in medicine, I think we need more regulation. The FDA approval process 
for AI medical devices seems insufficient. We've already seen cases where AI systems perform differently across racial 
groups. Without proper oversight, we risk creating a two-tier healthcare system where some patients receive AI-enhanced 
care while others are left behind.
`

const SINGLE_LONG_POST = `
Re: Discussion on AI Ethics
I think machine learning is going to change everything about how we practice medicine. From predictive analytics 
that can forecast patient outcomes to natural language processing that can extract insights from clinical notes, 
the possibilities seem endless. However, I'm concerned about the black-box nature of deep learning models. How 
can a physician explain to a patient why an AI recommended a particular treatment when even the developers can't 
fully explain the model's reasoning? This lack of interpretability is a fundamental ethical issue that the medical 
AI community must address before these tools become standard practice.
`

const HTML_CONTENT = `
<html>
<head><title>Discussion Board</title></head>
<body>
<div class="post">
    <h3>Posted by Sarah Chen</h3>
    <p>The integration of AI in healthcare raises fundamental questions about the nature of the doctor-patient 
    relationship. When an AI system makes a diagnosis, who bears responsibility for errors? The physician who 
    relied on the AI, the hospital that deployed it, or the company that developed it? These liability questions 
    remain largely unresolved.</p>
</div>
<div class="post">
    <h3>Posted by Michael Brown</h3>
    <p>I want to highlight the issue of data privacy in AI healthcare applications. Training these models requires 
    massive datasets of patient information. Even with de-identification, research has shown that individuals can 
    often be re-identified from supposedly anonymous data. We need stronger protections.</p>
</div>
</body>
</html>
`

const PROFESSOR_PROFILE =
    "I am Dr. Williams, teaching Bioethics. I use a Socratic method, " +
    "asking probing questions while offering constructive encouragement."

const DISCUSSION_TOPIC =
    "What are the ethical implications of deploying AI diagnostic tools in hospitals?"

// ── Tests ──────────────────────────────────────────────────────────────

describe("Bulk Discussion – /api/discussion/scan-web", () => {
    // ── Paste-mode scanning ─────────────────────────────────────────

    describe("Paste-mode content scanning", () => {
        it("should parse multiple students from pasted text", async () => {
            const response = await scanPOST(
                makeScanRequest({ rawContent: MULTI_STUDENT_PASTE }) as any,
            )
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.posts).toBeDefined()
            expect(Array.isArray(data.posts)).toBe(true)
            expect(data.posts.length).toBeGreaterThanOrEqual(1)
            expect(data.totalFound).toBe(data.posts.length)
        })

        it("should return post objects with required fields", async () => {
            const response = await scanPOST(
                makeScanRequest({ rawContent: MULTI_STUDENT_PASTE }) as any,
            )
            const data = await response.json()

            for (const post of data.posts) {
                expect(post).toHaveProperty("id")
                expect(post).toHaveProperty("studentName")
                expect(post).toHaveProperty("content")
                expect(typeof post.id).toBe("string")
                expect(typeof post.studentName).toBe("string")
                expect(typeof post.content).toBe("string")
                expect(post.content.length).toBeGreaterThan(0)
            }
        })

        it("should treat a single long post as one student", async () => {
            const response = await scanPOST(
                makeScanRequest({ rawContent: SINGLE_LONG_POST }) as any,
            )
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.posts.length).toBeGreaterThanOrEqual(1)
        })

        it("should return rawContentLength", async () => {
            const response = await scanPOST(
                makeScanRequest({ rawContent: MULTI_STUDENT_PASTE }) as any,
            )
            const data = await response.json()
            expect(data.rawContentLength).toBeGreaterThan(0)
        })
    })

    // ── HTML content parsing ────────────────────────────────────────

    describe("HTML content extraction", () => {
        it("should parse posts from HTML-shaped rawContent", async () => {
            // Note: rawContent is NOT run through extractTextFromHTML (that only
            // happens for URL-fetched content). So HTML tags will remain in the
            // parsed posts when pasting raw HTML. This test validates the scan
            // still succeeds and returns posts.
            const response = await scanPOST(
                makeScanRequest({ rawContent: HTML_CONTENT }) as any,
            )
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.posts.length).toBeGreaterThanOrEqual(1)
            expect(data.rawContentLength).toBeGreaterThan(0)
        })
    })

    // ── Validation / Error Cases ────────────────────────────────────

    describe("Validation and error handling", () => {
        it("should reject when neither url nor rawContent is provided", async () => {
            const response = await scanPOST(makeScanRequest({}) as any)
            expect(response.status).toBe(400)

            const data = await response.json()
            expect(data.error).toBeTruthy()
        })

        it("should reject invalid URL format", async () => {
            const response = await scanPOST(
                makeScanRequest({ url: "not-a-url" }) as any,
            )
            expect(response.status).toBe(400)

            const data = await response.json()
            expect(data.error).toMatch(/invalid url/i)
        })

        it("should handle very short content (< 50 chars) gracefully", async () => {
            const response = await scanPOST(
                makeScanRequest({ rawContent: "Short" }) as any,
            )
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data.success).toBe(true)
            // Short content may yield 0 posts (under 50-char threshold)
            expect(data.posts.length).toBeGreaterThanOrEqual(0)
        })

        it("should handle empty rawContent string", async () => {
            const response = await scanPOST(
                makeScanRequest({ rawContent: "" }) as any,
            )
            // Empty string is falsy → treated as missing → 400
            expect(response.status).toBe(400)
        })

        it("should cap post content at 2000 characters", async () => {
            const longPost = "Student 1: Long Post\n" + "A".repeat(3000)
            const response = await scanPOST(
                makeScanRequest({ rawContent: longPost }) as any,
            )
            const data = await response.json()
            for (const post of data.posts) {
                expect(post.content.length).toBeLessThanOrEqual(2000)
            }
        })
    })
})

// ── Full Pipeline: Scan → Generate Responses ────────────────────────

describe("Full Bulk Pipeline: Scan → Generate AI Responses", () => {
    it("should scan pasted content and generate AI response for each student", async () => {
        // Step 1: Scan content for student posts
        const scanRes = await scanPOST(
            makeScanRequest({ rawContent: MULTI_STUDENT_PASTE }) as any,
        )
        expect(scanRes.status).toBe(200)

        const scanData = await scanRes.json()
        expect(scanData.posts.length).toBeGreaterThanOrEqual(1)

        // Step 2: Generate an AI response for the first student post
        const firstPost = scanData.posts[0]
        const chatBody = {
            messages: [
                {
                    role: "user",
                    content:
                        `Professor Writing Style and Background:\n${PROFESSOR_PROFILE}\n\n` +
                        `Discussion Topic:\n${DISCUSSION_TOPIC}\n\n` +
                        `Student's Post (${firstPost.studentName}):\n${firstPost.content}\n\n` +
                        `Professor's Response to this student (personalized, encouraging, and constructive):`,
                },
            ],
        }

        const chatRes = await chatPOST(makeChatRequest(chatBody) as any)
        expect(chatRes.status).toBe(200)

        const chatData = await chatRes.json()
        expect(chatData.content).toBeTruthy()
        expect(typeof chatData.content).toBe("string")
        expect(chatData.content.length).toBeGreaterThan(10)
        expect(chatData.provider).toBeTruthy()
    })

    it("should generate responses for ALL scanned students sequentially", async () => {
        // Step 1: Scan
        const scanRes = await scanPOST(
            makeScanRequest({ rawContent: MULTI_STUDENT_PASTE }) as any,
        )
        const scanData = await scanRes.json()
        const posts = scanData.posts

        expect(posts.length).toBeGreaterThanOrEqual(1)

        // Step 2: Generate response for each student (mirrors bulk-discussion-response.tsx logic)
        const results: Array<{
            studentName: string
            aiResponse: string
            provider: string
            status: string
        }> = []

        for (const post of posts) {
            const content =
                `Professor Writing Style and Background:\n${PROFESSOR_PROFILE}\n\n` +
                `Discussion Topic:\n${DISCUSSION_TOPIC}\n\n` +
                `Student's Post (${post.studentName}):\n${post.content}\n\n` +
                `Professor's Response to this student (personalized, encouraging, and constructive):`

            try {
                const chatRes = await chatPOST(
                    makeChatRequest({ messages: [{ role: "user", content }] }) as any,
                )
                const chatData = await chatRes.json()

                if (chatRes.status === 200 && chatData.content) {
                    results.push({
                        studentName: post.studentName,
                        aiResponse: chatData.content,
                        provider: chatData.provider || "",
                        status: "completed",
                    })
                } else {
                    results.push({
                        studentName: post.studentName,
                        aiResponse: "",
                        provider: "",
                        status: "error",
                    })
                }
            } catch {
                results.push({
                    studentName: post.studentName,
                    aiResponse: "",
                    provider: "",
                    status: "error",
                })
            }
        }

        // Verify all students got responses
        expect(results.length).toBe(posts.length)
        const completedCount = results.filter((r) => r.status === "completed").length
        expect(completedCount).toBeGreaterThanOrEqual(1)

        // Verify response content structures
        for (const result of results.filter((r) => r.status === "completed")) {
            expect(result.aiResponse.length).toBeGreaterThan(10)
            expect(result.provider).toBeTruthy()
        }
    }, 60_000)

    it("should produce responses exportable as CSV", async () => {
        // Scan + generate for first student, then verify CSV shape
        const scanRes = await scanPOST(
            makeScanRequest({ rawContent: MULTI_STUDENT_PASTE }) as any,
        )
        const scanData = await scanRes.json()
        const post = scanData.posts[0]

        const chatRes = await chatPOST(
            makeChatRequest({
                messages: [
                    {
                        role: "user",
                        content:
                            `Professor Writing Style and Background:\n${PROFESSOR_PROFILE}\n\n` +
                            `Discussion Topic:\n${DISCUSSION_TOPIC}\n\n` +
                            `Student's Post (${post.studentName}):\n${post.content}\n\n` +
                            `Professor's Response:`,
                    },
                ],
            }) as any,
        )
        const chatData = await chatRes.json()

        // Build CSV row the same way the component does
        const headers = ["Student Name", "Original Post", "AI Response"]
        const row = [
            post.studentName,
            `"${post.content.replace(/"/g, '""')}"`,
            `"${chatData.content.replace(/"/g, '""')}"`,
        ]
        const csvLine = [headers.join(","), row.join(",")].join("\n")

        expect(csvLine).toContain("Student Name")
        expect(csvLine).toContain("Original Post")
        expect(csvLine).toContain("AI Response")
        // Content may contain embedded newlines, so just verify we have at least header + data
        expect(csvLine.split("\n").length).toBeGreaterThanOrEqual(2)
    }, 30_000)
})

// ── Multi-AI Provider Fallback ──────────────────────────────────────

describe("Multi-AI Provider Fallback", () => {
    it("should always return a response even with mock fallback", async () => {
        const payload = {
            messages: [
                {
                    role: "user",
                    content:
                        "Professor Profile: Test professor\n" +
                        "Discussion Topic: Ethics of AI\n" +
                        "Student Post: I think AI is interesting.\n" +
                        "Professor's Response:",
                },
            ],
        }

        const response = await chatPOST(makeChatRequest(payload) as any)
        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data.content).toBeTruthy()
        // The mock provider is always available as ultimate fallback
        expect(data.provider).toBeTruthy()
    })
})

// ── Post Parsing Logic ──────────────────────────────────────────────

describe("Student Post Parsing Patterns", () => {
    it("should handle 'Re:' delimited posts", async () => {
        const content = `
Re: Ethics Discussion
I believe AI needs regulation in healthcare.

Re: Ethics Discussion  
The benefits of AI in medicine outweigh the risks if properly managed.

Re: Ethics Discussion
We should focus on transparency and patient consent.
`
        const response = await scanPOST(
            makeScanRequest({ rawContent: content }) as any,
        )
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.posts.length).toBeGreaterThanOrEqual(1)
    })

    it("should handle 'Post N:' delimited content", async () => {
        const content = `
Post 1: Healthcare AI is transforming diagnostic radiology and pathology, enabling faster and more accurate detection of diseases. The integration requires careful consideration of ethical boundaries and patient consent.

Post 2: I disagree with the notion that AI will replace physicians. Instead, it should serve as a tool that augments human expertise. The key challenge is ensuring equitable access across different socioeconomic groups so that AI benefits are not limited to wealthy institutions.

Post 3: Data privacy concerns are paramount when implementing AI healthcare systems. Protected health information used for training algorithms must be properly anonymised and secured against breaches.
`
        const response = await scanPOST(
            makeScanRequest({ rawContent: content }) as any,
        )
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.posts.length).toBeGreaterThanOrEqual(2)
    })

    it("should handle 'Student N:' delimited content", async () => {
        const content = `
Student 1: Emily Watson
The use of machine learning in predicting patient deterioration is a promising application. Our hospital's early warning system has reduced ICU transfers by 20%.

Student 2: James Park
While predictive models show promise, we must consider the false positive rate. Alarm fatigue among clinicians is a real concern that could diminish the effectiveness of AI warning systems.
`
        const response = await scanPOST(
            makeScanRequest({ rawContent: content }) as any,
        )
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.posts.length).toBeGreaterThanOrEqual(2)
    })

    it("should handle 'Response:' delimited content", async () => {
        const content = `
Response: AI-based telemedicine platforms have significantly improved healthcare access in rural areas. Patients can now receive specialist consultations without traveling long distances, which is particularly beneficial for chronic disease management.

Response: The implementation of natural language processing in electronic health records has streamlined clinical documentation. Physicians spend less time on paperwork and more time with patients, improving both efficiency and care quality.
`
        const response = await scanPOST(
            makeScanRequest({ rawContent: content }) as any,
        )
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.posts.length).toBeGreaterThanOrEqual(1)
    })
})
