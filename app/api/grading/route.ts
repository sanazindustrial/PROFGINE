import { NextRequest, NextResponse } from "next/server"
import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { ChatMessage } from "@/types/ai.types"

export const runtime = "edge"

const GRADING_SYSTEM_PROMPT =
    "You are an AI grading assistant. Provide structured, fair, and actionable feedback aligned with the rubric and assignment context."

const readStreamToString = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let result = ""

    while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) result += decoder.decode(value, { stream: true })
    }

    result += decoder.decode()
    return result
}

const withSystemPrompt = (messages: ChatMessage[]): ChatMessage[] => {
    if (!messages?.length) return []
    const hasSystem = messages.some((message) => message.role === "system")
    if (hasSystem) return messages
    const systemMessage: ChatMessage = { role: "system", content: GRADING_SYSTEM_PROMPT }
    return [systemMessage, ...messages]
}

export async function POST(request: NextRequest) {
    try {
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
        console.error("Grading route error:", error)
        return NextResponse.json({ error: "Grading failed" }, { status: 500 })
    }
}