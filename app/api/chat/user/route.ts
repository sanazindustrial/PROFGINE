import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserAIConfig } from "@/lib/user-ai-config"
import { ChatMessage } from "@/types/ai.types"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

// Not edge runtime - needs Prisma access
export const dynamic = 'force-dynamic'

const DISCUSSION_SYSTEM_PROMPT =
    "You are Professor GENIE, an AI assistant for educators. Provide clear, concise, helpful responses with a professional academic tone."

const GRADING_SYSTEM_PROMPT =
    "You are an AI grading assistant. Provide structured, fair, and actionable feedback aligned with the rubric and assignment context."

async function streamWithOpenAI(messages: ChatMessage[], apiKey: string, model?: string): Promise<{ content: string; provider: string }> {
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
        model: model || "gpt-4o-mini",
        messages: messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    })

    return {
        content: response.choices[0]?.message?.content || '',
        provider: `openai (${model || 'gpt-4o-mini'}) - Your Key`
    }
}

async function streamWithAnthropic(messages: ChatMessage[], apiKey: string, model?: string): Promise<{ content: string; provider: string }> {
    const anthropic = new Anthropic({ apiKey })

    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const chatMessages = messages.filter(m => m.role !== 'system')

    const response = await anthropic.messages.create({
        model: model || "claude-3-haiku-20240307",
        max_tokens: 4096,
        system: systemMessage,
        messages: chatMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        })),
    })

    const textContent = response.content.find(c => c.type === 'text')
    return {
        content: textContent?.text || '',
        provider: `anthropic (${model || 'claude-3-haiku'}) - Your Key`
    }
}

async function streamWithGemini(messages: ChatMessage[], apiKey: string): Promise<{ content: string; provider: string }> {
    // Use Gemini API directly via fetch
    const systemPrompt = messages.find(m => m.role === 'system')?.content || ''
    const userMessages = messages.filter(m => m.role !== 'system')

    const contents = userMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: 4096 }
        })
    })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
        content: text,
        provider: 'gemini (gemini-1.5-flash) - Your Key'
    }
}

async function streamWithGroq(messages: ChatMessage[], apiKey: string): Promise<{ content: string; provider: string }> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: 4096
        })
    })

    const data = await response.json()
    return {
        content: data.choices?.[0]?.message?.content || '',
        provider: 'groq (llama-3.1-70b) - Your Key'
    }
}

async function streamWithPerplexity(messages: ChatMessage[], apiKey: string): Promise<{ content: string; provider: string }> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        })
    })

    const data = await response.json()
    return {
        content: data.choices?.[0]?.message?.content || '',
        provider: 'perplexity (sonar) - Your Key'
    }
}

async function streamWithCohere(messages: ChatMessage[], apiKey: string): Promise<{ content: string; provider: string }> {
    const systemPrompt = messages.find(m => m.role === 'system')?.content || ''
    const chatMessages = messages.filter(m => m.role !== 'system')
    const lastMessage = chatMessages.pop()

    const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'command-r',
            message: lastMessage?.content || '',
            preamble: systemPrompt,
            chat_history: chatMessages.map(m => ({
                role: m.role === 'user' ? 'USER' : 'CHATBOT',
                message: m.content
            }))
        })
    })

    const data = await response.json()
    return {
        content: data.text || '',
        provider: 'cohere (command-r) - Your Key'
    }
}

async function streamWithHuggingFace(messages: ChatMessage[], apiKey: string): Promise<{ content: string; provider: string }> {
    const systemPrompt = messages.find(m => m.role === 'system')?.content || ''
    const userMessages = messages.filter(m => m.role !== 'system')
    const lastMessage = userMessages.pop()

    const prompt = `${systemPrompt}\n\n${lastMessage?.content || ''}`

    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 2048 }
        })
    })

    const data = await response.json()
    return {
        content: Array.isArray(data) ? data[0]?.generated_text?.replace(prompt, '') || '' : '',
        provider: 'huggingface (mixtral) - Your Key'
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user's custom AI config
        const userConfig = await getUserAIConfig(session.user.id)
        if (!userConfig || !userConfig.isEnabled) {
            return NextResponse.json({
                error: "Custom AI settings not enabled. Use /api/chat instead."
            }, { status: 400 })
        }

        const body = await request.json()
        const rawMessages = (body?.messages || []) as ChatMessage[]

        if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 })
        }

        // Add system prompt if not present
        const hasSystem = rawMessages.some(m => m.role === 'system')
        const useGradingPrompt = rawMessages[0]?.content?.includes("myTArequestType:")
        const systemContent = useGradingPrompt ? GRADING_SYSTEM_PROMPT : DISCUSSION_SYSTEM_PROMPT

        const messages: ChatMessage[] = hasSystem
            ? rawMessages
            : [{ role: 'system', content: systemContent }, ...rawMessages]

        const start = Date.now()
        let result: { content: string; provider: string }

        // Determine which provider to use based on user's preference and available keys
        const preferred = userConfig.preferredProvider
        const keys = userConfig.apiKeys
        const models = userConfig.models

        // Try providers in order of preference
        const providersToTry: string[] = []

        if (preferred && preferred !== 'platform') {
            providersToTry.push(preferred)
        }

        // Add other available providers as fallback
        if (keys.openai) providersToTry.push('openai')
        if (keys.anthropic) providersToTry.push('anthropic')
        if (keys.gemini) providersToTry.push('gemini')
        if (keys.groq) providersToTry.push('groq')
        if (keys.perplexity) providersToTry.push('perplexity')
        if (keys.cohere) providersToTry.push('cohere')
        if (keys.huggingface) providersToTry.push('huggingface')

        // Remove duplicates
        const uniqueProviders = [...new Set(providersToTry)]

        let lastError: Error | null = null

        for (const provider of uniqueProviders) {
            try {
                switch (provider) {
                    case 'openai':
                        if (keys.openai) {
                            result = await streamWithOpenAI(messages, keys.openai, models.openai)
                            break
                        }
                        continue
                    case 'anthropic':
                        if (keys.anthropic) {
                            result = await streamWithAnthropic(messages, keys.anthropic, models.anthropic)
                            break
                        }
                        continue
                    case 'gemini':
                        if (keys.gemini) {
                            result = await streamWithGemini(messages, keys.gemini)
                            break
                        }
                        continue
                    case 'groq':
                        if (keys.groq) {
                            result = await streamWithGroq(messages, keys.groq)
                            break
                        }
                        continue
                    case 'perplexity':
                        if (keys.perplexity) {
                            result = await streamWithPerplexity(messages, keys.perplexity)
                            break
                        }
                        continue
                    case 'cohere':
                        if (keys.cohere) {
                            result = await streamWithCohere(messages, keys.cohere)
                            break
                        }
                        continue
                    case 'huggingface':
                        if (keys.huggingface) {
                            result = await streamWithHuggingFace(messages, keys.huggingface)
                            break
                        }
                        continue
                    default:
                        continue
                }

                // If we got here with a result, break the loop
                if (result!) {
                    return NextResponse.json({
                        content: result.content,
                        provider: result.provider,
                        cost: "your-key",
                        durationMs: Date.now() - start,
                    })
                }
            } catch (error) {
                console.error(`User provider ${provider} failed:`, error)
                lastError = error as Error
                continue
            }
        }

        // If user wants platform fallback
        if (userConfig.usePlatformFallback) {
            // Redirect to platform chat
            return NextResponse.json({
                error: "All your custom providers failed. Try enabling 'Fallback to Platform' or check your API keys.",
                fallbackAvailable: true
            }, { status: 500 })
        }

        return NextResponse.json({
            error: lastError?.message || "No AI providers available with your custom keys",
        }, { status: 500 })

    } catch (error) {
        console.error("User chat route error:", error)
        return NextResponse.json({ error: "Chat failed" }, { status: 500 })
    }
}
