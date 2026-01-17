import { AIProvider, ChatMessage } from "@/types/ai.types"

class GeminiProvider implements AIProvider {
    name = "gemini"

    isAvailable(): boolean {
        return !!(process.env.GEMINI_API_KEY)
    }

    getCost(): string {
        return "free (with limits)"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        if (!this.isAvailable()) {
            throw new Error("Gemini API key not configured")
        }

        // Convert messages to Gemini format
        const geminiMessages = this.formatMessages(messages)

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: geminiMessages,
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(`Gemini API error: ${response.status} - ${error}`)
            }

            if (!response.body) {
                throw new Error("No response body from Gemini")
            }

            // Transform Gemini's streaming format to our standard format
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

                                        // Extract content from Gemini response
                                        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                                            const text = data.candidates[0].content.parts[0].text
                                            const formattedChunk = `data: ${JSON.stringify({
                                                choices: [{
                                                    delta: { content: text }
                                                }]
                                            })}\n\n`
                                            controller.enqueue(new TextEncoder().encode(formattedChunk))
                                        }

                                        // Check if generation is complete
                                        if (data.candidates?.[0]?.finishReason) {
                                            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                                            controller.close()
                                            return
                                        }
                                    } catch (parseError) {
                                        console.warn('Failed to parse Gemini response chunk:', parseError)
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Gemini streaming error:', error)
                        controller.error(error)
                    } finally {
                        reader.releaseLock()
                    }
                },
            })

        } catch (error) {
            console.error("Gemini API error:", error)
            throw error
        }
    }

    private formatMessages(messages: ChatMessage[]): any[] {
        return messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))
    }
}

export const geminiProvider = new GeminiProvider()