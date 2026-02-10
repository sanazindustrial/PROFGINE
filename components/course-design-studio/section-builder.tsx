"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    GripVertical,
    Plus,
    MoreVertical,
    ChevronDown,
    ChevronRight,
    Trash2,
    Edit2,
    Copy,
    FileText,
    Video,
    ListChecks,
    BookOpen,
    Link as LinkIcon,
    MessageSquare,
    Clock,
    Target,
    Star,
    ArrowUp,
    ArrowDown,
    Layout,
    Layers,
} from "lucide-react"
import type {
    CourseDesignSection,
    SectionContent,
    EvidenceKitItem,
    EvidenceFileType,
    SectionContentType
} from "@/types/course-design-studio.types"

interface SectionBuilderProps {
    courseId: string
    sections: CourseDesignSection[]
    onSectionsChange: (sections: CourseDesignSection[]) => void
    evidenceItems?: EvidenceKitItem[]
    isReadOnly?: boolean
    onAIGenerate?: (sectionId: string, type: string) => void
}

// Content type icons and labels
const contentTypeConfig: Record<SectionContentType, { icon: React.ReactNode; label: string; color: string }> = {
    LECTURE: { icon: <FileText className="size-4" />, label: "Lecture", color: "bg-blue-500" },
    VIDEO: { icon: <Video className="size-4" />, label: "Video", color: "bg-purple-500" },
    READING: { icon: <BookOpen className="size-4" />, label: "Reading", color: "bg-yellow-500" },
    ASSIGNMENT: { icon: <ListChecks className="size-4" />, label: "Assignment", color: "bg-green-500" },
    QUIZ: { icon: <Target className="size-4" />, label: "Quiz", color: "bg-red-500" },
    DISCUSSION: { icon: <MessageSquare className="size-4" />, label: "Discussion", color: "bg-pink-500" },
    EXTERNAL_LINK: { icon: <LinkIcon className="size-4" />, label: "External Link", color: "bg-orange-500" },
    RESOURCE: { icon: <FileText className="size-4" />, label: "Resource", color: "bg-gray-500" },
    PROJECT: { icon: <Layout className="size-4" />, label: "Project", color: "bg-emerald-500" },
}

export function SectionBuilder({
    courseId,
    sections,
    onSectionsChange,
    evidenceItems = [],
    isReadOnly = false,
    onAIGenerate,
}: SectionBuilderProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [draggedSection, setDraggedSection] = useState<string | null>(null)
    const [draggedContent, setDraggedContent] = useState<{ sectionId: string; contentId: string } | null>(null)
    const [dragOverSection, setDragOverSection] = useState<string | null>(null)
    const [dragOverContent, setDragOverContent] = useState<string | null>(null)
    const [isAddingSectionDialog, setIsAddingSectionDialog] = useState(false)
    const [editingSection, setEditingSection] = useState<CourseDesignSection | null>(null)
    const [editingContent, setEditingContent] = useState<{ section: CourseDesignSection; content: SectionContent } | null>(null)

    // Toggle section expansion
    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(sectionId)) {
                next.delete(sectionId)
            } else {
                next.add(sectionId)
            }
            return next
        })
    }

    // Add new section
    const addSection = async (title: string, type: string, description?: string) => {
        try {
            const response = await fetch("/api/course-design-studio", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update-section",
                    courseId,
                    section: {
                        title,
                        sectionType: type,
                        description,
                        orderIndex: sections.length,
                        weekNumber: sections.length + 1,
                    },
                }),
            })

            if (response.ok) {
                const { data } = await response.json()
                onSectionsChange([...sections, data])
                setExpandedSections(prev => new Set(prev).add(data.id))
            }
        } catch (error) {
            console.error("Add section error:", error)
        }
        setIsAddingSectionDialog(false)
    }

    // Update section
    const updateSection = async (sectionId: string, updates: Partial<CourseDesignSection>) => {
        try {
            const response = await fetch("/api/course-design-studio", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update-section",
                    courseId,
                    section: { id: sectionId, ...updates },
                }),
            })

            if (response.ok) {
                onSectionsChange(
                    sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
                )
            }
        } catch (error) {
            console.error("Update section error:", error)
        }
        setEditingSection(null)
    }

    // Delete section
    const deleteSection = async (sectionId: string) => {
        try {
            const response = await fetch(
                `/api/course-design-studio?courseId=${courseId}&action=section&id=${sectionId}`,
                { method: "DELETE" }
            )

            if (response.ok) {
                onSectionsChange(sections.filter(s => s.id !== sectionId))
            }
        } catch (error) {
            console.error("Delete section error:", error)
        }
    }

    // Add content to section
    const addContent = async (sectionId: string, content: Partial<SectionContent>) => {
        const section = sections.find(s => s.id === sectionId)
        if (!section) return

        try {
            const response = await fetch("/api/course-design-studio", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update-content",
                    courseId,
                    sectionId,
                    content: {
                        ...content,
                        orderIndex: section.contents?.length || 0,
                    },
                }),
            })

            if (response.ok) {
                const { data } = await response.json()
                onSectionsChange(
                    sections.map(s =>
                        s.id === sectionId
                            ? { ...s, contents: [...(s.contents || []), data] }
                            : s
                    )
                )
            }
        } catch (error) {
            console.error("Add content error:", error)
        }
    }

    // Delete content
    const deleteContent = async (sectionId: string, contentId: string) => {
        try {
            const response = await fetch(
                `/api/course-design-studio?courseId=${courseId}&action=content&id=${contentId}`,
                { method: "DELETE" }
            )

            if (response.ok) {
                onSectionsChange(
                    sections.map(s =>
                        s.id === sectionId
                            ? { ...s, contents: s.contents?.filter(c => c.id !== contentId) }
                            : s
                    )
                )
            }
        } catch (error) {
            console.error("Delete content error:", error)
        }
    }

    // Section drag handlers
    const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
        setDraggedSection(sectionId)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", sectionId)
    }

    const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault()
        if (draggedSection && draggedSection !== sectionId) {
            setDragOverSection(sectionId)
        }
    }

    const handleSectionDrop = async (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault()

        if (draggedSection && draggedSection !== targetSectionId) {
            const dragIndex = sections.findIndex(s => s.id === draggedSection)
            const targetIndex = sections.findIndex(s => s.id === targetSectionId)

            const newSections = [...sections]
            const [removed] = newSections.splice(dragIndex, 1)
            newSections.splice(targetIndex, 0, removed)

            // Update order values
            const reorderedSections = newSections.map((s, i) => ({ ...s, orderIndex: i }))
            onSectionsChange(reorderedSections)

            // Save to API
            await fetch("/api/course-design-studio", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reorder-sections",
                    courseId,
                    sections: reorderedSections.map(s => ({
                        id: s.id,
                        orderIndex: s.orderIndex,
                        parentSectionId: s.parentSectionId || null,
                    })),
                }),
            })
        }

        setDraggedSection(null)
        setDragOverSection(null)
    }

    // Content drag handlers
    const handleContentDragStart = (e: React.DragEvent, sectionId: string, contentId: string) => {
        e.stopPropagation()
        setDraggedContent({ sectionId, contentId })
        e.dataTransfer.effectAllowed = "move"
    }

    const handleContentDragOver = (e: React.DragEvent, contentId: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (draggedContent && draggedContent.contentId !== contentId) {
            setDragOverContent(contentId)
        }
    }

    const handleContentDrop = async (e: React.DragEvent, targetSectionId: string, targetContentId?: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (!draggedContent) return

        const sourceSection = sections.find(s => s.id === draggedContent.sectionId)
        const targetSection = sections.find(s => s.id === targetSectionId)
        if (!sourceSection || !targetSection) return

        const content = sourceSection.contents?.find(c => c.id === draggedContent.contentId)
        if (!content) return

        // Moving within same section
        if (draggedContent.sectionId === targetSectionId && targetContentId) {
            const newContents = [...(targetSection.contents || [])]
            const dragIndex = newContents.findIndex(c => c.id === draggedContent.contentId)
            const targetIndex = newContents.findIndex(c => c.id === targetContentId)

            const [removed] = newContents.splice(dragIndex, 1)
            newContents.splice(targetIndex, 0, removed)

            const reorderedContents = newContents.map((c, i) => ({ ...c, orderIndex: i }))

            onSectionsChange(
                sections.map(s =>
                    s.id === targetSectionId
                        ? { ...s, contents: reorderedContents }
                        : s
                )
            )

            await fetch("/api/course-design-studio", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reorder-content",
                    courseId,
                    contents: reorderedContents.map(c => ({
                        id: c.id,
                        orderIndex: c.orderIndex,
                        sectionId: targetSectionId,
                    })),
                }),
            })
        } else {
            // Moving to different section
            const newSourceContents = sourceSection.contents?.filter(c => c.id !== draggedContent.contentId) || []
            const newTargetContents = [...(targetSection.contents || []), { ...content, sectionId: targetSectionId }]

            onSectionsChange(
                sections.map(s => {
                    if (s.id === draggedContent.sectionId) {
                        return { ...s, contents: newSourceContents }
                    }
                    if (s.id === targetSectionId) {
                        return { ...s, contents: newTargetContents }
                    }
                    return s
                })
            )
        }

        setDraggedContent(null)
        setDragOverContent(null)
    }

    // Handle drop from Evidence Kit
    const handleEvidenceDrop = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault()

        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"))
            if (data.type === "evidence") {
                const evidence = evidenceItems.find(item => item.id === data.id)
                if (evidence) {
                    addContent(sectionId, {
                        title: evidence.title,
                        contentType: mapEvidenceToContentType(evidence.fileType),
                        content: evidence.contentSummary || "",
                        evidenceItemId: evidence.id,
                    })
                }
            }
        } catch {
            // Not JSON data, ignore
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Layout className="size-5" />
                            Course Structure
                        </CardTitle>
                        <CardDescription>
                            Drag and drop to organize sections and content
                        </CardDescription>
                    </div>
                    {!isReadOnly && (
                        <Dialog open={isAddingSectionDialog} onOpenChange={setIsAddingSectionDialog}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="size-4 mr-2" />
                                    Add Section
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <AddSectionForm onSubmit={addSection} onCancel={() => setIsAddingSectionDialog(false)} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                        {sections.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Layers className="size-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">No sections yet</p>
                                <p className="text-sm mt-1">Add sections to structure your course</p>
                                {!isReadOnly && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => setIsAddingSectionDialog(true)}
                                    >
                                        <Plus className="size-4 mr-2" />
                                        Add First Section
                                    </Button>
                                )}
                            </div>
                        ) : (
                            sections
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((section, index) => (
                                    <div
                                        key={section.id}
                                        draggable={!isReadOnly}
                                        onDragStart={(e) => handleSectionDragStart(e, section.id)}
                                        onDragOver={(e) => handleSectionDragOver(e, section.id)}
                                        onDragLeave={() => setDragOverSection(null)}
                                        onDrop={(e) => handleSectionDrop(e, section.id)}
                                        className={`
                      rounded-lg border transition-all
                      ${draggedSection === section.id ? 'opacity-50' : ''}
                      ${dragOverSection === section.id ? 'border-primary border-2 bg-primary/5' : ''}
                    `}
                                    >
                                        <Collapsible
                                            open={expandedSections.has(section.id)}
                                            onOpenChange={() => toggleSection(section.id)}
                                        >
                                            <div className="flex items-center gap-2 p-3 bg-muted/30">
                                                {!isReadOnly && (
                                                    <GripVertical className="size-4 text-muted-foreground cursor-grab" />
                                                )}

                                                <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left">
                                                    {expandedSections.has(section.id) ? (
                                                        <ChevronDown className="size-4" />
                                                    ) : (
                                                        <ChevronRight className="size-4" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium truncate">{section.title}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {section.sectionType}
                                                            </Badge>
                                                        </div>
                                                        {section.weekNumber && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Week {section.weekNumber}
                                                                {section.durationMinutes && ` • ${section.durationMinutes} min`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </CollapsibleTrigger>

                                                <Badge variant="secondary" className="text-xs">
                                                    {section.contents?.length || 0} items
                                                </Badge>

                                                {!isReadOnly && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8">
                                                                <MoreVertical className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setEditingSection(section)}>
                                                                <Edit2 className="size-4 mr-2" />
                                                                Edit Section
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onAIGenerate?.(section.id, "content")}>
                                                                <Star className="size-4 mr-2" />
                                                                AI Generate Content
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => deleteSection(section.id)}
                                                            >
                                                                <Trash2 className="size-4 mr-2" />
                                                                Delete Section
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>

                                            <CollapsibleContent>
                                                <div
                                                    className="p-3 space-y-2 min-h-[100px] border-t"
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        handleEvidenceDrop(e, section.id)
                                                        handleContentDrop(e, section.id)
                                                    }}
                                                >
                                                    {(!section.contents || section.contents.length === 0) ? (
                                                        <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                                            Drag content here or add new
                                                        </div>
                                                    ) : (
                                                        section.contents
                                                            .sort((a, b) => a.orderIndex - b.orderIndex)
                                                            .map((content) => (
                                                                <div
                                                                    key={content.id}
                                                                    draggable={!isReadOnly}
                                                                    onDragStart={(e) => handleContentDragStart(e, section.id, content.id)}
                                                                    onDragOver={(e) => handleContentDragOver(e, content.id)}
                                                                    onDragLeave={() => setDragOverContent(null)}
                                                                    onDrop={(e) => handleContentDrop(e, section.id, content.id)}
                                                                    className={`
                                    flex items-center gap-3 p-2 rounded-md bg-background border
                                    hover:bg-muted/50 transition-colors group
                                    ${draggedContent?.contentId === content.id ? 'opacity-50' : ''}
                                    ${dragOverContent === content.id ? 'border-primary border-2' : ''}
                                  `}
                                                                >
                                                                    {!isReadOnly && (
                                                                        <GripVertical className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                                                                    )}

                                                                    <div className={`p-1.5 rounded ${contentTypeConfig[content.contentType]?.color || 'bg-gray-500'} text-white`}>
                                                                        {contentTypeConfig[content.contentType]?.icon || <FileText className="size-3" />}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium truncate">{content.title}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {contentTypeConfig[content.contentType]?.label || content.contentType}
                                                                            {content.points !== undefined && ` • ${content.points} pts`}
                                                                        </p>
                                                                    </div>

                                                                    {content.isAIGenerated && (
                                                                        <Badge variant="outline" className="text-xs gap-1">
                                                                            <Star className="size-2" />
                                                                            AI
                                                                        </Badge>
                                                                    )}

                                                                    {!isReadOnly && (
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100">
                                                                                    <MoreVertical className="size-3" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem onClick={() => setEditingContent({ section, content })}>
                                                                                    <Edit2 className="size-4 mr-2" />
                                                                                    Edit
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    className="text-destructive"
                                                                                    onClick={() => deleteContent(section.id, content.id)}
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

                                                    {/* Add Content Button */}
                                                    {!isReadOnly && (
                                                        <AddContentDropdown
                                                            onAdd={(type) => addContent(section.id, {
                                                                title: `New ${contentTypeConfig[type]?.label || type}`,
                                                                contentType: type,
                                                            })}
                                                        />
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                ))
                        )}
                    </div>
                </ScrollArea>

                {/* Edit Section Dialog */}
                <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
                    <DialogContent>
                        {editingSection && (
                            <EditSectionForm
                                section={editingSection}
                                onSubmit={(updates) => updateSection(editingSection.id, updates)}
                                onCancel={() => setEditingSection(null)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

// Add Section Form
function AddSectionForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (title: string, type: string, description?: string) => void
    onCancel: () => void
}) {
    const [title, setTitle] = useState("")
    const [type, setType] = useState("MODULE")
    const [description, setDescription] = useState("")

    return (
        <>
            <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
                <DialogDescription>
                    Create a new section to organize your course content
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="section-title">Title</Label>
                    <Input
                        id="section-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Introduction to Programming"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="section-type">Section Type</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MODULE">Module</SelectItem>
                            <SelectItem value="UNIT">Unit</SelectItem>
                            <SelectItem value="WEEK">Week</SelectItem>
                            <SelectItem value="TOPIC">Topic</SelectItem>
                            <SelectItem value="CHAPTER">Chapter</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="section-description">Description (optional)</Label>
                    <Textarea
                        id="section-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of what this section covers"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSubmit(title, type, description)} disabled={!title}>
                    Add Section
                </Button>
            </DialogFooter>
        </>
    )
}

// Edit Section Form
function EditSectionForm({
    section,
    onSubmit,
    onCancel,
}: {
    section: CourseDesignSection
    onSubmit: (updates: Partial<CourseDesignSection>) => void
    onCancel: () => void
}) {
    const [title, setTitle] = useState(section.title)
    const [description, setDescription] = useState(section.description || "")
    const [weekNumber, setWeekNumber] = useState(section.weekNumber?.toString() || "")
    const [durationMinutes, setDurationMinutes] = useState(section.durationMinutes?.toString() || "")

    return (
        <>
            <DialogHeader>
                <DialogTitle>Edit Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                        id="edit-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                        id="edit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-week">Week Number</Label>
                        <Input
                            id="edit-week"
                            type="number"
                            value={weekNumber}
                            onChange={(e) => setWeekNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-duration">Duration (minutes)</Label>
                        <Input
                            id="edit-duration"
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSubmit({
                    title,
                    description: description || undefined,
                    weekNumber: weekNumber ? parseInt(weekNumber) : undefined,
                    durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
                })}>
                    Save Changes
                </Button>
            </DialogFooter>
        </>
    )
}

// Add Content Dropdown
function AddContentDropdown({ onAdd }: { onAdd: (type: SectionContentType) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full border-dashed border">
                    <Plus className="size-4 mr-2" />
                    Add Content
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {(Object.entries(contentTypeConfig) as [SectionContentType, { icon: React.ReactNode; label: string; color: string }][]).map(([type, config]) => (
                    <DropdownMenuItem key={type} onClick={() => onAdd(type)}>
                        {config.icon}
                        <span className="ml-2">{config.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Helper to map evidence type to content type
function mapEvidenceToContentType(evidenceType: EvidenceFileType): SectionContentType {
    const mapping: Record<EvidenceFileType, SectionContentType> = {
        TEXTBOOK: "READING",
        ARTICLE: "READING",
        LECTURE_SLIDES: "RESOURCE",
        VIDEO: "VIDEO",
        NOTES: "LECTURE",
        SYLLABUS: "RESOURCE",
        RUBRIC: "ASSIGNMENT",
        EXTERNAL_LINK: "EXTERNAL_LINK",
        OTHER: "RESOURCE",
    }
    return mapping[evidenceType]
}
