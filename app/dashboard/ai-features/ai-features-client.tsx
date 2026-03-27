'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    Bot,
    Star,
    Zap,
    Settings,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    Loader2,
    Lightbulb,
    FileText,
    Monitor,
    BookOpen,
    Wand2,
    RefreshCw,
    Save,
    Shield,
    Globe,
    Cpu,
    MessageSquare,
    GraduationCap,
    ImageIcon,
    Download,
    Palette,
    Search,
} from 'lucide-react'

interface AIAgentConfig {
    name: string
    description: string
    systemPrompt: string
    model: string
    temperature: number
    enabled: boolean
}

const defaultAgents: Record<string, AIAgentConfig> = {
    'content-enhancer': {
        name: 'Content Quality Enhancer',
        description: 'Reviews and improves AI-generated content for academic rigor, clarity, and engagement',
        systemPrompt: `You are an expert academic content reviewer. Your job is to enhance AI-generated educational content by:
1. Ensuring academic rigor and factual accuracy
2. Improving clarity and readability for the target audience
3. Adding deeper analysis and critical thinking prompts
4. Ensuring proper structure with clear learning objectives
5. Adding real-world examples and case studies where appropriate
6. Checking for bias and ensuring inclusive language`,
        model: 'auto',
        temperature: 0.3,
        enabled: true,
    },
    'presentation-designer': {
        name: 'Presentation Designer',
        description: 'Optimizes slide layouts, visual hierarchy, and presentation flow',
        systemPrompt: `You are an expert presentation designer for academic lectures. Your role:
1. Design clear visual hierarchy for each slide
2. Limit text to 5-7 bullet points per slide maximum  
3. Suggest visual elements, diagrams, and charts
4. Ensure logical flow between slides
5. Add engaging transitions and summary slides
6. Include speaker notes with talking points
7. Balance information density with readability`,
        model: 'auto',
        temperature: 0.4,
        enabled: true,
    },
    'assessment-generator': {
        name: 'Assessment Generator',
        description: 'Creates high-quality quizzes, exams, and rubrics aligned with learning objectives',
        systemPrompt: `You are an expert in educational assessment design. Your role:
1. Create assessments aligned with Bloom's taxonomy
2. Design questions at multiple cognitive levels
3. Include varied question types (MCQ, short answer, essay, case study)
4. Write clear rubrics with specific criteria
5. Ensure fair and unbiased assessment items
6. Align questions with stated learning objectives`,
        model: 'auto',
        temperature: 0.3,
        enabled: true,
    },
    'discussion-facilitator': {
        name: 'Discussion Facilitator',
        description: 'Generates deeper discussion prompts and Socratic questioning',
        systemPrompt: `You are an expert discussion facilitator for higher education. Your role:
1. Generate thought-provoking discussion questions
2. Use Socratic questioning techniques
3. Encourage critical analysis and multiple perspectives
4. Connect topics to real-world applications
5. Scaffold discussions from basic to advanced levels
6. Promote collaborative learning and peer engagement`,
        model: 'auto',
        temperature: 0.5,
        enabled: true,
    }
}

interface ExternalService {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    status: 'connected' | 'disconnected' | 'coming_soon'
    apiKeyField?: string
    docsUrl: string
    features: string[]
}

const externalServices: ExternalService[] = [
    {
        id: 'google-gemini',
        name: 'Google Gemini (NotebookLM Engine)',
        description: 'Powers NotebookLM-style deep research, content synthesis, and document analysis. Integrated into the content creation pipeline for research-backed lectures and presentations.',
        icon: <Lightbulb className="size-6 text-blue-500" />,
        status: 'connected',
        apiKeyField: 'GEMINI_API_KEY',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        features: ['Research synthesis', 'Content enhancement', 'Key insights extraction', 'Multi-pass quality review'],
    },
    {
        id: 'gamma',
        name: 'Nano Banana (Gamma AI Image & Content)',
        description: 'AI-powered image creation, slide enhancement, and visual content generation. Creates diagrams, infographics, and educational visuals for presentations and lectures.',
        icon: <Monitor className="size-6 text-purple-500" />,
        status: 'connected',
        docsUrl: 'https://gamma.app',
        features: ['Image generation', 'Slide enhancement', 'Visual diagrams', 'Infographics', 'Quality scoring', 'SVG export'],
    },
    {
        id: 'openai-assistants',
        name: 'OpenAI Assistants API',
        description: 'Advanced AI agents with file understanding, code execution, and multi-step reasoning for complex educational content generation.',
        icon: <Bot className="size-6 text-green-500" />,
        status: 'disconnected',
        apiKeyField: 'OPENAI_API_KEY',
        docsUrl: 'https://platform.openai.com/docs/assistants',
        features: ['File analysis', 'Code execution', 'Multi-step reasoning', 'Custom instructions'],
    },
    {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        description: 'Advanced reasoning and long-context analysis. Excellent for detailed lecture notes, complex rubric generation, and nuanced feedback.',
        icon: <MessageSquare className="size-6 text-orange-500" />,
        status: 'disconnected',
        apiKeyField: 'ANTHROPIC_API_KEY',
        docsUrl: 'https://console.anthropic.com/',
        features: ['Long documents', 'Detailed analysis', 'Nuanced feedback', 'Complex reasoning'],
    },
    {
        id: 'perplexity',
        name: 'Perplexity AI (Research)',
        description: 'Real-time web search integrated AI. Perfect for generating content with up-to-date citations and references.',
        icon: <Globe className="size-6 text-cyan-500" />,
        status: 'disconnected',
        apiKeyField: 'PERPLEXITY_API_KEY',
        docsUrl: 'https://docs.perplexity.ai/',
        features: ['Web search', 'Live citations', 'Current references', 'Fact verification'],
    },
]

export function AIFeaturesClient() {
    const [agents, setAgents] = useState<Record<string, AIAgentConfig>>(defaultAgents)
    const [services, setServices] = useState<ExternalService[]>(externalServices)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [editingAgent, setEditingAgent] = useState<string | null>(null)
    const [qualityMode, setQualityMode] = useState<'standard' | 'enhanced' | 'maximum'>('enhanced')
    const [autoEnhance, setAutoEnhance] = useState(true)
    const [multiPassReview, setMultiPassReview] = useState(true)

    // Nano Banana Image Generation state
    const [imagePrompt, setImagePrompt] = useState('')
    const [imageStyle, setImageStyle] = useState<string>('academic')
    const [generatedImage, setGeneratedImage] = useState<{ svg: string; altText: string; refinedPrompt: string; palette: string[] } | null>(null)
    const [imageLoading, setImageLoading] = useState(false)

    // NotebookLM Research state
    const [researchTopic, setResearchTopic] = useState('')
    const [researchDepth, setResearchDepth] = useState<string>('intermediate')
    const [researchResult, setResearchResult] = useState<{ synthesis: string; keyInsights: string[]; suggestedTopics: string[] } | null>(null)
    const [researchLoading, setResearchLoading] = useState(false)

    // Nano Banana: Generate Image
    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) return
        setImageLoading(true)
        setGeneratedImage(null)
        try {
            const res = await fetch('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: imagePrompt, style: imageStyle }),
            })
            if (res.ok) {
                const data = await res.json()
                setGeneratedImage(data.image)
                setMessage({ type: 'success', text: 'Image generated successfully!' })
            } else {
                setMessage({ type: 'error', text: 'Image generation failed' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error during image generation' })
        } finally {
            setImageLoading(false)
            setTimeout(() => setMessage(null), 3000)
        }
    }

    // NotebookLM: Research Synthesis
    const handleResearch = async () => {
        if (!researchTopic.trim()) return
        setResearchLoading(true)
        setResearchResult(null)
        try {
            const res = await fetch('/api/ai-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'research',
                    topic: researchTopic,
                    depth: researchDepth,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                setResearchResult(data.result)
                setMessage({ type: 'success', text: 'Research synthesis complete!' })
            } else {
                setMessage({ type: 'error', text: 'Research synthesis failed' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error during research' })
        } finally {
            setResearchLoading(false)
            setTimeout(() => setMessage(null), 3000)
        }
    }

    const handleSaveSettings = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/ai-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agents,
                    qualityMode,
                    autoEnhance,
                    multiPassReview,
                }),
            })
            if (res.ok) {
                setMessage({ type: 'success', text: 'AI features saved successfully' })
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error saving settings' })
        } finally {
            setSaving(false)
            setTimeout(() => setMessage(null), 3000)
        }
    }

    const toggleAgent = (agentId: string) => {
        setAgents(prev => ({
            ...prev,
            [agentId]: { ...prev[agentId], enabled: !prev[agentId].enabled }
        }))
    }

    const updateAgentPrompt = (agentId: string, prompt: string) => {
        setAgents(prev => ({
            ...prev,
            [agentId]: { ...prev[agentId], systemPrompt: prompt }
        }))
    }

    return (
        <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="agents">
                    <Bot className="mr-2 size-4" /> AI Agents
                </TabsTrigger>
                <TabsTrigger value="services">
                    <Star className="mr-2 size-4" /> External Services
                </TabsTrigger>
                <TabsTrigger value="studio">
                    <ImageIcon className="mr-2 size-4" /> AI Studio
                </TabsTrigger>
                <TabsTrigger value="quality">
                    <Shield className="mr-2 size-4" /> Quality Control
                </TabsTrigger>
            </TabsList>

            {/* AI Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
                <Alert>
                    <Lightbulb className="size-4" />
                    <AlertDescription>
                        AI Agents enhance content generation quality. Each agent specializes in a specific area and can review, improve, and optimize generated content.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(agents).map(([id, agent]) => (
                        <Card key={id} className={agent.enabled ? 'border-green-200 dark:border-green-800' : 'opacity-60'}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {id === 'content-enhancer' && <Wand2 className="size-5 text-blue-500" />}
                                        {id === 'presentation-designer' && <Monitor className="size-5 text-purple-500" />}
                                        {id === 'assessment-generator' && <GraduationCap className="size-5 text-green-500" />}
                                        {id === 'discussion-facilitator' && <MessageSquare className="size-5 text-orange-500" />}
                                        {agent.name}
                                    </CardTitle>
                                    <Switch
                                        checked={agent.enabled}
                                        onCheckedChange={() => toggleAgent(id)}
                                    />
                                </div>
                                <CardDescription>{agent.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        <Cpu className="mr-1 size-3" />
                                        Model: {agent.model}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Temp: {agent.temperature}
                                    </Badge>
                                </div>

                                {editingAgent === id ? (
                                    <div className="space-y-2">
                                        <Label className="text-xs">System Prompt</Label>
                                        <Textarea
                                            value={agent.systemPrompt}
                                            onChange={(e) => updateAgentPrompt(id, e.target.value)}
                                            rows={6}
                                            className="text-xs"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingAgent(null)}>
                                                Done
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setAgents(prev => ({
                                                    ...prev,
                                                    [id]: { ...prev[id], systemPrompt: defaultAgents[id].systemPrompt }
                                                }))
                                            }}>
                                                <RefreshCw className="mr-1 size-3" /> Reset
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs"
                                        onClick={() => setEditingAgent(id)}
                                    >
                                        <Settings className="mr-1 size-3" /> Customize Prompt
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Save Agent Settings
                    </Button>
                </div>
            </TabsContent>

            {/* External Services Tab */}
            <TabsContent value="services" className="space-y-6">
                <Alert>
                    <Star className="size-4" />
                    <AlertDescription>
                        Connect external AI services to enhance content generation. Services are used based on the type of content being created.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    {services.map((service) => (
                        <Card key={service.id} className={service.status === 'connected' ? 'border-green-200 dark:border-green-800' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {service.icon}
                                        <div>
                                            <CardTitle className="text-lg">{service.name}</CardTitle>
                                            <CardDescription className="mt-1">{service.description}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {service.status === 'connected' && (
                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                <CheckCircle className="mr-1 size-3" /> Connected
                                            </Badge>
                                        )}
                                        {service.status === 'disconnected' && (
                                            <Badge variant="outline" className="text-yellow-600">
                                                <AlertCircle className="mr-1 size-3" /> Not Connected
                                            </Badge>
                                        )}
                                        {service.status === 'coming_soon' && (
                                            <Badge variant="secondary">
                                                Coming Soon
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {service.features.map((feature) => (
                                        <Badge key={feature} variant="outline" className="text-xs">
                                            {feature}
                                        </Badge>
                                    ))}
                                </div>

                                {service.status !== 'coming_soon' && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={service.docsUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-1 size-3" /> Get API Key
                                            </a>
                                        </Button>
                                        {service.apiKeyField && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href="/dashboard/settings/ai">
                                                    <Settings className="mr-1 size-3" /> Configure in AI Settings
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {service.status === 'coming_soon' && (
                                    <p className="text-sm text-muted-foreground">
                                        Integration with {service.name} is under development. Check back soon for updates.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>

            {/* AI Studio Tab - NotebookLM Research + Nano Banana Image Generation */}
            <TabsContent value="studio" className="space-y-6">
                <Alert>
                    <ImageIcon className="size-4" />
                    <AlertDescription>
                        Use NotebookLM for deep research synthesis and Nano Banana for AI-powered image and visual content creation.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* NotebookLM Research Panel */}
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="size-5 text-blue-500" />
                                NotebookLM Research
                            </CardTitle>
                            <CardDescription>
                                Deep research synthesis for academic topics. Generates key insights and suggested sub-topics.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Research Topic</Label>
                                <Textarea
                                    placeholder="e.g., Machine Learning in Healthcare: Applications and Ethical Considerations"
                                    value={researchTopic}
                                    onChange={(e) => setResearchTopic(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Academic Depth</Label>
                                <Select value={researchDepth} onValueChange={setResearchDepth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="introductory">Introductory</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleResearch}
                                disabled={researchLoading || !researchTopic.trim()}
                                className="w-full"
                            >
                                {researchLoading ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <Lightbulb className="mr-2 size-4" />
                                )}
                                {researchLoading ? 'Synthesizing...' : 'Research & Synthesize'}
                            </Button>

                            {researchResult && (
                                <div className="space-y-3 rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-950/20">
                                    <div className="max-h-60 overflow-y-auto text-sm whitespace-pre-wrap">
                                        {researchResult.synthesis.substring(0, 1000)}
                                        {researchResult.synthesis.length > 1000 && '...'}
                                    </div>
                                    {researchResult.keyInsights.length > 0 && (
                                        <div>
                                            <h4 className="mb-1 text-xs font-semibold text-blue-700 dark:text-blue-300">Key Insights</h4>
                                            <ul className="space-y-1">
                                                {researchResult.keyInsights.map((insight, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs">
                                                        <CheckCircle className="mt-0.5 size-3 shrink-0 text-blue-500" />
                                                        {insight}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {researchResult.suggestedTopics.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {researchResult.suggestedTopics.map((topic, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="cursor-pointer text-xs hover:bg-blue-100"
                                                    onClick={() => setResearchTopic(topic)}
                                                >
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Nano Banana Image Generation Panel */}
                    <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="size-5 text-purple-500" />
                                Nano Banana Image Creator
                            </CardTitle>
                            <CardDescription>
                                AI-powered visual generation for slides, lectures, and educational content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Image Description</Label>
                                <Textarea
                                    placeholder="e.g., A diagram showing the layers of a neural network with labeled input, hidden, and output layers"
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Visual Style</Label>
                                <Select value={imageStyle} onValueChange={setImageStyle}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="academic">Academic</SelectItem>
                                        <SelectItem value="infographic">Infographic</SelectItem>
                                        <SelectItem value="diagram">Diagram</SelectItem>
                                        <SelectItem value="photo-realistic">Photo-Realistic</SelectItem>
                                        <SelectItem value="illustration">Illustration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleGenerateImage}
                                disabled={imageLoading || !imagePrompt.trim()}
                                className="w-full"
                                variant="default"
                            >
                                {imageLoading ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <ImageIcon className="mr-2 size-4" />
                                )}
                                {imageLoading ? 'Generating...' : 'Generate Visual'}
                            </Button>

                            {generatedImage && (
                                <div className="space-y-3 rounded-lg border bg-purple-50/50 p-4 dark:bg-purple-950/20">
                                    <div
                                        className="flex items-center justify-center rounded-md border bg-white p-2 dark:bg-gray-900"
                                        dangerouslySetInnerHTML={{ __html: generatedImage.svg }}
                                    />
                                    <p className="text-xs text-muted-foreground">{generatedImage.altText}</p>
                                    {generatedImage.palette && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Palette:</span>
                                            {generatedImage.palette.map((color, i) => (
                                                <div
                                                    key={i}
                                                    className="size-5 rounded-full border"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const blob = new Blob([generatedImage.svg], { type: 'image/svg+xml' })
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = 'nano-banana-visual.svg'
                                                a.click()
                                                URL.revokeObjectURL(url)
                                            }}
                                        >
                                            <Download className="mr-1 size-3" /> Download SVG
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* How it works */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="size-5" />
                            How These Tools Enhance Your Content
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 rounded-lg border-l-4 border-blue-400 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                                <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    <Lightbulb className="size-4 text-blue-500" /> NotebookLM in Content Pipeline
                                </h4>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                    <li>• Automatically runs in Course Studio when generating presentations</li>
                                    <li>• Synthesizes uploaded source materials into research-backed content</li>
                                    <li>• Extracts key insights to enrich lecture outlines</li>
                                    <li>• Multi-pass quality review ensures academic rigor</li>
                                </ul>
                            </div>
                            <div className="space-y-2 rounded-lg border-l-4 border-purple-400 bg-purple-50/50 p-4 dark:bg-purple-950/20">
                                <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    <Palette className="size-4 text-purple-500" /> Nano Banana in Content Pipeline
                                </h4>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                    <li>• Enhances slide layout and visual hierarchy during generation</li>
                                    <li>• Generates AI visuals and diagrams for presentation slides</li>
                                    <li>• Suggests image descriptions for each content section</li>
                                    <li>• Professional color schemes and formatting applied automatically</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Quality Control Tab */}
            <TabsContent value="quality" className="space-y-6">
                <Alert>
                    <Shield className="size-4" />
                    <AlertDescription>
                        Configure how AI agents review and enhance generated content before delivery.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="size-5" />
                            Generation Quality Mode
                        </CardTitle>
                        <CardDescription>
                            Controls the depth of AI processing for content generation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    value: 'standard' as const,
                                    title: 'Standard',
                                    desc: 'Single-pass generation. Fast but basic quality.',
                                    badge: 'Fast',
                                    color: 'text-blue-600',
                                },
                                {
                                    value: 'enhanced' as const,
                                    title: 'Enhanced',
                                    desc: 'AI agent reviews and improves output. Recommended.',
                                    badge: 'Recommended',
                                    color: 'text-green-600',
                                },
                                {
                                    value: 'maximum' as const,
                                    title: 'Maximum',
                                    desc: 'Multi-agent pipeline with fact-checking and refinement.',
                                    badge: 'Best Quality',
                                    color: 'text-purple-600',
                                },
                            ].map((mode) => (
                                <button
                                    key={mode.value}
                                    onClick={() => setQualityMode(mode.value)}
                                    className={`rounded-lg border-2 p-4 text-left transition-all ${qualityMode === mode.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{mode.title}</span>
                                        <Badge variant="outline" className={`text-xs ${mode.color}`}>
                                            {mode.badge}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">{mode.desc}</p>
                                </button>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Auto-Enhance Content</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Automatically run the Content Enhancer agent on all generated content
                                    </p>
                                </div>
                                <Switch checked={autoEnhance} onCheckedChange={setAutoEnhance} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Multi-Pass Review</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Run content through multiple AI agents for comprehensive review
                                    </p>
                                </div>
                                <Switch checked={multiPassReview} onCheckedChange={setMultiPassReview} />
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="mb-3 text-sm font-medium">AI Enhancement Pipeline</h4>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                <div className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
                                    <FileText className="size-4 text-blue-500" />
                                    <span className="text-xs font-medium">Generate</span>
                                </div>
                                <span className="text-muted-foreground">→</span>
                                {autoEnhance && (
                                    <>
                                        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/30">
                                            <Wand2 className="size-4 text-green-500" />
                                            <span className="text-xs font-medium">Enhance</span>
                                        </div>
                                        <span className="text-muted-foreground">→</span>
                                    </>
                                )}
                                {multiPassReview && (
                                    <>
                                        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 dark:bg-purple-950/30">
                                            <Lightbulb className="size-4 text-purple-500" />
                                            <span className="text-xs font-medium">Review</span>
                                        </div>
                                        <span className="text-muted-foreground">→</span>
                                    </>
                                )}
                                <div className="flex shrink-0 items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-950/30">
                                    <CheckCircle className="size-4 text-orange-500" />
                                    <span className="text-xs font-medium">Deliver</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Content Generation Targets
                        </CardTitle>
                        <CardDescription>
                            Which content types benefit from AI agent enhancement
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {[
                                { label: 'Lecture Presentations', icon: Monitor, enabled: true },
                                { label: 'Lecture Notes', icon: FileText, enabled: true },
                                { label: 'Syllabi', icon: BookOpen, enabled: true },
                                { label: 'Assessments & Quizzes', icon: GraduationCap, enabled: true },
                                { label: 'Discussion Prompts', icon: MessageSquare, enabled: true },
                                { label: 'Grading Feedback', icon: Wand2, enabled: true },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center gap-2">
                                        <item.icon className="size-4 text-muted-foreground" />
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    <Switch defaultChecked={item.enabled} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Save Quality Settings
                    </Button>
                </div>

                {message && (
                    <Alert className={message.type === 'success' ? 'border-green-200' : 'border-red-200'}>
                        {message.type === 'success' ? <CheckCircle className="size-4 text-green-500" /> : <AlertCircle className="size-4 text-red-500" />}
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
    )
}
