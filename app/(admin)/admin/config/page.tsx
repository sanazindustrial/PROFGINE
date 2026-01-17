"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"

interface ConfigItem {
    id: string
    key: string
    value?: string
    description?: string
    category: string
    isActive: boolean
    isRequired: boolean
    createdAt: Date
    updatedAt: Date
}

interface ServiceHealth {
    id: string
    service: string
    status: string
    lastTested?: Date
    lastError?: string
    responseTime?: number
    version?: string
}

const CONFIG_TEMPLATES = {
    AI: [
        {
            key: "OPENAI_API_KEY",
            description: "OpenAI API key for GPT models",
            placeholder: "sk-...",
            isRequired: true,
        },
        {
            key: "ANTHROPIC_API_KEY",
            description: "Anthropic API key for Claude models",
            placeholder: "sk-ant-...",
            isRequired: false,
        },
        {
            key: "GEMINI_API_KEY",
            description: "Google Gemini API key",
            placeholder: "AIza...",
            isRequired: false,
        },
        {
            key: "GROQ_API_KEY",
            description: "Groq API key for fast inference",
            placeholder: "gsk_...",
            isRequired: false,
        },
        {
            key: "PERPLEXITY_API_KEY",
            description: "Perplexity API key",
            placeholder: "pplx-...",
            isRequired: false,
        },
        {
            key: "COHERE_API_KEY",
            description: "Cohere API key",
            placeholder: "co...",
            isRequired: false,
        },
        {
            key: "HUGGINGFACE_API_KEY",
            description: "HuggingFace API key",
            placeholder: "hf_...",
            isRequired: false,
        },
    ],
    OAUTH: [
        {
            key: "GOOGLE_CLIENT_ID",
            description: "Google OAuth Client ID",
            placeholder: "...-...googleusercontent.com",
            isRequired: true,
        },
        {
            key: "GOOGLE_CLIENT_SECRET",
            description: "Google OAuth Client Secret",
            placeholder: "GOCSPX-...",
            isRequired: true,
        },
        {
            key: "NEXTAUTH_SECRET",
            description: "NextAuth secret for JWT encryption",
            placeholder: "Generate a secure random string",
            isRequired: true,
        },
        {
            key: "NEXTAUTH_URL",
            description: "NextAuth base URL",
            placeholder: "https://yourdomain.com",
            isRequired: true,
        },
    ],
    STRIPE: [
        {
            key: "STRIPE_PUBLISHABLE_KEY",
            description: "Stripe publishable key",
            placeholder: "pk_test_... or pk_live_...",
            isRequired: true,
        },
        {
            key: "STRIPE_SECRET_KEY",
            description: "Stripe secret key",
            placeholder: "sk_test_... or sk_live_...",
            isRequired: true,
        },
        {
            key: "STRIPE_WEBHOOK_SECRET",
            description: "Stripe webhook endpoint secret",
            placeholder: "whsec_...",
            isRequired: true,
        },
    ],
}

export default function AdminConfigPage() {
    const [configs, setConfigs] = useState<ConfigItem[]>([])
    const [health, setHealth] = useState<ServiceHealth[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [testing, setTesting] = useState<string | null>(null)
    const { toast } = useToast()

    const loadConfigs = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/config")
            const data = await response.json()
            setConfigs(data.configs || [])
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load configurations",
                variant: "destructive",
            })
        }
    }, [toast])

    const loadHealthStatus = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/health")
            const data = await response.json()
            setHealth(data.services || [])
            setLoading(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load health status",
                variant: "destructive",
            })
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadConfigs()
        loadHealthStatus()
    }, [loadConfigs, loadHealthStatus])

    const saveConfig = async (key: string, value: string, category: string, description?: string) => {
        setSaving(key)
        try {
            const response = await fetch("/api/admin/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value, category, description }),
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: `${key} saved successfully`,
                })
                await loadConfigs()
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to save ${key}`,
                variant: "destructive",
            })
        }
        setSaving(null)
    }

    const testService = async (service: string) => {
        setTesting(service)
        try {
            const response = await fetch(`/api/admin/test/${service}`, {
                method: "POST",
            })
            const data = await response.json()

            toast({
                title: data.success ? "Test Passed" : "Test Failed",
                description: data.message,
                variant: data.success ? "default" : "destructive",
            })

            await loadHealthStatus()
        } catch (error) {
            toast({
                title: "Test Failed",
                description: `Failed to test ${service}`,
                variant: "destructive",
            })
        }
        setTesting(null)
    }

    const testAllServices = async () => {
        setTesting("all")
        try {
            const response = await fetch("/api/admin/test-all", {
                method: "POST",
            })
            const data = await response.json()

            toast({
                title: "Test Complete",
                description: `Tested ${data.tested} services. ${data.passed} passed, ${data.failed} failed.`,
            })

            await loadHealthStatus()
        } catch (error) {
            toast({
                title: "Test Failed",
                description: "Failed to run all tests",
                variant: "destructive",
            })
        }
        setTesting(null)
    }

    const getConfigValue = (key: string) => {
        return configs.find(c => c.key === key)?.value || ""
    }

    const getServiceStatus = (service: string) => {
        return health.find(h => h.service === service)
    }

    const renderConfigSection = (category: string, templates: any[]) => {
        return (
            <div className="space-y-4">
                {templates.map((template) => {
                    const currentValue = getConfigValue(template.key)
                    const serviceStatus = getServiceStatus(template.key.toLowerCase().split("_")[0])

                    return (
                        <Card key={template.key} className="relative">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-medium">{template.key}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {template.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {template.isRequired && (
                                            <Badge variant="destructive" className="text-xs">Required</Badge>
                                        )}
                                        {serviceStatus && (
                                            <Badge
                                                variant={
                                                    serviceStatus.status === "active" ? "default" :
                                                        serviceStatus.status === "error" ? "destructive" : "secondary"
                                                }
                                                className="text-xs"
                                            >
                                                {serviceStatus.status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <Input
                                        type={template.key.includes("SECRET") ? "password" : "text"}
                                        placeholder={template.placeholder}
                                        value={currentValue}
                                        onChange={(e) => {
                                            // Update local state temporarily
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value !== currentValue) {
                                                saveConfig(template.key, e.target.value, category, template.description)
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => testService(template.key.toLowerCase().split("_")[0])}
                                        disabled={!currentValue || testing === template.key.toLowerCase().split("_")[0]}
                                    >
                                        {testing === template.key.toLowerCase().split("_")[0] ? (
                                            <Icons.spinner className="size-3 animate-spin" />
                                        ) : (
                                            <Icons.play className="size-3" />
                                        )}
                                        Test
                                    </Button>
                                    {serviceStatus?.responseTime && (
                                        <Badge variant="outline" className="text-xs">
                                            {serviceStatus.responseTime}ms
                                        </Badge>
                                    )}
                                    {serviceStatus?.lastTested && (
                                        <span className="text-xs text-muted-foreground">
                                            Last tested: {new Date(serviceStatus.lastTested).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                {serviceStatus?.lastError && (
                                    <Alert variant="destructive" className="text-xs">
                                        <AlertDescription>{serviceStatus.lastError}</AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Icons.spinner className="size-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Configuration</h1>
                    <p className="text-muted-foreground">Manage API keys and system configurations</p>
                </div>
                <Button
                    onClick={testAllServices}
                    disabled={testing === "all"}
                    size="sm"
                >
                    {testing === "all" ? (
                        <Icons.spinner className="mr-2 size-4 animate-spin" />
                    ) : (
                        <Icons.checkCircle className="mr-2 size-4" />
                    )}
                    Test All Services
                </Button>
            </div>

            <Tabs defaultValue="ai" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="ai">AI Services</TabsTrigger>
                    <TabsTrigger value="oauth">OAuth</TabsTrigger>
                    <TabsTrigger value="stripe">Stripe</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-4">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">AI Service Configuration</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure API keys for AI providers. At least one is required for AI features.
                            </p>
                        </div>
                        {renderConfigSection("AI", CONFIG_TEMPLATES.AI)}
                    </div>
                </TabsContent>

                <TabsContent value="oauth" className="space-y-4">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">OAuth Configuration</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure authentication providers. Google OAuth is required.
                            </p>
                        </div>
                        {renderConfigSection("OAUTH", CONFIG_TEMPLATES.OAUTH)}
                    </div>
                </TabsContent>

                <TabsContent value="stripe" className="space-y-4">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Payment Configuration</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure Stripe for subscription and payment processing.
                            </p>
                        </div>
                        {renderConfigSection("STRIPE", CONFIG_TEMPLATES.STRIPE)}
                    </div>
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4">
                        <h2 className="text-xl font-semibold">System Overview</h2>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {health.map((service) => (
                                <Card key={service.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm capitalize">{service.service}</CardTitle>
                                            <Badge
                                                variant={
                                                    service.status === "active" ? "default" :
                                                        service.status === "error" ? "destructive" : "secondary"
                                                }
                                            >
                                                {service.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {service.responseTime && (
                                            <div className="flex justify-between text-sm">
                                                <span>Response Time:</span>
                                                <span>{service.responseTime}ms</span>
                                            </div>
                                        )}
                                        {service.version && (
                                            <div className="flex justify-between text-sm">
                                                <span>Version:</span>
                                                <span>{service.version}</span>
                                            </div>
                                        )}
                                        {service.lastTested && (
                                            <div className="flex justify-between text-sm">
                                                <span>Last Tested:</span>
                                                <span>{new Date(service.lastTested).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {service.lastError && (
                                            <Alert variant="destructive" className="mt-2">
                                                <AlertDescription className="text-xs">{service.lastError}</AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}