"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Settings,
    Cpu,
    Zap,
    DollarSign,
    Globe,
    Clock,
    CheckCircle,
    XCircle,
    ArrowUp,
    ArrowDown,
    RefreshCw
} from "lucide-react"

interface AIProvider {
    name: string
    available: boolean
    cost: string
    enabled: boolean
    description?: string
    website?: string
}

export default function AIAdaptorManagement() {
    const [providers, setProviders] = useState<AIProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [testResults, setTestResults] = useState<{ [key: string]: string }>({})
    const [preferredOrder, setPreferredOrder] = useState<string[]>([])
    const [claudeEnabled, setClaudeEnabled] = useState(false)

    useEffect(() => {
        fetchProviderStatus()
        checkClaudeStatus()
    }, [])

    const checkClaudeStatus = async () => {
        try {
            const response = await fetch('/api/ai/status')
            if (response.ok) {
                const data = await response.json()
                const anthropic = data.providers?.find((p: AIProvider) => p.name === 'anthropic')
                setClaudeEnabled(anthropic?.enabled && anthropic?.available)
            }
        } catch (error) {
            console.error('Failed to check Claude status:', error)
        }
    }

    const fetchProviderStatus = async () => {
        try {
            const response = await fetch('/api/ai/status')
            if (response.ok) {
                const data = await response.json()
                setProviders(data.providers || [])
                setPreferredOrder(data.preferredOrder || [])
            }
        } catch (error) {
            console.error('Failed to fetch AI provider status:', error)
        } finally {
            setLoading(false)
        }
    }

    const testProvider = async (providerName: string) => {
        setTestResults(prev => ({ ...prev, [providerName]: 'testing...' }))

        try {
            const response = await fetch('/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerName })
            })

            const result = await response.json()
            setTestResults(prev => ({
                ...prev,
                [providerName]: response.ok ? 'success' : result.error || 'failed'
            }))
        } catch (error) {
            setTestResults(prev => ({ ...prev, [providerName]: 'failed' }))
        }
    }

    const toggleProvider = async (providerName: string, enabled: boolean) => {
        try {
            const response = await fetch('/api/ai/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle',
                    provider: providerName,
                    enabled
                })
            })

            if (response.ok) {
                fetchProviderStatus() // Refresh status
                if (providerName === 'anthropic') {
                    setClaudeEnabled(enabled)
                }
            }
        } catch (error) {
            console.error('Failed to toggle provider:', error)
        }
    }

    const enableClaudeForAllClients = async () => {
        try {
            const response = await fetch('/api/ai/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle',
                    provider: 'anthropic',
                    enabled: true
                })
            })

            if (response.ok) {
                setClaudeEnabled(true)
                fetchProviderStatus()
                alert('✅ Claude Haiku 4.5 has been enabled for all clients!')
            } else {
                alert('❌ Failed to enable Claude. Make sure ANTHROPIC_API_KEY is set.')
            }
        } catch (error) {
            console.error('Failed to enable Claude:', error)
            alert('Error enabling Claude Haiku 4.5')
        }
    }

    const moveProvider = async (providerName: string, direction: 'up' | 'down') => {
        try {
            const currentIndex = preferredOrder.indexOf(providerName)
            const newOrder = [...preferredOrder]

            if (direction === 'up' && currentIndex > 0) {
                [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]]
            } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
                [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]]
            }

            const response = await fetch('/api/ai/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reorder',
                    preferredOrder: newOrder
                })
            })

            if (response.ok) {
                setPreferredOrder(newOrder)
            }
        } catch (error) {
            console.error('Failed to reorder providers:', error)
        }
    }

    const getProviderIcon = (providerName: string) => {
        const icons: { [key: string]: JSX.Element } = {
            openai: <Cpu className="size-5" />,
            anthropic: <Zap className="size-5" />,
            gemini: <Globe className="size-5" />,
            groq: <Clock className="size-5" />,
            perplexity: <Globe className="size-5" />,
            cohere: <Cpu className="size-5" />,
            huggingface: <Settings className="size-5" />,
            mock: <RefreshCw className="size-5" />
        }
        return icons[providerName] || <Cpu className="size-5" />
    }

    const getStatusBadge = (provider: AIProvider) => {
        if (!provider.available) {
            return <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="size-3" />
                Not Configured
            </Badge>
        }
        if (!provider.enabled) {
            return <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="size-3" />
                Disabled
            </Badge>
        }
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="size-3" />
            Active
        </Badge>
    }

    const getCostBadge = (cost: string) => {
        const isFree = cost.toLowerCase().includes('free')
        return <Badge variant={isFree ? "default" : "secondary"} className="flex items-center gap-1">
            <DollarSign className="size-3" />
            {cost}
        </Badge>
    }

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <RefreshCw className="size-8 animate-spin" />
                <span className="ml-2">Loading AI providers...</span>
            </div>
        )
    }

    return (
        <div className="container mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">🧠 AI Adaptor Management</h1>
                    <p className="text-muted-foreground">Configure and manage AI providers for your platform</p>
                </div>
                <Button onClick={fetchProviderStatus} variant="outline">
                    <RefreshCw className="mr-2 size-4" />
                    Refresh Status
                </Button>
            </div>

            {/* Claude Haiku 4.5 Quick Enable */}
            <Card className={claudeEnabled ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-orange-500 bg-orange-50 dark:bg-orange-950/20"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="size-5" />
                        Claude Haiku 4.5 for All Clients
                    </CardTitle>
                    <CardDescription>
                        {claudeEnabled 
                            ? "✅ Claude is currently enabled and available to all users" 
                            : "⚠️ Claude is not enabled. Enable it to provide the best AI experience"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="mb-1 font-medium">Status: <span className={claudeEnabled ? "text-green-600" : "text-orange-600"}>{claudeEnabled ? "ACTIVE" : "INACTIVE"}</span></p>
                        <p className="text-sm text-muted-foreground">Fast, reliable, and cost-effective AI responses</p>
                    </div>
                    {!claudeEnabled && (
                        <Button 
                            onClick={enableClaudeForAllClients}
                            className="bg-green-600 hover:bg-green-700"
                            size="lg"
                        >
                            <Zap className="mr-2 size-4" />
                            Enable Claude Haiku 4.5
                        </Button>
                    )}
                    {claudeEnabled && (
                        <Badge variant="default" className="bg-green-600 px-4 py-2 text-lg">
                            <CheckCircle className="mr-2 size-4" />
                            Enabled
                        </Badge>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="providers" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="providers">AI Providers</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="testing">Testing & Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="providers" className="space-y-4">
                    <Alert>
                        <Cpu className="size-4" />
                        <AlertDescription>
                            Providers are tested in priority order. The first available provider will be used for AI requests.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-4">
                        {preferredOrder.map((providerName, index) => {
                            const provider = providers.find(p => p.name === providerName)
                            if (!provider) return null

                            return (
                                <Card key={provider.name} className="relative">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                                    {getProviderIcon(provider.name)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg capitalize">{provider.name}</CardTitle>
                                                    <CardDescription>Priority #{index + 1}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => moveProvider(provider.name, 'up')}
                                                    disabled={index === 0}
                                                >
                                                    <ArrowUp className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => moveProvider(provider.name, 'down')}
                                                    disabled={index === preferredOrder.length - 1}
                                                >
                                                    <ArrowDown className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(provider)}
                                                {getCostBadge(provider.cost)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => testProvider(provider.name)}
                                                    disabled={!provider.available}
                                                >
                                                    Test
                                                </Button>
                                                <Switch
                                                    checked={provider.enabled}
                                                    onCheckedChange={(enabled) => toggleProvider(provider.name, enabled)}
                                                    disabled={!provider.available}
                                                />
                                            </div>
                                        </div>

                                        {testResults[provider.name] && (
                                            <div className={`rounded p-2 text-sm ${testResults[provider.name] === 'success' ? 'bg-green-100 text-green-800' :
                                                    testResults[provider.name] === 'testing...' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                Test Result: {testResults[provider.name]}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="configuration" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Environment Variables Setup</CardTitle>
                            <CardDescription>Configure API keys for AI providers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                                {`# FREE AI PROVIDERS:
GROQ_API_KEY=your_free_groq_key_here                    # Get at: https://groq.com/
HUGGINGFACE_API_KEY=your_free_hf_key_here              # Get at: https://huggingface.co/settings/tokens
GEMINI_API_KEY=your_free_gemini_key_here               # Get at: https://makersuite.google.com/app/apikey
COHERE_API_KEY=your_free_cohere_key_here               # Get at: https://dashboard.cohere.ai/

# PAID AI PROVIDERS:
ANTHROPIC_API_KEY=your_anthropic_key_here              # Claude models
OPENAI_API_KEY=your_openai_key_here                    # GPT models  
PERPLEXITY_API_KEY=your_perplexity_key_here            # Research AI with web access`}
                            </pre>

                            <Alert>
                                <Settings className="size-4" />
                                <AlertDescription>
                                    After adding API keys to your .env file, restart the application for changes to take effect.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="testing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Provider Testing</CardTitle>
                            <CardDescription>Test individual AI providers to ensure they&apos;re working correctly</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {providers.map(provider => (
                                    <div key={provider.name} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-center gap-3">
                                            {getProviderIcon(provider.name)}
                                            <span className="font-medium capitalize">{provider.name}</span>
                                            {getStatusBadge(provider)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {testResults[provider.name] && (
                                                <span className={`text-sm ${testResults[provider.name] === 'success' ? 'text-green-600' :
                                                        testResults[provider.name] === 'testing...' ? 'text-blue-600' :
                                                            'text-red-600'
                                                    }`}>
                                                    {testResults[provider.name]}
                                                </span>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => testProvider(provider.name)}
                                                disabled={!provider.available || testResults[provider.name] === 'testing...'}
                                            >
                                                {testResults[provider.name] === 'testing...' ? (
                                                    <RefreshCw className="size-4 animate-spin" />
                                                ) : (
                                                    'Test'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}