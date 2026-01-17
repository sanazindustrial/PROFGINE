import { AIProvider, ChatMessage } from "@/types/ai.types"

/**
 * Hugging Face Inference API Provider (free tier available)
 * Sign up at: https://huggingface.co/settings/tokens for free API key
 */
class HuggingFaceProvider implements AIProvider {
    name = "huggingface"

    isAvailable(): boolean {
        return !!process.env.HUGGINGFACE_API_KEY
    }

    getCost(): string {
        return "free (rate limited)"
    }

    async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
        if (!this.isAvailable()) {
            throw new Error("Hugging Face API key not configured. Get free key at https://huggingface.co/settings/tokens")
        }

        // Convert messages to single prompt (HF API expects text input)
        const prompt = this.formatPrompt(messages)

        const response = await fetch(
            "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 512,
                        temperature: 0.7,
                    },
                    options: {
                        wait_for_model: true,
                    },
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.statusText}`)
        }

        const data = await response.json()
        const generatedText = data[0]?.generated_text || "No response generated"

        // Convert to streaming response
        const encoder = new TextEncoder()
        return new ReadableStream<Uint8Array>({
            start(controller) {
                const text = generatedText.replace(prompt, "").trim()
                controller.enqueue(encoder.encode(text))
                controller.close()
            }
        })
    }

    private formatPrompt(messages: ChatMessage[]): string {
        return messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n') + '\nassistant:'
    }
}

export const huggingFaceProvider = new HuggingFaceProvider()