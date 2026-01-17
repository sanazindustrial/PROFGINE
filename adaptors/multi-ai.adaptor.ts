import { AIProvider, AIAdapterConfig, ChatMessage } from "@/types/ai.types"
import { anthropicAdaptor } from "./anthropic.adaptor"
import { openaiProvider } from "./openai-chat.adaptor"
import { groqProvider } from "./groq.adaptor"
import { huggingFaceProvider } from "./huggingface.adaptor"
import { geminiProvider } from "./gemini.adaptor"
import { cohereProvider } from "./cohere.adaptor"
import { perplexityProvider } from "./perplexity.adaptor"
import { mockProvider } from "./mock.adaptor"

class MultiAIAdapter {
    private providers: Map<string, AIProvider>
    private config: AIAdapterConfig

    constructor() {
        this.providers = new Map([
            ["anthropic", anthropicAdaptor],
            ["openai", openaiProvider],
            ["gemini", geminiProvider],
            ["groq", groqProvider],
            ["perplexity", perplexityProvider],
            ["cohere", cohereProvider],
            ["huggingface", huggingFaceProvider],
            ["mock", mockProvider],
        ])

        // Default configuration - prioritize user's paid keys, then free options
        this.config = {
            preferredProviders: [
                "openai",      // User's paid key - reliable, high quality  
                "anthropic",   // High quality alternative
                "perplexity",  // Research-focused AI with web access
                "gemini",      // Google's free option
                "groq",        // Fast free option
                "cohere",      // Free alternative
                "huggingface", // Free fallback
                "mock",        // Demo mode fallback
            ],
            fallbackToFree: true,
            enabledProviders: ["openai", "anthropic", "gemini", "groq", "perplexity", "cohere", "huggingface", "mock"],
        }
    }

    /**
     * Update adapter configuration
     */
    configure(newConfig: Partial<AIAdapterConfig>) {
        this.config = { ...this.config, ...newConfig }
    }

    /**
     * Get the first available provider based on preferences
     */
    getAvailableProvider(): AIProvider | null {
        for (const providerName of this.config.preferredProviders) {
            if (this.config.enabledProviders.includes(providerName)) {
                const provider = this.providers.get(providerName)
                if (provider?.isAvailable()) {
                    return provider
                }
            }
        }
        return null
    }

    /**
     * Get status of all providers
     */
    getProviderStatus() {
        return Array.from(this.providers.entries()).map(([name, provider]) => ({
            name,
            available: provider.isAvailable(),
            cost: provider.getCost(),
            enabled: this.config.enabledProviders.includes(name),
        }))
    }

    /**
     * Stream chat response using the best available provider
     */
    async streamChat(messages: ChatMessage[]): Promise<{
        stream: ReadableStream<Uint8Array>
        provider: string
        cost: string
    }> {
        const provider = this.getAvailableProvider()

        if (!provider) {
            // Emergency fallback - ensure mock is always available
            const mockProvider = this.providers.get("mock")!
            return {
                stream: await mockProvider.streamChat(messages),
                provider: "mock",
                cost: "free (demo)",
            }
        }

        console.log(`Using AI provider: ${provider.name} (${provider.getCost()})`)

        try {
            const stream = await provider.streamChat(messages)
            return {
                stream,
                provider: provider.name,
                cost: provider.getCost(),
            }
        } catch (error) {
            console.error(`Provider ${provider.name} failed:`, error)

            // If fallback to free is enabled, try the next available provider
            if (this.config.fallbackToFree) {
                const remainingProviders = this.config.preferredProviders.slice(
                    this.config.preferredProviders.indexOf(provider.name) + 1
                )

                for (const providerName of remainingProviders) {
                    const fallbackProvider = this.providers.get(providerName)
                    if (fallbackProvider?.isAvailable()) {
                        console.log(`Falling back to ${providerName}`)
                        try {
                            const stream = await fallbackProvider.streamChat(messages)
                            return {
                                stream,
                                provider: fallbackProvider.name,
                                cost: fallbackProvider.getCost(),
                            }
                        } catch (fallbackError) {
                            console.error(`Fallback provider ${providerName} also failed:`, fallbackError)
                            continue
                        }
                    }
                }
            }

            // Ultimate fallback to mock
            const mockProvider = this.providers.get("mock")!
            return {
                stream: await mockProvider.streamChat(messages),
                provider: "mock",
                cost: "free (emergency fallback)",
            }
        }
    }

    /**
     * Get configuration help text for environment variables
     */
    getSetupInstructions(): string {
        return `
# AI Provider Setup Instructions
# Add any of these to your .env file to enable AI features:

# FREE OPTIONS:
GROQ_API_KEY=your_free_groq_key_here                    # Get free key at: https://groq.com/
HUGGINGFACE_API_KEY=your_free_hf_key_here              # Get free key at: https://huggingface.co/settings/tokens
GEMINI_API_KEY=your_free_gemini_key_here               # Get free key at: https://makersuite.google.com/app/apikey
COHERE_API_KEY=your_free_cohere_key_here               # Get free key at: https://dashboard.cohere.ai/

# PAID OPTIONS:
ANTHROPIC_API_KEY=your_anthropic_key_here               # Claude models
OPENAI_API_KEY=your_openai_key_here                     # GPT models
PERPLEXITY_API_KEY=your_perplexity_key_here            # Research-focused AI with web access
OPENAI_MODEL=gpt-3.5-turbo                             # Optional: specify model

# The app will automatically use the first available provider in this order:
# 1. OpenAI (paid, reliable)
# 2. Anthropic (paid, high quality)
# 3. Perplexity (paid, research-focused)
# 4. Gemini (free, Google AI)
# 5. Groq (free, fast)
# 6. Cohere (free, command models)
# 7. Hugging Face (free, open models)
# 8. Mock (demo mode, always available)
`
    }
}

// Export singleton instance
export const multiAI = new MultiAIAdapter()