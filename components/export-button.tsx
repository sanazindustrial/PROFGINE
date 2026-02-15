'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileType, Monitor, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

// =============================================================================
// TYPES
// =============================================================================

export interface ExportButtonProps {
    /** Type of content to export */
    type: 'syllabus' | 'lecture'
    /** Course ID (for syllabus export) */
    courseId?: string
    /** Syllabus ID (optional, for specific syllabus version) */
    syllabusId?: string
    /** Section ID (for lecture export from database) */
    sectionId?: string
    /** Manual lecture data (for direct lecture export) */
    lectureData?: {
        title: string
        courseTitle?: string
        date?: string
        objectives?: string[]
        sections?: { title: string; content: string; activities?: string[] }[]
        keyTerms?: { term: string; definition: string }[]
        summary?: string
        nextClass?: string
    }
    /** Button variant */
    variant?: 'default' | 'outline' | 'ghost' | 'secondary'
    /** Button size */
    size?: 'default' | 'sm' | 'lg' | 'icon'
    /** Custom class name */
    className?: string
    /** Show as dropdown or single button */
    mode?: 'dropdown' | 'single'
    /** Single format (when mode is 'single') */
    format?: 'pdf' | 'docx' | 'pptx' | 'all'
    /** Callback after successful export */
    onExportComplete?: (result: ExportResult) => void
}

export interface ExportResult {
    success: boolean
    format: string
    url?: string
    fileName?: string
    error?: string
}

// =============================================================================
// FORMAT ICONS
// =============================================================================

const formatIcons = {
    pdf: FileText,
    docx: FileType,
    word: FileType,
    pptx: Monitor,
    powerpoint: Monitor,
    all: Download,
}

const formatLabels = {
    pdf: 'PDF Document',
    docx: 'Word Document',
    word: 'Word Document',
    pptx: 'PowerPoint',
    powerpoint: 'PowerPoint',
    all: 'All Formats',
}

// =============================================================================
// EXPORT BUTTON COMPONENT
// =============================================================================

export function ExportButton({
    type,
    courseId,
    syllabusId,
    sectionId,
    lectureData,
    variant = 'outline',
    size = 'default',
    className,
    mode = 'dropdown',
    format,
    onExportComplete,
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [exportingFormat, setExportingFormat] = useState<string | null>(null)

    const handleExport = async (selectedFormat: string) => {
        setIsExporting(true)
        setExportingFormat(selectedFormat)

        try {
            const payload: Record<string, any> = {
                type,
                format: selectedFormat,
            }

            if (type === 'syllabus') {
                if (syllabusId) payload.syllabusId = syllabusId
                else if (courseId) payload.courseId = courseId
                else throw new Error('courseId or syllabusId required for syllabus export')
            } else if (type === 'lecture') {
                if (sectionId) payload.sectionId = sectionId
                else if (lectureData) payload.lectureData = lectureData
                else throw new Error('sectionId or lectureData required for lecture export')
            }

            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Export failed')
            }

            if (result.success && result.url) {
                // Download the file
                const link = document.createElement('a')
                link.href = result.url
                link.download = result.fileName || `export.${selectedFormat}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                toast({
                    title: 'Export successful',
                    description: `${formatLabels[selectedFormat as keyof typeof formatLabels] || selectedFormat} exported successfully`,
                })
            } else if (result.exports) {
                // Multiple exports (all formats)
                const successful = Object.entries(result.exports)
                    .filter(([_, exp]: [string, any]) => exp.success)
                    .length
                toast({
                    title: 'Export complete',
                    description: `${successful} files exported successfully`,
                })
            }

            onExportComplete?.(result)
        } catch (error) {
            console.error('[Export] Error:', error)
            toast({
                title: 'Export failed',
                description: error instanceof Error ? error.message : 'Export failed',
                variant: 'destructive',
            })
        } finally {
            setIsExporting(false)
            setExportingFormat(null)
        }
    }

    // Single button mode
    if (mode === 'single' && format) {
        const Icon = formatIcons[format as keyof typeof formatIcons] || Download
        return (
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={() => handleExport(format)}
                disabled={isExporting}
            >
                {isExporting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <Icon className="mr-2 size-4" />
                )}
                {isExporting ? 'Exporting...' : `Export ${formatLabels[format as keyof typeof formatLabels]}`}
            </Button>
        )
    }

    // Dropdown mode
    const availableFormats = type === 'syllabus'
        ? ['pdf', 'docx', 'pptx', 'all']
        : ['pdf', 'docx', 'pptx', 'all']

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className} disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 size-4" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                    Export {type === 'syllabus' ? 'Syllabus' : 'Lecture Notes'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableFormats.map((fmt) => {
                    const Icon = formatIcons[fmt as keyof typeof formatIcons] || Download
                    return (
                        <DropdownMenuItem
                            key={fmt}
                            onClick={() => handleExport(fmt)}
                            disabled={isExporting}
                            className="cursor-pointer"
                        >
                            {exportingFormat === fmt ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Icon className="mr-2 size-4" />
                            )}
                            {formatLabels[fmt as keyof typeof formatLabels]}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// =============================================================================
// QUICK EXPORT HOOKS
// =============================================================================

export function useExport() {
    const [isExporting, setIsExporting] = useState(false)

    const exportSyllabus = async (
        courseId: string,
        format: 'pdf' | 'docx' | 'pptx' | 'all' = 'pdf'
    ): Promise<ExportResult> => {
        setIsExporting(true)
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'syllabus', courseId, format }),
            })
            return await response.json()
        } finally {
            setIsExporting(false)
        }
    }

    const exportLecture = async (
        sectionId: string,
        format: 'pdf' | 'docx' | 'pptx' | 'all' = 'pptx'
    ): Promise<ExportResult> => {
        setIsExporting(true)
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'lecture', sectionId, format }),
            })
            return await response.json()
        } finally {
            setIsExporting(false)
        }
    }

    return {
        isExporting,
        exportSyllabus,
        exportLecture,
    }
}
