'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Key,
    Shield,
    ExternalLink,
    Check,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    Info,
    Trash2,
    RefreshCw
} from 'lucide-react'

interface ProviderInfo {
    name: string
    displayName: string
    description: string
    keyPrefix: string
    docsUrl: string
    isFree: boolean
}

interface AISettingsState {
    preferredProvider: string
    usePlatformFallback: boolean
    isEnabled: boolean
    apiKeys: Record<string, string | null>
    hasKeys: Record<string, boolean>
    models: {
        openai: string
        anthropic: string
    }
    providers: ProviderInfo[]
}

const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o (Best)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' },
]

const ANTHROPIC_MODELS = [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Best)' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast & Cheap)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Capable)' },
]

export function UserAISettings() {
    const [settings, setSettings] = useState<AISettingsState | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [editingKeys, setEditingKeys] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/user/ai-settings')
            if (res.ok) {
                const data = await res.json()
                // Ensure providers array exists with fallback
                setSettings({
                    ...data,
                    providers: data.providers || [],
                    apiKeys: data.apiKeys || {},
                    hasKeys: data.hasKeys || {},
                    models: data.models || { openai: 'gpt-4o-mini', anthropic: 'claude-3-haiku-20240307' },
                })
            } else {
                console.error('Failed to fetch AI settings:', res.status, res.statusText)
            }
        } catch (error) {
            console.error('Failed to fetch AI settings:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const saveSettings = async () => {
        if (!settings) return
        setIsSaving(true)
        setMessage(null)

        try {
            // Build apiKeys object with edited values
            const apiKeys: Record<string, string | null> = {}
            for (const provider of settings.providers) {
                if (editingKeys[provider.name] !== undefined) {
                    apiKeys[provider.name] = editingKeys[provider.name] || null
                }
            }

            const res = await fetch('/api/user/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferredProvider: settings.preferredProvider,
                    usePlatformFallback: settings.usePlatformFallback,
                    isEnabled: settings.isEnabled,
                    apiKeys: Object.keys(apiKeys).length > 0 ? apiKeys : undefined,
                    models: settings.models,
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setMessage({ type: 'success', text: 'AI settings saved successfully!' })
                setEditingKeys({})
                fetchSettings() // Refresh to get masked keys
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setIsSaving(false)
        }
    }

    const resetToDefaults = async () => {
        if (!confirm('This will remove all your custom API keys and use platform defaults. Continue?')) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/user/ai-settings', { method: 'DELETE' })
            if (res.ok) {
                setMessage({ type: 'success', text: 'Reset to platform defaults' })
                setEditingKeys({})
                fetchSettings()
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to reset settings' })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (!settings) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Failed to load AI settings
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Enable Custom AI */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        Custom AI Provider Settings
                    </CardTitle>
                    <CardDescription>
                        Use your own API keys for AI features instead of the platform&apos;s shared service.
                        This gives you more control, privacy, and potentially higher rate limits.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label className="text-base font-medium">Enable Custom AI Keys</Label>
                            <p className="text-sm text-muted-foreground">
                                When enabled, your API keys will be used instead of the platform&apos;s
                            </p>
                        </div>
                        <Switch
                            checked={settings.isEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
                        />
                    </div>

                    {settings.isEnabled && (
                        <>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <Label className="text-base font-medium">Fallback to Platform</Label>
                                    <p className="text-sm text-muted-foreground">
                                        If your keys fail, use platform&apos;s AI as backup
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.usePlatformFallback}
                                    onCheckedChange={(checked) => setSettings({ ...settings, usePlatformFallback: checked })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Preferred Provider</Label>
                                <Select
                                    value={settings.preferredProvider}
                                    onValueChange={(value) => setSettings({ ...settings, preferredProvider: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="platform">Platform Default (Auto-select best)</SelectItem>
                                        {settings.providers.map((p) => (
                                            <SelectItem key={p.name} value={p.name}>
                                                {p.displayName} {p.isFree && <span className="text-green-600">(Free tier)</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* API Keys */}
            {settings.isEnabled && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="size-5" />
                            API Keys
                        </CardTitle>
                        <CardDescription>
                            Enter your API keys below. Keys are encrypted and stored securely.
                            Leave empty to skip a provider.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {settings.providers.map((provider) => (
                            <div key={provider.name} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-base font-medium">{provider.displayName}</Label>
                                            {provider.isFree && (
                                                <Badge variant="secondary" className="text-xs">Free Tier</Badge>
                                            )}
                                            {settings.hasKeys[provider.name] && (
                                                <Badge variant="default" className="bg-green-600 text-xs">
                                                    <Check className="mr-1 size-3" /> Configured
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{provider.description}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(provider.docsUrl, '_blank')}
                                    >
                                        <ExternalLink className="mr-1 size-4" />
                                        Get Key
                                    </Button>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showKeys[provider.name] ? 'text' : 'password'}
                                            placeholder={settings.hasKeys[provider.name] ? settings.apiKeys[provider.name] || '' : `Enter ${provider.displayName} API key`}
                                            value={editingKeys[provider.name] ?? ''}
                                            onChange={(e) => setEditingKeys({ ...editingKeys, [provider.name]: e.target.value })}
                                            className="pr-10 font-mono text-sm"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowKeys({ ...showKeys, [provider.name]: !showKeys[provider.name] })}
                                    >
                                        {showKeys[provider.name] ? <X className="size-4" /> : <Key className="size-4" />}
                                    </Button>
                                    {settings.hasKeys[provider.name] && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => setEditingKeys({ ...editingKeys, [provider.name]: '' })}
                                            title="Remove this key"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Model selection for providers that support it */}
                                {provider.name === 'openai' && settings.hasKeys.openai && (
                                    <div className="mt-3">
                                        <Label className="text-sm">Model</Label>
                                        <Select
                                            value={settings.models.openai}
                                            onValueChange={(value) => setSettings({
                                                ...settings,
                                                models: { ...settings.models, openai: value }
                                            })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OPENAI_MODELS.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {provider.name === 'anthropic' && settings.hasKeys.anthropic && (
                                    <div className="mt-3">
                                        <Label className="text-sm">Model</Label>
                                        <Select
                                            value={settings.models.anthropic}
                                            onValueChange={(value) => setSettings({
                                                ...settings,
                                                models: { ...settings.models, anthropic: value }
                                            })}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ANTHROPIC_MODELS.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Message Display */}
            {message && (
                <div className={`flex items-center gap-2 rounded-md border p-3 ${message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="size-4" />
                    ) : (
                        <AlertCircle className="size-4" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Info Notice */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="flex gap-3 py-4">
                    <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Security Information</p>
                        <p className="mt-1">
                            Your API keys are encrypted using AES-256-GCM before storage.
                            They are only decrypted when making AI requests and are never logged or exposed.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={resetToDefaults}
                    disabled={isSaving}
                    className="text-destructive"
                >
                    <RefreshCw className="mr-2 size-4" />
                    Reset to Platform Defaults
                </Button>
                <Button onClick={saveSettings} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </Button>
            </div>
        </div>
    )
}
