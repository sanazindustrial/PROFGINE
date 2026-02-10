import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt, maskApiKey, isValidApiKeyFormat } from '@/lib/crypto'
import { AI_PROVIDERS } from '@/lib/user-ai-config'

// GET - Retrieve user's AI settings (with masked keys)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const settings = await prisma.userAISettings.findUnique({
            where: { userId: session.user.id },
        })

        if (!settings) {
            return NextResponse.json({
                preferredProvider: 'platform',
                usePlatformFallback: true,
                isEnabled: false,
                apiKeys: {},
                models: {
                    openai: 'gpt-4o-mini',
                    anthropic: 'claude-3-haiku-20240307',
                },
                providers: AI_PROVIDERS,
            })
        }

        // Return settings with masked API keys for security
        return NextResponse.json({
            preferredProvider: settings.preferredProvider || 'platform',
            usePlatformFallback: settings.usePlatformFallback,
            isEnabled: settings.isEnabled,
            apiKeys: {
                openai: settings.openaiApiKey ? maskApiKey(decrypt(settings.openaiApiKey)) : null,
                anthropic: settings.anthropicApiKey ? maskApiKey(decrypt(settings.anthropicApiKey)) : null,
                gemini: settings.geminiApiKey ? maskApiKey(decrypt(settings.geminiApiKey)) : null,
                groq: settings.groqApiKey ? maskApiKey(decrypt(settings.groqApiKey)) : null,
                perplexity: settings.perplexityApiKey ? maskApiKey(decrypt(settings.perplexityApiKey)) : null,
                cohere: settings.cohereApiKey ? maskApiKey(decrypt(settings.cohereApiKey)) : null,
                huggingface: settings.huggingfaceApiKey ? maskApiKey(decrypt(settings.huggingfaceApiKey)) : null,
            },
            hasKeys: {
                openai: !!settings.openaiApiKey,
                anthropic: !!settings.anthropicApiKey,
                gemini: !!settings.geminiApiKey,
                groq: !!settings.groqApiKey,
                perplexity: !!settings.perplexityApiKey,
                cohere: !!settings.cohereApiKey,
                huggingface: !!settings.huggingfaceApiKey,
            },
            models: {
                openai: settings.openaiModel || 'gpt-4o-mini',
                anthropic: settings.anthropicModel || 'claude-3-haiku-20240307',
            },
            providers: AI_PROVIDERS,
        })
    } catch (error) {
        console.error('Error fetching AI settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

// POST - Update user's AI settings
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            preferredProvider,
            usePlatformFallback,
            isEnabled,
            apiKeys,
            models,
        } = body

        // Validate API keys format if provided
        const errors: string[] = []
        if (apiKeys) {
            for (const [provider, key] of Object.entries(apiKeys)) {
                if (key && typeof key === 'string' && key.length > 0 && !key.includes('••••')) {
                    if (!isValidApiKeyFormat(key, provider)) {
                        errors.push(`Invalid ${provider} API key format`)
                    }
                }
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
        }

        // Get existing settings to preserve keys that aren't being updated
        const existingSettings = await prisma.userAISettings.findUnique({
            where: { userId: session.user.id },
        })

        // Build update data - only encrypt new keys, preserve existing encrypted keys
        const updateData: Record<string, unknown> = {
            preferredProvider: preferredProvider || 'platform',
            usePlatformFallback: usePlatformFallback !== false,
            isEnabled: isEnabled === true,
        }

        // Handle model preferences
        if (models?.openai) updateData.openaiModel = models.openai
        if (models?.anthropic) updateData.anthropicModel = models.anthropic

        // Handle API keys - only update if new value provided (not masked)
        if (apiKeys) {
            const keyFields = [
                ['openai', 'openaiApiKey'],
                ['anthropic', 'anthropicApiKey'],
                ['gemini', 'geminiApiKey'],
                ['groq', 'groqApiKey'],
                ['perplexity', 'perplexityApiKey'],
                ['cohere', 'cohereApiKey'],
                ['huggingface', 'huggingfaceApiKey'],
            ] as const

            for (const [provider, field] of keyFields) {
                const newKey = apiKeys[provider]
                if (newKey === null || newKey === '') {
                    // Explicitly clear the key
                    updateData[field] = null
                } else if (newKey && typeof newKey === 'string' && !newKey.includes('••••')) {
                    // New key provided - encrypt and store
                    updateData[field] = encrypt(newKey)
                }
                // If key contains •••• or undefined, preserve existing (don't update)
            }
        }

        // Upsert the settings
        const settings = await prisma.userAISettings.upsert({
            where: { userId: session.user.id },
            update: updateData,
            create: {
                userId: session.user.id,
                ...updateData,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'AI settings updated successfully',
            preferredProvider: settings.preferredProvider,
            isEnabled: settings.isEnabled,
        })
    } catch (error) {
        console.error('Error updating AI settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}

// DELETE - Remove all custom AI settings
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.userAISettings.delete({
            where: { userId: session.user.id },
        }).catch(() => {
            // Settings might not exist - that's ok
        })

        return NextResponse.json({
            success: true,
            message: 'AI settings removed - using platform defaults',
        })
    } catch (error) {
        console.error('Error deleting AI settings:', error)
        return NextResponse.json({ error: 'Failed to delete settings' }, { status: 500 })
    }
}
