import { AIProvider, ChatMessage } from "@/types/ai.types"

class CohereProvider implements AIProvider {
    name = "cohere"

    isAvailable(): boolean {
        return !!(process.env.COHERE_API_KEY)
    }

    getCost(): string {
        return "free (with limits)"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        if (!this.isAvailable()) {
            throw new Error("Cohere API key not configured")
        }

        // Convert messages to Cohere chat format
        const cohereMessages = this.formatMessages(messages)

        try {
            const response = await fetch('https://api.cohere.ai/v1/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'command-r', // Free tier model
                    message: cohereMessages.pop()?.message || '',
                    chat_history: cohereMessages,
                    temperature: 0.7,
                    max_tokens: 2048,
                    stream: true
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(`Cohere API error: ${response.status} - ${error}`)
            }

            if (!response.body) {
                throw new Error("No response body from Cohere")
            }

            // Transform Cohere's streaming format to our standard format
            return new ReadableStream({
                async start(controller) {
                    const reader = response.body!.getReader()
                    const decoder = new TextDecoder()

                    try {
                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            const chunk = decoder.decode(value, { stream: true })
                            const lines = chunk.split('\n')

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6))

                                        if (data.event_type === 'text-generation') {
                                            const text = data.text
                                            const formattedChunk = `data: ${JSON.stringify({
                                                choices: [{
                                                    delta: { content: text }
                                                }]
                                            })}\n\n`
                                            controller.enqueue(new TextEncoder().encode(formattedChunk))
                                        }

                                        if (data.event_type === 'stream-end') {
                                            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                                            controller.close()
                                            return
                                        }
                                    } catch (parseError) {
                                        console.warn('Failed to parse Cohere response chunk:', parseError)
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Cohere streaming error:', error)
                        controller.error(error)
                    } finally {
                        reader.releaseLock()
                    }
                },
            })

        } catch (error) {
            console.error("Cohere API error:", error)
            throw error
        }
    }

    private formatMessages(messages: ChatMessage[]): any[] {
        const result = []
        for (const msg of messages) {
            if (msg.role === 'user') {
                result.push({ role: 'USER', message: msg.content })
            } else if (msg.role === 'assistant') {
                result.push({ role: 'CHATBOT', message: msg.content })
            }
        }
        return result
    }
}

export const cohereProvider = new CohereProvider()