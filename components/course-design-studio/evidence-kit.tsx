"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Upload,
    FileText,
    Video,
    Link as LinkIcon,
    BookOpen,
    FileSpreadsheet,
    MoreVertical,
    Trash2,
    Eye,
    Download,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    Search,
    Filter,
    GripVertical,
} from "lucide-react"
import type { EvidenceKitItem, EvidenceFileType, EvidenceSourceType, ProcessingStatus } from "@/types/course-design-studio.types"

interface EvidenceKitProps {
    courseId: string
    courseDesignId?: string
    items: EvidenceKitItem[]
    onItemsChangeAction: (items: EvidenceKitItem[]) => void
    onDragStart?: (item: EvidenceKitItem) => void
    isReadOnly?: boolean
}

const fileTypeIcons: Record<EvidenceFileType, React.ReactNode> = {
    TEXTBOOK: <BookOpen className="size-4" />,
    ARTICLE: <FileText className="size-4" />,
    LECTURE_SLIDES: <FileSpreadsheet className="size-4" />,
    VIDEO: <Video className="size-4" />,
    NOTES: <FileText className="size-4" />,
    SYLLABUS: <FileText className="size-4" />,
    RUBRIC: <FileText className="size-4" />,
    EXTERNAL_LINK: <LinkIcon className="size-4" />,
    OTHER: <FileText className="size-4" />,
}

const statusColors: Record<ProcessingStatus, string> = {
    PENDING: "bg-yellow-500",
    PROCESSING: "bg-blue-500",
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
}

const statusIcons: Record<ProcessingStatus, React.ReactNode> = {
    PENDING: <Clock className="size-3" />,
    PROCESSING: <Loader2 className="size-3 animate-spin" />,
    COMPLETED: <CheckCircle2 className="size-3" />,
    FAILED: <AlertCircle className="size-3" />,
}

export function EvidenceKit({
    courseId,
    courseDesignId,
    items,
    onItemsChangeAction,
    onDragStart,
    isReadOnly = false,
}: EvidenceKitProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isAddingLink, setIsAddingLink] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<EvidenceFileType | "ALL">("ALL")
    const [selectedItem, setSelectedItem] = useState<EvidenceKitItem | null>(null)

    // Upload file handler
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0 || !courseDesignId) return

        setIsUploading(true)
        setUploadProgress(0)

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append("file", file)

                // Upload file
                const uploadResponse = await fetch("/api/uploads", {
                    method: "POST",
                    body: formData,
                })

                if (!uploadResponse.ok) {
                    throw new Error(`Failed to upload ${file.name}`)
                }

                const uploadData = await uploadResponse.json()

                // Add to evidence kit
                const response = await fetch("/api/course-design-studio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "add-evidence",
                        courseId,
                        item: {
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            fileName: file.name,
                            fileType: getFileType(file.type, file.name),
                            fileUrl: uploadData.fileUrl,
                            fileSize: file.size,
                            mimeType: file.type,
                            sourceType: "OTHER",
                        },
                    }),
                })

                if (response.ok) {
                    const { data } = await response.json()
                    onItemsChangeAction([...items, data])
                }

                setUploadProgress(((i + 1) / files.length) * 100)
            }
        } catch (error) {
            console.error("Upload error:", error)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }, [courseId, courseDesignId, items, onItemsChangeAction])

    // Add external link
    const handleAddLink = async (url: string, title: string, sourceType: EvidenceSourceType) => {
        if (!courseDesignId) return

        try {
            const response = await fetch("/api/course-design-studio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add-evidence",
                    courseId,
                    item: {
                        title,
                        fileName: url,
                        fileType: "EXTERNAL_LINK",
                        fileUrl: url,
                        externalUrl: url,
                        sourceType,
                    },
                }),
            })

            if (response.ok) {
                const { data } = await response.json()
                onItemsChangeAction([...items, data])
                setIsAddingLink(false)
            }
        } catch (error) {
            console.error("Add link error:", error)
        }
    }

    // Delete item
    const handleDelete = async (itemId: string) => {
        try {
            const response = await fetch(
                `/api/course-design-studio?courseId=${courseId}&action=evidence&id=${itemId}`,
                { method: "DELETE" }
            )

            if (response.ok) {
                onItemsChangeAction(items.filter(item => item.id !== itemId))
            }
        } catch (error) {
            console.error("Delete error:", error)
        }
    }

    // Reprocess item
    const handleReprocess = async (itemId: string) => {
        // Trigger reprocessing via API
        // This would call the processEvidenceItem method
    }

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesSearch = searchQuery === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === "ALL" || item.fileType === filterType
        return matchesSearch && matchesType
    })

    // Drag handlers for drag-and-drop to sections
    const handleDragStartItem = (e: React.DragEvent, item: EvidenceKitItem) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
            type: "evidence",
            id: item.id,
            title: item.title,
        }))
        e.dataTransfer.effectAllowed = "copy"
        onDragStart?.(item)
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Evidence Kit
                        </CardTitle>
                        <CardDescription>
                            Upload course materials for AI analysis
                        </CardDescription>
                    </div>
                    <Badge variant="outline">{items.length} items</Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Upload Area */}
                {!isReadOnly && (
                    <div
                        className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                        onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleFileUpload(e.dataTransfer.files)
                        }}
                        onClick={() => document.getElementById("evidence-file-input")?.click()}
                    >
                        {isUploading ? (
                            <div className="space-y-2">
                                <Loader2 className="mx-auto size-8 animate-spin text-primary" />
                                <Progress value={uploadProgress} className="mx-auto w-full max-w-xs" />
                                <p className="text-sm text-muted-foreground">
                                    Uploading... {uploadProgress.toFixed(0)}%
                                </p>
                            </div>
                        ) : (
                            <>
                                <Upload className="mx-auto mb-2 size-8 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    Drop files here or click to upload
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    PDF, DOCX, PPTX, MP4, and more
                                </p>
                            </>
                        )}
                        <input
                            id="evidence-file-input"
                            type="file"
                            multiple
                            aria-label="Upload evidence files"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.epub,.txt,.mp4,.webm"
                            onChange={(e) => handleFileUpload(e.target.files)}
                        />
                    </div>
                )}

                {/* Add Link Button */}
                {!isReadOnly && (
                    <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <LinkIcon className="size-4 mr-2" />
                                Add External Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add External Resource</DialogTitle>
                                <DialogDescription>
                                    Add a link to an external resource for your course
                                </DialogDescription>
                            </DialogHeader>
                            <AddLinkForm onSubmit={handleAddLink} onCancel={() => setIsAddingLink(false)} />
                        </DialogContent>
                    </Dialog>
                )}

                {/* Search and Filter */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search materials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="size-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="TEXTBOOK">Textbooks</SelectItem>
                            <SelectItem value="ARTICLE">Articles</SelectItem>
                            <SelectItem value="LECTURE_SLIDES">Slides</SelectItem>
                            <SelectItem value="VIDEO">Videos</SelectItem>
                            <SelectItem value="NOTES">Notes</SelectItem>
                            <SelectItem value="EXTERNAL_LINK">Links</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Items List */}
                <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                        {filteredItems.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <BookOpen className="mx-auto mb-2 size-12 opacity-50" />
                                <p>No materials uploaded yet</p>
                                <p className="text-xs">Upload textbooks, articles, slides, and more</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group flex items-center gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                                    draggable={!isReadOnly}
                                    onDragStart={(e) => handleDragStartItem(e, item)}
                                >
                                    {/* Drag Handle */}
                                    {!isReadOnly && (
                                        <GripVertical className="size-4 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    )}

                                    {/* File Type Icon */}
                                    <div className="shrink-0 rounded-md bg-background p-2">
                                        {fileTypeIcons[item.fileType]}
                                    </div>

                                    {/* Item Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">{item.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{item.fileType.replace('_', ' ')}</span>
                                            {item.fileSize && (
                                                <>
                                                    <span>•</span>
                                                    <span>{formatFileSize(item.fileSize)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Processing Status */}
                                    <div className="flex items-center gap-1">
                                        <Badge
                                            variant="outline"
                                            className={`${statusColors[item.processingStatus]} text-white gap-1`}
                                        >
                                            {statusIcons[item.processingStatus]}
                                            <span className="text-xs">
                                                {item.processingStatus === 'COMPLETED' ? 'Ready' : item.processingStatus}
                                            </span>
                                        </Badge>
                                    </div>

                                    {/* Actions */}
                                    {!isReadOnly && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                                                    <Eye className="size-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {item.fileUrl && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="size-4 mr-2" />
                                                            Download
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                {item.processingStatus === 'FAILED' && (
                                                    <DropdownMenuItem onClick={() => handleReprocess(item.id)}>
                                                        <RefreshCw className="size-4 mr-2" />
                                                        Reprocess
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="size-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                {/* Item Details Dialog */}
                <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedItem?.title}</DialogTitle>
                            <DialogDescription>
                                Material details and AI analysis
                            </DialogDescription>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground">File Type</Label>
                                        <p>{selectedItem.fileType}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Source Type</Label>
                                        <p>{selectedItem.sourceType}</p>
                                    </div>
                                    {selectedItem.pageCount && (
                                        <div>
                                            <Label className="text-muted-foreground">Pages</Label>
                                            <p>{selectedItem.pageCount}</p>
                                        </div>
                                    )}
                                    {selectedItem.isbn && (
                                        <div>
                                            <Label className="text-muted-foreground">ISBN</Label>
                                            <p>{selectedItem.isbn}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedItem.contentSummary && (
                                    <div>
                                        <Label className="text-muted-foreground">AI Summary</Label>
                                        <p className="mt-1 text-sm bg-muted p-3 rounded-md">
                                            {selectedItem.contentSummary}
                                        </p>
                                    </div>
                                )}

                                {selectedItem.topicsIdentified && selectedItem.topicsIdentified.length > 0 && (
                                    <div>
                                        <Label className="text-muted-foreground">Topics Identified</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedItem.topicsIdentified.map((topic, i) => (
                                                <Badge key={i} variant="secondary">{topic}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

// Add Link Form Component
function AddLinkForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (url: string, title: string, sourceType: EvidenceSourceType) => void
    onCancel: () => void
}) {
    const [url, setUrl] = useState("")
    const [title, setTitle] = useState("")
    const [sourceType, setSourceType] = useState<EvidenceSourceType>("WEB_RESOURCE")

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                    id="link-url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="link-title">Title</Label>
                <Input
                    id="link-title"
                    placeholder="Resource title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="source-type">Source Type</Label>
                <Select value={sourceType} onValueChange={(v) => setSourceType(v as EvidenceSourceType)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="WEB_RESOURCE">Web Resource</SelectItem>
                        <SelectItem value="VIDEO_LECTURE">Video Lecture</SelectItem>
                        <SelectItem value="JOURNAL_ARTICLE">Journal Article</SelectItem>
                        <SelectItem value="INSTITUTIONAL_POLICY">Institutional Policy</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSubmit(url, title, sourceType)} disabled={!url || !title}>
                    Add Resource
                </Button>
            </div>
        </div>
    )
}

// Helper functions
function getFileType(mimeType: string, fileName: string): EvidenceFileType {
    if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) return "TEXTBOOK"
    if (mimeType.includes("presentation") || fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) return "LECTURE_SLIDES"
    if (mimeType.includes("video") || fileName.endsWith(".mp4")) return "VIDEO"
    if (mimeType.includes("epub")) return "TEXTBOOK"
    return "OTHER"
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
