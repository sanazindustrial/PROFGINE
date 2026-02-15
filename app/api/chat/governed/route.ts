/**
 * Governed AI Chat API Route
 * 
 * All prompts are processed through the Prompt Governance Engine before
 * being sent to AI providers. This ensures:
 * - Context-aware prompts with course metadata injection
 * - Policy-compliant interactions
 * - Role-appropriate access control
 * - Non-authoritative AI outputs (drafts only)
 * - Complete audit trail
 * 
 * NO RAW PROMPTS GO DIRECTLY TO AI MODELS. EVER.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { multiAI } from "@/adaptors/multi-ai.adaptor"
import { ChatMessage } from "@/types/ai.types"
import {
    promptGovernance,
    createGovernanceContext,
    GovernedPrompt,
} from "@/lib/services/prompt-governance.service"

export const maxDuration = 60 // Allow up to 60s for AI generation

interface GovernedChatRequest {
    messages: ChatMessage[]
    toolInvoked: string        // e.g., "GENIE_ADVISORY", "GENERATE_OBJECTIVES"
    courseId?: string          // Optional: for course-specific context
}

interface GovernedChatResponse {
    content: string
    provider: string
    promptId: string
    decision: 'ALLOW' | 'BLOCK' | 'ESCALATE'
    blockReason?: string
    cost?: unknown  // Cost structure varies by provider
    durationMs: number
}

const readStreamToString = async (stream: ReadableStream<Uint8Array>): Promise<string> => {
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

export async function POST(request: NextRequest) {
    const start = Date.now()

    try {
        // 1. Require authenticated session
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // 2. Parse request body
        const body = await request.json() as GovernedChatRequest
        const { messages, toolInvoked, courseId } = body

        if (!messages?.length) {
            return NextResponse.json(
                { error: "Messages are required" },
                { status: 400 }
            )
        }

        if (!toolInvoked) {
            return NextResponse.json(
                { error: "toolInvoked is required" },
                { status: 400 }
            )
        }

        // 3. Create governance context
        const userRole = session.user.role
        const context = await createGovernanceContext(
            session.user.id,
            userRole,
            toolInvoked,
            courseId
        )

        // 4. Get user prompt from messages
        const userPrompt = messages
            .filter(m => m.role === "user")
            .map(m => m.content)
            .join("\n")

        // 5. Apply prompt governance
        const governed: GovernedPrompt = await promptGovernance.governPrompt(
            userPrompt,
            toolInvoked,
            context
        )

        // 6. If blocked, return error with reason
        if (governed.decision !== 'ALLOW') {
            return NextResponse.json({
                content: '',
                provider: 'none',
                promptId: governed.promptId,
                decision: governed.decision,
                blockReason: governed.blockReason,
                durationMs: Date.now() - start,
            } satisfies GovernedChatResponse)
        }

        // 7. Build governed messages for AI
        const governedMessages: ChatMessage[] = [
            {
                role: "system",
                content: governed.governedPrompt,
            },
        ]

        // 8. Stream response from AI provider
        const { stream, provider, cost } = await multiAI.streamChat(governedMessages)
        const content = await readStreamToString(stream)

        // 9. Log response hash for audit trail
        await promptGovernance.logResponseHash(
            governed.promptId,
            provider,
            content
        )

        // 10. Return governed response
        const response: GovernedChatResponse = {
            content,
            provider,
            promptId: governed.promptId,
            decision: 'ALLOW',
            cost,
            durationMs: Date.now() - start,
        }

        return NextResponse.json(response)

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage === "UNAUTHORIZED") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }
        console.error("Governed chat error:", error)
        return NextResponse.json(
            { error: "Governed chat failed" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/chat/governed - Get available tools for the current user's role
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const templates = promptGovernance.getAvailableTemplates(session.user.role)

        return NextResponse.json({
            role: session.user.role,
            availableTools: templates.map(t => ({
                id: t.id,
                type: t.type,
                authority: t.authority,
                allowedActions: t.allowedActions,
                blockedActions: t.blockedActions,
            })),
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage === "UNAUTHORIZED") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }
        console.error("Get governed tools error:", error)
        return NextResponse.json(
            { error: "Failed to get available tools" },
            { status: 500 }
        )
    }
}
