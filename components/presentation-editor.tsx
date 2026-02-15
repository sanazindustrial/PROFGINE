'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Download,
    Edit,
    Eye,
    FileText,
    Monitor,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Copy,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    Save,
    X,
    ImageIcon,
    Type,
    List,
    ExternalLink,
    FileSpreadsheet,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface Slide {
    id: string
    title: string
    content: SlideContent[]
    notes?: string
    layout: 'title' | 'content' | 'twoColumn' | 'imageLeft' | 'imageRight' | 'bullets' | 'blank'
    backgroundColor?: string
    theme?: 'light' | 'dark' | 'professional' | 'academic'
}

export interface SlideContent {
    id: string
    type: 'text' | 'heading' | 'bullets' | 'image' | 'code' | 'quote'
    content: string
    style?: {
        fontSize?: string
        fontWeight?: string
        color?: string
        align?: 'left' | 'center' | 'right'
    }
}

export interface PresentationData {
    id?: string
    title: string
    subtitle?: string
    author?: string
    date?: string
    slides: Slide[]
    theme: PresentationTheme
}

export interface PresentationTheme {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    accentColor: string
    fontFamily: string
    titleFont?: string
}

export interface PresentationEditorProps {
    /** Initial presentation data */
    initialData?: Partial<PresentationData>
    /** Course ID for syllabus generation */
    courseId?: string
    /** Section ID for lecture generation */
    sectionId?: string
    /** Type of presentation */
    type: 'syllabus' | 'lecture' | 'custom'
    /** Callback when presentation is exported */
    onExport?: (format: string, data: PresentationData) => void
    /** Callback when save is requested */
    onSave?: (data: PresentationData) => void
    /** Read-only mode */
    readOnly?: boolean
    /** Dialog mode */
    isDialog?: boolean
}

// =============================================================================
// DEFAULT THEME
// =============================================================================

const defaultTheme: PresentationTheme = {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#3b82f6',
    fontFamily: 'Inter, system-ui, sans-serif',
    titleFont: 'Inter, system-ui, sans-serif',
}

// =============================================================================
// LAYOUT TEMPLATES
// =============================================================================

const layoutTemplates: Record<Slide['layout'], { name: string; icon: React.ReactNode }> = {
    title: { name: 'Title Slide', icon: <Type className="size-4" /> },
    content: { name: 'Content', icon: <FileText className="size-4" /> },
    twoColumn: { name: 'Two Columns', icon: <List className="size-4" /> },
    imageLeft: { name: 'Image Left', icon: <ImageIcon className="size-4" /> },
    imageRight: { name: 'Image Right', icon: <ImageIcon className="size-4" /> },
    bullets: { name: 'Bullet Points', icon: <List className="size-4" /> },
    blank: { name: 'Blank', icon: <Monitor className="size-4" /> },
}

// =============================================================================
// EXPORT FORMATS
// =============================================================================

const exportFormats = [
    { id: 'pptx', name: 'PowerPoint (.pptx)', icon: Monitor, description: 'Microsoft PowerPoint format' },
    { id: 'pdf', name: 'PDF Document', icon: FileText, description: 'Portable Document Format' },
    { id: 'google', name: 'Google Slides', icon: ExternalLink, description: 'Opens in Google Slides' },
    { id: 'key', name: 'Keynote (.key)', icon: Monitor, description: 'Apple Keynote format' },
    { id: 'odp', name: 'OpenDocument (.odp)', icon: FileSpreadsheet, description: 'LibreOffice Impress format' },
    { id: 'html', name: 'HTML Presentation', icon: FileText, description: 'Web-based presentation' },
    { id: 'images', name: 'Images (PNG)', icon: ImageIcon, description: 'Export slides as images' },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
    return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function createDefaultSlide(layout: Slide['layout'] = 'content'): Slide {
    return {
        id: generateId(),
        title: 'New Slide',
        content: [
            {
                id: generateId(),
                type: 'text',
                content: 'Click to edit content',
            },
        ],
        layout,
        notes: '',
    }
}

function createTitleSlide(title: string, subtitle?: string): Slide {
    return {
        id: generateId(),
        title,
        content: subtitle
            ? [{ id: generateId(), type: 'text', content: subtitle }]
            : [],
        layout: 'title',
        notes: '',
    }
}

// =============================================================================
// SLIDE PREVIEW COMPONENT
// =============================================================================

function SlidePreview({
    slide,
    theme,
    isActive,
    onClick,
    slideNumber,
    compact = false,
}: {
    slide: Slide
    theme: PresentationTheme
    isActive: boolean
    onClick: () => void
    slideNumber: number
    compact?: boolean
}) {
    const bgColor = slide.backgroundColor || theme.backgroundColor

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative cursor-pointer rounded-lg border-2 transition-all',
                isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50',
                compact ? 'aspect-video w-full' : 'aspect-video w-48'
            )}
        >
            {/* Slide content preview */}
            <div
                className="size-full overflow-hidden rounded-md p-2"
                style={{ backgroundColor: bgColor }}
            >
                {slide.layout === 'title' ? (
                    <div className="flex size-full flex-col items-center justify-center text-center">
                        <h3
                            className="line-clamp-2 text-xs font-bold"
                            style={{ color: theme.primaryColor }}
                        >
                            {slide.title}
                        </h3>
                        {slide.content[0] && (
                            <p className="mt-1 line-clamp-1 text-[8px] text-muted-foreground">
                                {slide.content[0].content}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="size-full">
                        <h4
                            className="line-clamp-1 text-[10px] font-semibold"
                            style={{ color: theme.primaryColor }}
                        >
                            {slide.title}
                        </h4>
                        <div className="mt-1 space-y-0.5">
                            {slide.content.slice(0, 3).map((item) => (
                                <p
                                    key={item.id}
                                    className="line-clamp-1 text-[7px] text-muted-foreground"
                                >
                                    {item.type === 'bullets' ? '• ' : ''}
                                    {item.content}
                                </p>
                            ))}
                            {slide.content.length > 3 && (
                                <p className="text-[6px] text-muted-foreground">
                                    +{slide.content.length - 3} more
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Slide number badge */}
            <Badge
                variant="secondary"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px]"
            >
                {slideNumber}
            </Badge>
        </div>
    )
}

// =============================================================================
// SLIDE EDITOR COMPONENT
// =============================================================================

function SlideEditor({
    slide,
    theme,
    onChange,
    onAddContent,
    onRemoveContent,
    onUpdateContent,
}: {
    slide: Slide
    theme: PresentationTheme
    onChange: (slide: Slide) => void
    onAddContent: (type: SlideContent['type']) => void
    onRemoveContent: (contentId: string) => void
    onUpdateContent: (contentId: string, content: string) => void
}) {
    return (
        <div className="space-y-4">
            {/* Slide Title */}
            <div className="space-y-2">
                <Label htmlFor="slide-title">Slide Title</Label>
                <Input
                    id="slide-title"
                    value={slide.title}
                    onChange={(e) => onChange({ ...slide, title: e.target.value })}
                    placeholder="Enter slide title"
                    className="text-lg font-semibold"
                />
            </div>

            {/* Layout selector */}
            <div className="space-y-2">
                <Label>Layout</Label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(layoutTemplates).map(([key, { name, icon }]) => (
                        <Button
                            key={key}
                            variant={slide.layout === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onChange({ ...slide, layout: key as Slide['layout'] })}
                            className="gap-1"
                        >
                            {icon}
                            <span className="hidden sm:inline">{name}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Content items */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Content</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="mr-1 size-4" />
                                Add Content
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onAddContent('text')}>
                                <Type className="mr-2 size-4" />
                                Text
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddContent('heading')}>
                                <Type className="mr-2 size-4" />
                                Heading
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddContent('bullets')}>
                                <List className="mr-2 size-4" />
                                Bullet Points
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddContent('quote')}>
                                <FileText className="mr-2 size-4" />
                                Quote
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-3">
                    {slide.content.map((item, index) => (
                        <div key={item.id} className="group relative rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <Badge variant="outline" className="capitalize">
                                    {item.type}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => onRemoveContent(item.id)}
                                >
                                    <Trash2 className="size-3 text-destructive" />
                                </Button>
                            </div>
                            {item.type === 'bullets' ? (
                                <Textarea
                                    value={item.content}
                                    onChange={(e) => onUpdateContent(item.id, e.target.value)}
                                    placeholder="Enter bullet points (one per line)"
                                    rows={4}
                                    className="text-sm"
                                />
                            ) : (
                                <Textarea
                                    value={item.content}
                                    onChange={(e) => onUpdateContent(item.id, e.target.value)}
                                    placeholder={`Enter ${item.type} content`}
                                    rows={item.type === 'text' ? 3 : 2}
                                    className={cn(
                                        'text-sm',
                                        item.type === 'heading' && 'text-lg font-semibold',
                                        item.type === 'quote' && 'italic'
                                    )}
                                />
                            )}
                        </div>
                    ))}

                    {slide.content.length === 0 && (
                        <div className="rounded-md border-2 border-dashed p-8 text-center text-muted-foreground">
                            <p>No content yet. Click &quot;Add Content&quot; to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Speaker Notes */}
            <div className="space-y-2">
                <Label htmlFor="speaker-notes">Speaker Notes</Label>
                <Textarea
                    id="speaker-notes"
                    value={slide.notes || ''}
                    onChange={(e) => onChange({ ...slide, notes: e.target.value })}
                    placeholder="Add notes for the presenter (not visible in presentation)"
                    rows={3}
                    className="text-sm"
                />
            </div>
        </div>
    )
}

// =============================================================================
// FULL SCREEN PREVIEW
// =============================================================================

function FullScreenPreview({
    slides,
    theme,
    currentSlide,
    onClose,
    onSlideChange,
}: {
    slides: Slide[]
    theme: PresentationTheme
    currentSlide: number
    onClose: () => void
    onSlideChange: (index: number) => void
}) {
    const slide = slides[currentSlide]

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight' || e.key === ' ') {
                if (currentSlide < slides.length - 1) onSlideChange(currentSlide + 1)
            }
            if (e.key === 'ArrowLeft') {
                if (currentSlide > 0) onSlideChange(currentSlide - 1)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentSlide, slides.length, onClose, onSlideChange])

    if (!slide) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-black/50 px-4 py-2 text-white">
                <span className="text-sm">
                    Slide {currentSlide + 1} of {slides.length}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0}
                        className="text-white hover:text-white"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
                        disabled={currentSlide === slides.length - 1}
                        className="text-white hover:text-white"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white hover:text-white"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Slide content */}
            <div className="flex flex-1 items-center justify-center p-8">
                <div
                    className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg shadow-2xl"
                    style={{ backgroundColor: slide.backgroundColor || theme.backgroundColor }}
                >
                    {slide.layout === 'title' ? (
                        <div className="flex size-full flex-col items-center justify-center p-12 text-center">
                            <h1
                                className="text-5xl font-bold"
                                style={{ color: theme.primaryColor }}
                            >
                                {slide.title}
                            </h1>
                            {slide.content[0] && (
                                <p
                                    className="mt-6 text-2xl"
                                    style={{ color: theme.textColor }}
                                >
                                    {slide.content[0].content}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="size-full p-12">
                            <h2
                                className="mb-8 text-3xl font-bold"
                                style={{ color: theme.primaryColor }}
                            >
                                {slide.title}
                            </h2>
                            <div className="space-y-4">
                                {slide.content.map((item) => (
                                    <div key={item.id}>
                                        {item.type === 'heading' && (
                                            <h3
                                                className="text-2xl font-semibold"
                                                style={{ color: theme.secondaryColor }}
                                            >
                                                {item.content}
                                            </h3>
                                        )}
                                        {item.type === 'text' && (
                                            <p
                                                className="text-xl"
                                                style={{ color: theme.textColor }}
                                            >
                                                {item.content}
                                            </p>
                                        )}
                                        {item.type === 'bullets' && (
                                            <ul className="ml-6 list-disc space-y-2">
                                                {item.content.split('\n').map((bullet, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-xl"
                                                        style={{ color: theme.textColor }}
                                                    >
                                                        {bullet}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {item.type === 'quote' && (
                                            <blockquote
                                                className="border-l-4 pl-4 text-xl italic"
                                                style={{
                                                    color: theme.textColor,
                                                    borderColor: theme.accentColor,
                                                }}
                                            >
                                                {item.content}
                                            </blockquote>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation hint */}
            <div className="px-4 py-2 text-center text-sm text-gray-400">
                Use arrow keys or click buttons to navigate • Press ESC to exit
            </div>
        </div>
    )
}

// =============================================================================
// MAIN PRESENTATION EDITOR COMPONENT
// =============================================================================

export function PresentationEditor({
    initialData,
    courseId,
    sectionId,
    type,
    onExport,
    onSave,
    readOnly = false,
    isDialog = false,
}: PresentationEditorProps) {
    // State
    const [presentation, setPresentation] = useState<PresentationData>(() => ({
        title: initialData?.title || 'Untitled Presentation',
        subtitle: initialData?.subtitle || '',
        author: initialData?.author || '',
        date: initialData?.date || new Date().toLocaleDateString(),
        slides: initialData?.slides || [
            createTitleSlide(initialData?.title || 'Untitled Presentation', initialData?.subtitle),
        ],
        theme: initialData?.theme || defaultTheme,
    }))
    const [activeSlideIndex, setActiveSlideIndex] = useState(0)
    const [isExporting, setIsExporting] = useState(false)
    const [exportFormat, setExportFormat] = useState<string | null>(null)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

    const activeSlide = presentation.slides[activeSlideIndex]

    // Load presentation data from API
    const loadPresentationData = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (type === 'syllabus' && courseId) params.append('courseId', courseId)
            if (type === 'lecture' && sectionId) params.append('sectionId', sectionId)
            params.append('preview', 'true')

            const response = await fetch(`/api/export/preview?${params}`)
            if (response.ok) {
                const data = await response.json()
                if (data.slides) {
                    setPresentation((prev) => ({
                        ...prev,
                        title: data.title || prev.title,
                        slides: data.slides,
                    }))
                }
            }
        } catch (error) {
            console.error('Failed to load presentation data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-load presentation data on mount
    useEffect(() => {
        if ((courseId || sectionId) && !initialData?.slides?.length) {
            loadPresentationData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, sectionId])

    // Slide operations
    const addSlide = useCallback((afterIndex?: number) => {
        const newSlide = createDefaultSlide()
        setPresentation((prev) => {
            const insertIndex = afterIndex !== undefined ? afterIndex + 1 : prev.slides.length
            const newSlides = [...prev.slides]
            newSlides.splice(insertIndex, 0, newSlide)
            return { ...prev, slides: newSlides }
        })
        setActiveSlideIndex(afterIndex !== undefined ? afterIndex + 1 : presentation.slides.length)
    }, [presentation.slides.length])

    const deleteSlide = useCallback((index: number) => {
        if (presentation.slides.length <= 1) {
            toast({
                title: 'Cannot delete',
                description: 'Presentation must have at least one slide',
                variant: 'destructive',
            })
            return
        }
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.filter((_, i) => i !== index),
        }))
        setActiveSlideIndex(Math.min(index, presentation.slides.length - 2))
    }, [presentation.slides.length])

    const duplicateSlide = useCallback((index: number) => {
        const slide = presentation.slides[index]
        const newSlide: Slide = {
            ...slide,
            id: generateId(),
            title: `${slide.title} (Copy)`,
            content: slide.content.map((c) => ({ ...c, id: generateId() })),
        }
        setPresentation((prev) => {
            const newSlides = [...prev.slides]
            newSlides.splice(index + 1, 0, newSlide)
            return { ...prev, slides: newSlides }
        })
        setActiveSlideIndex(index + 1)
    }, [presentation.slides])

    const moveSlide = useCallback((index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= presentation.slides.length) return

        setPresentation((prev) => {
            const newSlides = [...prev.slides]
            const [removed] = newSlides.splice(index, 1)
            newSlides.splice(newIndex, 0, removed)
            return { ...prev, slides: newSlides }
        })
        setActiveSlideIndex(newIndex)
    }, [presentation.slides.length])

    const updateSlide = useCallback((slide: Slide) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map((s) => (s.id === slide.id ? slide : s)),
        }))
    }, [])

    const addContent = useCallback((type: SlideContent['type']) => {
        const newContent: SlideContent = {
            id: generateId(),
            type,
            content: type === 'bullets' ? 'Point 1\nPoint 2\nPoint 3' : '',
        }
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map((s, i) =>
                i === activeSlideIndex
                    ? { ...s, content: [...s.content, newContent] }
                    : s
            ),
        }))
    }, [activeSlideIndex])

    const removeContent = useCallback((contentId: string) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map((s, i) =>
                i === activeSlideIndex
                    ? { ...s, content: s.content.filter((c) => c.id !== contentId) }
                    : s
            ),
        }))
    }, [activeSlideIndex])

    const updateContent = useCallback((contentId: string, content: string) => {
        setPresentation((prev) => ({
            ...prev,
            slides: prev.slides.map((s, i) =>
                i === activeSlideIndex
                    ? {
                        ...s,
                        content: s.content.map((c) =>
                            c.id === contentId ? { ...c, content } : c
                        ),
                    }
                    : s
            ),
        }))
    }, [activeSlideIndex])

    // Export handler
    const handleExport = async (format: string) => {
        setIsExporting(true)
        setExportFormat(format)

        try {
            // For Google Slides, we'll export as PPTX and provide instructions
            const actualFormat = format === 'google' ? 'pptx' : format

            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    format: actualFormat,
                    presentationData: presentation,
                    courseId,
                    sectionId,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Export failed')
            }

            if (result.success && result.url) {
                // Download the file
                const link = document.createElement('a')
                link.href = result.url
                link.download = result.fileName || `${presentation.title}.${actualFormat}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                if (format === 'google') {
                    toast({
                        title: 'PowerPoint downloaded',
                        description: 'You can now upload this file to Google Drive and open with Google Slides',
                    })
                } else {
                    toast({
                        title: 'Export successful',
                        description: `Presentation exported as ${actualFormat.toUpperCase()}`,
                    })
                }
            }

            onExport?.(format, presentation)
        } catch (error) {
            console.error('[Export] Error:', error)
            toast({
                title: 'Export failed',
                description: error instanceof Error ? error.message : 'Export failed',
                variant: 'destructive',
            })
        } finally {
            setIsExporting(false)
            setExportFormat(null)
        }
    }

    // Save handler
    const handleSave = () => {
        onSave?.(presentation)
        toast({
            title: 'Saved',
            description: 'Presentation saved successfully',
        })
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Full screen preview
    if (isFullScreen) {
        return (
            <FullScreenPreview
                slides={presentation.slides}
                theme={presentation.theme}
                currentSlide={activeSlideIndex}
                onClose={() => setIsFullScreen(false)}
                onSlideChange={setActiveSlideIndex}
            />
        )
    }

    return (
        <div className={cn('flex flex-col gap-4', isDialog ? 'h-[70vh]' : 'h-full min-h-[600px]')}>
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <Input
                        value={presentation.title}
                        onChange={(e) =>
                            setPresentation((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="text-xl font-bold"
                        placeholder="Presentation Title"
                        disabled={readOnly}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsFullScreen(true)}>
                        <Maximize2 className="mr-1 size-4" />
                        Preview
                    </Button>
                    {onSave && !readOnly && (
                        <Button variant="outline" size="sm" onClick={handleSave}>
                            <Save className="mr-1 size-4" />
                            Save
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={isExporting}>
                                {isExporting ? (
                                    <Loader2 className="mr-1 size-4 animate-spin" />
                                ) : (
                                    <Download className="mr-1 size-4" />
                                )}
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {exportFormats.map((fmt) => {
                                const Icon = fmt.icon
                                return (
                                    <DropdownMenuItem
                                        key={fmt.id}
                                        onClick={() => handleExport(fmt.id)}
                                        disabled={isExporting}
                                    >
                                        <Icon className="mr-2 size-4" />
                                        <div className="flex-1">
                                            <div>{fmt.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {fmt.description}
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Slide list */}
                <div className="w-56 shrink-0">
                    <Card className="h-full">
                        <CardHeader className="p-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Slides</CardTitle>
                                {!readOnly && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => addSlide()}
                                    >
                                        <Plus className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-2">
                            <ScrollArea className="h-[calc(100%-60px)]">
                                <div className="space-y-3 pr-2">
                                    {presentation.slides.map((slide, index) => (
                                        <div key={slide.id} className="group relative">
                                            <SlidePreview
                                                slide={slide}
                                                theme={presentation.theme}
                                                isActive={index === activeSlideIndex}
                                                onClick={() => setActiveSlideIndex(index)}
                                                slideNumber={index + 1}
                                                compact
                                            />
                                            {/* Slide actions */}
                                            {!readOnly && (
                                                <div className="absolute -right-1 top-0 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="size-5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveSlide(index, 'up')
                                                        }}
                                                        disabled={index === 0}
                                                    >
                                                        <ArrowUp className="size-3" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="size-5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            moveSlide(index, 'down')
                                                        }}
                                                        disabled={index === presentation.slides.length - 1}
                                                    >
                                                        <ArrowDown className="size-3" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="size-5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            duplicateSlide(index)
                                                        }}
                                                    >
                                                        <Copy className="size-3" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="size-5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteSlide(index)
                                                        }}
                                                    >
                                                        <Trash2 className="size-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor/Preview area */}
                <div className="flex-1 overflow-hidden">
                    <Card className="h-full">
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}
                            className="flex h-full flex-col"
                        >
                            <CardHeader className="shrink-0 p-3">
                                <TabsList className="grid w-48 grid-cols-2">
                                    <TabsTrigger value="edit" disabled={readOnly}>
                                        <Edit className="mr-1 size-4" />
                                        Edit
                                    </TabsTrigger>
                                    <TabsTrigger value="preview">
                                        <Eye className="mr-1 size-4" />
                                        Preview
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden p-4">
                                <TabsContent value="edit" className="mt-0 h-full">
                                    {activeSlide && (
                                        <ScrollArea className="h-full pr-4">
                                            <SlideEditor
                                                slide={activeSlide}
                                                theme={presentation.theme}
                                                onChange={updateSlide}
                                                onAddContent={addContent}
                                                onRemoveContent={removeContent}
                                                onUpdateContent={updateContent}
                                            />
                                        </ScrollArea>
                                    )}
                                </TabsContent>
                                <TabsContent value="preview" className="mt-0 h-full">
                                    {activeSlide && (
                                        <div className="flex h-full items-center justify-center">
                                            <div
                                                className="aspect-video w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg"
                                                style={{
                                                    backgroundColor:
                                                        activeSlide.backgroundColor ||
                                                        presentation.theme.backgroundColor,
                                                }}
                                            >
                                                {activeSlide.layout === 'title' ? (
                                                    <div className="flex size-full flex-col items-center justify-center p-8 text-center">
                                                        <h1
                                                            className="text-3xl font-bold"
                                                            style={{
                                                                color: presentation.theme.primaryColor,
                                                            }}
                                                        >
                                                            {activeSlide.title}
                                                        </h1>
                                                        {activeSlide.content[0] && (
                                                            <p
                                                                className="mt-4 text-lg"
                                                                style={{
                                                                    color: presentation.theme.textColor,
                                                                }}
                                                            >
                                                                {activeSlide.content[0].content}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="size-full p-6">
                                                        <h2
                                                            className="mb-4 text-xl font-bold"
                                                            style={{
                                                                color: presentation.theme.primaryColor,
                                                            }}
                                                        >
                                                            {activeSlide.title}
                                                        </h2>
                                                        <div className="space-y-3">
                                                            {activeSlide.content.map((item) => (
                                                                <div key={item.id}>
                                                                    {item.type === 'heading' && (
                                                                        <h3
                                                                            className="text-lg font-semibold"
                                                                            style={{
                                                                                color: presentation.theme
                                                                                    .secondaryColor,
                                                                            }}
                                                                        >
                                                                            {item.content}
                                                                        </h3>
                                                                    )}
                                                                    {item.type === 'text' && (
                                                                        <p
                                                                            style={{
                                                                                color: presentation.theme
                                                                                    .textColor,
                                                                            }}
                                                                        >
                                                                            {item.content}
                                                                        </p>
                                                                    )}
                                                                    {item.type === 'bullets' && (
                                                                        <ul className="ml-4 list-disc space-y-1">
                                                                            {item.content
                                                                                .split('\n')
                                                                                .map((bullet, i) => (
                                                                                    <li
                                                                                        key={i}
                                                                                        style={{
                                                                                            color: presentation
                                                                                                .theme.textColor,
                                                                                        }}
                                                                                    >
                                                                                        {bullet}
                                                                                    </li>
                                                                                ))}
                                                                        </ul>
                                                                    )}
                                                                    {item.type === 'quote' && (
                                                                        <blockquote
                                                                            className="border-l-4 pl-3 italic"
                                                                            style={{
                                                                                color: presentation.theme
                                                                                    .textColor,
                                                                                borderColor:
                                                                                    presentation.theme
                                                                                        .accentColor,
                                                                            }}
                                                                        >
                                                                            {item.content}
                                                                        </blockquote>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// DIALOG WRAPPER
// =============================================================================

export function PresentationEditorDialog({
    trigger,
    ...props
}: PresentationEditorProps & { trigger: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Presentation Editor</DialogTitle>
                    <DialogDescription>
                        Preview and edit your presentation before exporting
                    </DialogDescription>
                </DialogHeader>
                <PresentationEditor {...props} isDialog />
            </DialogContent>
        </Dialog>
    )
}
