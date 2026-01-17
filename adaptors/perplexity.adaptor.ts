import { AIProvider, ChatMessage } from "@/types/ai.types"

class PerplexityProvider implements AIProvider {
    name = "perplexity"

    isAvailable(): boolean {
        return !!(process.env.PERPLEXITY_API_KEY)
    }

    getCost(): string {
        return "paid (research-focused)"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        if (!this.isAvailable()) {
            throw new Error("Perplexity API key not configured")
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online', // Research-focused model
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048,
                    stream: true
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(`Perplexity API error: ${response.status} - ${error}`)
            }

            if (!response.body) {
                throw new Error("No response body from Perplexity")
            }

            // Perplexity uses OpenAI-compatible streaming format
            return response.body

        } catch (error) {
            console.error("Perplexity API error:", error)
            throw error
        }
    }
}

export const perplexityProvider = new PerplexityProvider()