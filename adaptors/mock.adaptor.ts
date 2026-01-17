import { AIProvider, ChatMessage } from "@/types/ai.types"

/**
 * Mock/Demo AI Provider for testing without API keys
 */
class MockProvider implements AIProvider {
    name = "mock"

    isAvailable(): boolean {
        return true // Always available
    }

    getCost(): string {
        return "free (demo only)"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        const lastMessage = messages[messages.length - 1]?.content || "Hello"

        // Generate a mock response based on the request
        const responses = [
            "This is a demo AI response. To use real AI, please configure API keys for Groq, Hugging Face, OpenAI, or Anthropic.",
            `I understand you said: "${lastMessage}". This is a simulated response for demonstration purposes.`,
            "For production use, please add real AI provider API keys to your .env file.",
            "This mock AI helps you test the application without requiring paid API access.",
        ]

        const response = responses[Math.floor(Math.random() * responses.length)]

        const encoder = new TextEncoder()
        return new ReadableStream<Uint8Array>({
            start(controller) {
                // Simulate streaming by sending response in chunks
                const words = response.split(' ')
                let index = 0

                const sendWord = () => {
                    if (index < words.length) {
                        const word = words[index] + (index < words.length - 1 ? ' ' : '')
                        controller.enqueue(encoder.encode(word))
                        index++
                        setTimeout(sendWord, 50) // Simulate typing delay
                    } else {
                        controller.close()
                    }
                }

                sendWord()
            }
        })
    }
}

export const mockProvider = new MockProvider()