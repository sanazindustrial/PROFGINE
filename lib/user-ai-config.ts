import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

export interface UserAIConfig {
    preferredProvider: string
    usePlatformFallback: boolean
    isEnabled: boolean
    apiKeys: {
        openai?: string
        anthropic?: string
        gemini?: string
        groq?: string
        perplexity?: string
        cohere?: string
        huggingface?: string
    }
    models: {
        openai?: string
        anthropic?: string
    }
}

export interface ProviderInfo {
    name: string
    displayName: string
    description: string
    keyPrefix: string
    docsUrl: string
    isFree: boolean
}

export const AI_PROVIDERS: ProviderInfo[] = [
    {
        name: 'openai',
        displayName: 'OpenAI',
        description: 'GPT-4, GPT-4o, GPT-3.5 Turbo - High quality, reliable',
        keyPrefix: 'sk-',
        docsUrl: 'https://platform.openai.com/api-keys',
        isFree: false,
    },
    {
        name: 'anthropic',
        displayName: 'Anthropic (Claude)',
        description: 'Claude 3.5 Sonnet, Claude 3 Opus - Excellent reasoning',
        keyPrefix: 'sk-ant-',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        isFree: false,
    },
    {
        name: 'gemini',
        displayName: 'Google Gemini',
        description: 'Gemini Pro - Google AI with free tier',
        keyPrefix: '',
        docsUrl: 'https://makersuite.google.com/app/apikey',
        isFree: true,
    },
    {
        name: 'groq',
        displayName: 'Groq',
        description: 'LLaMA, Mixtral - Ultra-fast inference (free tier)',
        keyPrefix: 'gsk_',
        docsUrl: 'https://console.groq.com/keys',
        isFree: true,
    },
    {
        name: 'perplexity',
        displayName: 'Perplexity',
        description: 'Research-focused AI with web access',
        keyPrefix: 'pplx-',
        docsUrl: 'https://www.perplexity.ai/settings/api',
        isFree: false,
    },
    {
        name: 'cohere',
        displayName: 'Cohere',
        description: 'Command models - Free tier available',
        keyPrefix: '',
        docsUrl: 'https://dashboard.cohere.ai/api-keys',
        isFree: true,
    },
    {
        name: 'huggingface',
        displayName: 'Hugging Face',
        description: 'Open source models - Free tier available',
        keyPrefix: 'hf_',
        docsUrl: 'https://huggingface.co/settings/tokens',
        isFree: true,
    },
]

/**
 * Get user's AI configuration with decrypted keys
 */
export async function getUserAIConfig(userId: string): Promise<UserAIConfig | null> {
    try {
        const settings = await prisma.userAISettings.findUnique({
            where: { userId },
        })

        if (!settings || !settings.isEnabled) {
            return null // Use platform defaults
        }

        return {
            preferredProvider: settings.preferredProvider || 'platform',
            usePlatformFallback: settings.usePlatformFallback,
            isEnabled: settings.isEnabled,
            apiKeys: {
                openai: settings.openaiApiKey ? decrypt(settings.openaiApiKey) : undefined,
                anthropic: settings.anthropicApiKey ? decrypt(settings.anthropicApiKey) : undefined,
                gemini: settings.geminiApiKey ? decrypt(settings.geminiApiKey) : undefined,
                groq: settings.groqApiKey ? decrypt(settings.groqApiKey) : undefined,
                perplexity: settings.perplexityApiKey ? decrypt(settings.perplexityApiKey) : undefined,
                cohere: settings.cohereApiKey ? decrypt(settings.cohereApiKey) : undefined,
                huggingface: settings.huggingfaceApiKey ? decrypt(settings.huggingfaceApiKey) : undefined,
            },
            models: {
                openai: settings.openaiModel || undefined,
                anthropic: settings.anthropicModel || undefined,
            },
        }
    } catch (error) {
        console.error('Error getting user AI config:', error)
        return null
    }
}

/**
 * Check if a user has any custom API keys configured
 */
export async function hasCustomAIKeys(userId: string): Promise<boolean> {
    try {
        const settings = await prisma.userAISettings.findUnique({
            where: { userId },
            select: {
                isEnabled: true,
                openaiApiKey: true,
                anthropicApiKey: true,
                geminiApiKey: true,
                groqApiKey: true,
                perplexityApiKey: true,
                cohereApiKey: true,
                huggingfaceApiKey: true,
            },
        })

        if (!settings || !settings.isEnabled) return false

        return !!(
            settings.openaiApiKey ||
            settings.anthropicApiKey ||
            settings.geminiApiKey ||
            settings.groqApiKey ||
            settings.perplexityApiKey ||
            settings.cohereApiKey ||
            settings.huggingfaceApiKey
        )
    } catch {
        return false
    }
}

/**
 * Get environment variables for a user's custom AI provider
 * Returns object to be spread into process.env temporarily
 */
export function getEnvOverridesFromConfig(config: UserAIConfig): Record<string, string> {
    const overrides: Record<string, string> = {}

    if (config.apiKeys.openai) overrides['OPENAI_API_KEY'] = config.apiKeys.openai
    if (config.apiKeys.anthropic) overrides['ANTHROPIC_API_KEY'] = config.apiKeys.anthropic
    if (config.apiKeys.gemini) overrides['GEMINI_API_KEY'] = config.apiKeys.gemini
    if (config.apiKeys.groq) overrides['GROQ_API_KEY'] = config.apiKeys.groq
    if (config.apiKeys.perplexity) overrides['PERPLEXITY_API_KEY'] = config.apiKeys.perplexity
    if (config.apiKeys.cohere) overrides['COHERE_API_KEY'] = config.apiKeys.cohere
    if (config.apiKeys.huggingface) overrides['HUGGINGFACE_API_KEY'] = config.apiKeys.huggingface
    if (config.models.openai) overrides['OPENAI_MODEL'] = config.models.openai

    return overrides
}
