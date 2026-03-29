import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { ChatMessage } from "@/types/ai.types"

export const runtime = "nodejs"
export const maxDuration = 60

const DISCUSSION_SYSTEM_PROMPT = `You are **Professor GENIE** — an expert AI teaching assistant built for higher education professors. You help with course design, pedagogy, curriculum planning, assessment strategy, and academic best practices.

## Formatting Rules — ALWAYS follow these
- Use **Markdown** formatting in every response.
- Open with a concise 1–2 sentence overview of your answer.
- Structure your response with **## Headings** for each major section.
- Use **### Sub-headings** to break down complex topics.
- Use **bold** for key terms, frameworks, and critical concepts.
- Use numbered lists (1. 2. 3.) for sequential steps, timelines, or ranked items.
- Use bullet points (- ) for non-sequential lists and feature breakdowns.
- Use > blockquotes for tips, best practices, or important callouts.
- Use tables (| Column | Column |) when comparing options, rubrics, or schedules.
- Use \`inline code\` for technical terms, tool names, or specific values.
- Use --- horizontal rules to separate major sections when the response is long.

## Content Depth Rules
- **Always give comprehensive, multi-section answers** — professors need thorough, ready-to-use material.
- When asked about course design: provide a full week-by-week or module-by-module breakdown.
- When asked about assessments: include rubric criteria, point distributions, and example prompts.
- When asked about learning objectives: align with Bloom's Taxonomy and include measurable verbs.
- When asked about pedagogy: reference established frameworks (Backward Design, UDL, Constructive Alignment, Active Learning).
- Include **concrete examples** wherever possible — sample questions, activities, or templates.
- End every response with a **## Summary** or **## Next Steps** section with clear action items.

## Tone & Audience
- You speak peer-to-peer with professors — knowledgeable, respectful, and practical.
- Avoid fluff. Every sentence should add value.
- If a question is vague, provide the most useful interpretation and note assumptions.`

const GRADING_SYSTEM_PROMPT =
    "You are an AI grading assistant. Provide structured, fair, and actionable feedback aligned with the rubric and assignment context."

const readStreamToString = async (stream: ReadableStream<Uint8Array>, timeoutMs = 30000) => {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let result = ""

    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Stream read timed out")), timeoutMs)
    )

    try {
        while (true) {
            const { value, done } = await Promise.race([reader.read(), timeout])
            if (done) break
            if (value) result += decoder.decode(value, { stream: true })
        }
        result += decoder.decode()
    } finally {
        reader.releaseLock()
    }

    return result
}

const withSystemPrompt = (messages: ChatMessage[]): ChatMessage[] => {
    if (!messages?.length) return []

    const hasSystem = messages.some((message) => message.role === "system")
    if (hasSystem) return messages

    const useGradingPrompt = messages[0]?.content?.includes("myTArequestType:")
    const systemContent = useGradingPrompt ? GRADING_SYSTEM_PROMPT : DISCUSSION_SYSTEM_PROMPT
    const systemMessage: ChatMessage = { role: "system", content: systemContent }

    return [systemMessage, ...messages]
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const body = await request.json()
        const rawMessages = (body?.messages || []) as ChatMessage[]

        if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 })
        }

        const messages = withSystemPrompt(rawMessages)
        const start = Date.now()

        const { stream, provider, cost } = await multiAI.streamChat(messages)
        const content = await readStreamToString(stream)

        return NextResponse.json({
            content,
            provider,
            cost,
            durationMs: Date.now() - start,
        })
    } catch (error) {
        console.error("Chat route error:", error)
        return NextResponse.json({ error: "Chat failed" }, { status: 500 })
    }
}