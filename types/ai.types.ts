// Unified AI provider interface
export interface ChatMessage {
    role: "user" | "assistant" | "system"
    content: string
}

export interface AIProvider {
    name: string
    isAvailable: () => boolean
    streamChat: (messages: ChatMessage[], options?: any) => Promise<ReadableStream<Uint8Array>>
    getCost: () => string // "free", "paid", or cost info
}

export interface AIAdapterConfig {
    preferredProviders: string[]
    fallbackToFree: boolean
    enabledProviders: string[]
}