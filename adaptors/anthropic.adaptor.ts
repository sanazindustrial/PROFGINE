import Anthropic from "@anthropic-ai/sdk"
import { AIProvider, ChatMessage } from "@/types/ai.types"

// Singleton Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
})

class AnthropicAdaptor implements AIProvider {
    name = "anthropic"

    isAvailable(): boolean {
        return !!process.env.ANTHROPIC_API_KEY
    }

    getCost(): string {
        return "paid"
    }
    /**
     * Streams a chat completion from Claude Sonnet.
     * Assumptions:
     * - `system` messages are collapsed into a single system prompt (first one wins)
     * - All other messages are passed through unchanged
     */
    async streamChat(messages: ChatMessage[], modelOverride?: string) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error(
                "ANTHROPIC_API_KEY is not set. Please add it to your environment (.env.local)."
            )
        }

        const systemPrompt = messages.find((m) => m.role === "system")?.content
        const filtered = messages.filter(
            (m): m is Omit<ChatMessage, "system"> & { role: "user" | "assistant" } => m.role !== "system"
        )

        const model = modelOverride || process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022"

        const stream = await anthropic.messages.stream({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages: filtered.map((m) => ({ role: m.role, content: m.content })),
        })

        const encoder = new TextEncoder()
        return new ReadableStream<Uint8Array>({
            start(controller) {
                stream.on("text", (delta) => {
                    controller.enqueue(encoder.encode(delta))
                })
                stream.on("end", () => controller.close())
                stream.on("error", (err) => controller.error(err))
            },
            cancel() {
                // Abort logic could be added if SDK exposes cancellation API
            },
        })
    }
}

const anthropicAdaptor = new AnthropicAdaptor()
export { anthropicAdaptor }
