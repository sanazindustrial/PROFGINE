import { AIProvider, ChatMessage } from "@/types/ai.types"
import OpenAI from "openai"

// Singleton OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
})

class OpenAIProvider implements AIProvider {
    name = "openai"

    isAvailable(): boolean {
        return !!process.env.OPENAI_API_KEY
    }

    getCost(): string {
        return "paid"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        if (!this.isAvailable()) {
            throw new Error("OpenAI API key not configured")
        }

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            stream: true,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        })

        const encoder = new TextEncoder()
        return new ReadableStream<Uint8Array>({
            start(controller) {
                const processStream = async () => {
                    try {
                        for await (const chunk of response) {
                            const content = chunk.choices[0]?.delta?.content
                            if (content) {
                                controller.enqueue(encoder.encode(content))
                            }
                        }
                        controller.close()
                    } catch (error) {
                        controller.error(error)
                    }
                }
                processStream()
            }
        })
    }
}

export const openaiProvider = new OpenAIProvider()