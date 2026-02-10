'use client'

import { useState, useEffect } from 'react'

interface AISettingsInfo {
    isEnabled: boolean
    preferredProvider: string
    hasKeys: Record<string, boolean>
    isLoading: boolean
}

export function useUserAISettings(): AISettingsInfo {
    const [settings, setSettings] = useState<AISettingsInfo>({
        isEnabled: false,
        preferredProvider: 'platform',
        hasKeys: {},
        isLoading: true,
    })

    useEffect(() => {
        fetch('/api/user/ai-settings')
            .then(res => res.json())
            .then(data => {
                setSettings({
                    isEnabled: data.isEnabled || false,
                    preferredProvider: data.preferredProvider || 'platform',
                    hasKeys: data.hasKeys || {},
                    isLoading: false,
                })
            })
            .catch(() => {
                setSettings(prev => ({ ...prev, isLoading: false }))
            })
    }, [])

    return settings
}

/**
 * Get the appropriate chat endpoint based on user's AI settings
 */
export function getChatEndpoint(useCustomAI: boolean): string {
    return useCustomAI ? '/api/chat/user' : '/api/chat'
}

/**
 * Make a chat request using the appropriate endpoint based on user settings
 */
export async function chatWithAI(
    messages: Array<{ role: string; content: string }>,
    useCustomAI: boolean = false
): Promise<{ content: string; provider: string; cost: string; durationMs: number }> {
    const endpoint = getChatEndpoint(useCustomAI)

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
        const error = await response.json()

        // If custom AI failed but fallback is available, try platform
        if (error.fallbackAvailable && useCustomAI) {
            return chatWithAI(messages, false)
        }

        throw new Error(error.error || 'Chat request failed')
    }

    return response.json()
}
