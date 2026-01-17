import { AIProvider, ChatMessage } from "@/types/ai.types"

/**
 * Free Groq API Provider (fast inference, rate limited but free)
 * Sign up at: https://groq.com/ for free API key
 */
class GroqProvider implements AIProvider {
    name = "groq"

    isAvailable(): boolean {
        return !!process.env.GROQ_API_KEY
    }

    getCost(): string {
        return "free (rate limited)"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        if (!this.isAvailable()) {
            throw new Error("Groq API key not configured. Get free key at https://groq.com/")
        }

        const systemPrompt = messages.find(m => m.role === "system")?.content
        const filtered = messages.filter(m => m.role !== "system")

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile", // Fast free model
                messages: [
                    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                    ...filtered
                ],
                stream: true,
                max_tokens: 1024,
            }),
        })

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`)
        }

        const encoder = new TextEncoder()
        return new ReadableStream<Uint8Array>({
            start(controller) {
                const reader = response.body?.getReader()
                if (!reader) {
                    controller.error(new Error("No response stream"))
                    return
                }

                const pump = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            const chunk = new TextDecoder().decode(value)
                            const lines = chunk.split('\n')

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6)
                                    if (data === '[DONE]') {
                                        controller.close()
                                        return
                                    }
                                    try {
                                        const parsed = JSON.parse(data)
                                        const content = parsed.choices?.[0]?.delta?.content
                                        if (content) {
                                            controller.enqueue(encoder.encode(content))
                                        }
                                    } catch (e) {
                                        // Skip malformed chunks
                                    }
                                }
                            }
                        }
                        controller.close()
                    } catch (error) {
                        controller.error(error)
                    }
                }
                pump()
            }
        })
    }
}

export const groqProvider = new GroqProvider()