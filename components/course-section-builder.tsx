"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Trash2,
    FileUp,
    Link2,
    FileText,
    Clipboard,
    Video,
    MessageSquare,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Calendar,
    Download,
    Save,
    Loader2
} from "lucide-react"

interface ExistingAssignment {
    id: string
    title: string
    type: string
    points: number
    dueAt: Date | null
}

interface ExistingDiscussion {
    id: string
    title: string
}

interface ModuleContent {
    id: string
    type: "FILE" | "ASSIGNMENT" | "LINK" | "PAGE" | "VIDEO" | "QUIZ" | "DISCUSSION"
    title: string
    description?: string
    content?: string
    fileUrl?: string
    linkUrl?: string
    assignmentId?: string  // Link to existing assignment
    points?: number
    dueDate?: string
    isRequired: boolean
}

interface CourseSection {
    id: string
    title: string
    description?: string
    weekNo?: number
    sectionNo: number
    contents: ModuleContent[]
    isExpanded: boolean
}

interface CourseSectionBuilderProps {
    courseId?: string
    durationWeeks?: number
    existingAssignments?: ExistingAssignment[]
    existingDiscussions?: ExistingDiscussion[]
    onSave?: (sections: CourseSection[]) => void
}

export function CourseSectionBuilder({
    courseId,
    durationWeeks = 16,
    existingAssignments = [],
    existingDiscussions = [],
    onSave
}: CourseSectionBuilderProps) {
    const [sections, setSections] = useState<CourseSection[]>([
        {
            id: "1",
            title: "Week 1: Introduction",
            sectionNo: 1,
            weekNo: 1,
            contents: [],
            isExpanded: true
        }
    ])

    const [selectedWeeks, setSelectedWeeks] = useState(durationWeeks)
    const [isSaving, setIsSaving] = useState(false)
    const [showImportDialog, setShowImportDialog] = useState(false)
    const [selectedSectionForImport, setSelectedSectionForImport] = useState<string | null>(null)
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null)
    const [draggedContentInfo, setDraggedContentInfo] = useState<{ sectionId: string, contentId: string } | null>(null)

    const addSection = () => {
        const newSection: CourseSection = {
            id: Date.now().toString(),
            title: `Week ${sections.length + 1}`,
            sectionNo: sections.length + 1,
            weekNo: sections.length + 1,
            contents: [],
            isExpanded: true
        }
        setSections([...sections, newSection])
    }

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id))
    }

    const updateSection = (id: string, updates: Partial<CourseSection>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const toggleSection = (id: string) => {
        setSections(sections.map(s =>
            s.id === id ? { ...s, isExpanded: !s.isExpanded } : s
        ))
    }

    const addContent = (sectionId: string, type: ModuleContent["type"]) => {
        const newContent: ModuleContent = {
            id: Date.now().toString(),
            type,
            title: `New ${type.toLowerCase()}`,
            isRequired: true
        }

        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, contents: [...s.contents, newContent] }
                : s
        ))
    }

    const importExistingAssignment = (sectionId: string, assignment: ExistingAssignment) => {
        const newContent: ModuleContent = {
            id: Date.now().toString(),
            type: "ASSIGNMENT",
            title: assignment.title,
            assignmentId: assignment.id,
            points: assignment.points,
            dueDate: assignment.dueAt ? new Date(assignment.dueAt).toISOString().split('T')[0] : undefined,
            isRequired: true
        }

        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, contents: [...s.contents, newContent] }
                : s
        ))
        setShowImportDialog(false)
        setSelectedSectionForImport(null)
    }

    const importExistingDiscussion = (sectionId: string, discussion: ExistingDiscussion) => {
        const newContent: ModuleContent = {
            id: Date.now().toString(),
            type: "DISCUSSION",
            title: discussion.title,
            isRequired: true
        }

        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, contents: [...s.contents, newContent] }
                : s
        ))
        setShowImportDialog(false)
        setSelectedSectionForImport(null)
    }

    const updateContent = (sectionId: string, contentId: string, updates: Partial<ModuleContent>) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? {
                    ...s,
                    contents: s.contents.map(c =>
                        c.id === contentId ? { ...c, ...updates } : c
                    )
                }
                : s
        ))
    }

    const removeContent = (sectionId: string, contentId: string) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, contents: s.contents.filter(c => c.id !== contentId) }
                : s
        ))
    }

    const getContentIcon = (type: ModuleContent["type"]) => {
        switch (type) {
            case "FILE": return <FileUp className="size-4" />
            case "ASSIGNMENT": return <Clipboard className="size-4" />
            case "LINK": return <Link2 className="size-4" />
            case "PAGE": return <FileText className="size-4" />
            case "VIDEO": return <Video className="size-4" />
            case "QUIZ": return <Clipboard className="size-4" />
            case "DISCUSSION": return <MessageSquare className="size-4" />
        }
    }

    const handleSave = async () => {
        if (!courseId) {
            if (onSave) {
                onSave(sections)
            }
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch(`/api/courses/${courseId}/sections`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sections,
                    durationWeeks: selectedWeeks
                })
            })

            if (!response.ok) {
                throw new Error("Failed to save sections")
            }

            const result = await response.json()

            // Show detailed success message
            alert(`✅ Course Structure Saved Successfully!\n\n• ${sections.length} section(s) saved\n• Syllabus updated\n• All content organized\n\nYour course is now ready for students!`)

            if (onSave) {
                onSave(sections)
            }
        } catch (error) {
            console.error("Error saving sections:", error)
            alert("❌ Failed to save sections. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    // Drag and Drop handlers for sections
    const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
        setDraggedSectionId(sectionId)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleSectionDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault()
        if (!draggedSectionId || draggedSectionId === targetSectionId) return

        const draggedIndex = sections.findIndex(s => s.id === draggedSectionId)
        const targetIndex = sections.findIndex(s => s.id === targetSectionId)

        if (draggedIndex === -1 || targetIndex === -1) return

        const newSections = [...sections]
        const [draggedSection] = newSections.splice(draggedIndex, 1)
        newSections.splice(targetIndex, 0, draggedSection)

        // Update section numbers
        newSections.forEach((section, index) => {
            section.sectionNo = index + 1
            if (section.weekNo) {
                section.weekNo = index + 1
            }
        })

        setSections(newSections)
        setDraggedSectionId(null)
    }

    // Drag and Drop handlers for content items
    const handleContentDragStart = (e: React.DragEvent, sectionId: string, contentId: string) => {
        setDraggedContentInfo({ sectionId, contentId })
        e.dataTransfer.effectAllowed = "move"
    }

    const handleContentDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleContentDrop = (e: React.DragEvent, targetSectionId: string, targetContentId?: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (!draggedContentInfo) return

        const { sectionId: sourceSectionId, contentId: sourceContentId } = draggedContentInfo

        setSections(prevSections => {
            const newSections = [...prevSections]
            const sourceSection = newSections.find(s => s.id === sourceSectionId)
            const targetSection = newSections.find(s => s.id === targetSectionId)

            if (!sourceSection || !targetSection) return prevSections

            const contentIndex = sourceSection.contents.findIndex(c => c.id === sourceContentId)
            if (contentIndex === -1) return prevSections

            const [draggedContent] = sourceSection.contents.splice(contentIndex, 1)

            if (targetContentId) {
                const targetIndex = targetSection.contents.findIndex(c => c.id === targetContentId)
                targetSection.contents.splice(targetIndex, 0, draggedContent)
            } else {
                targetSection.contents.push(draggedContent)
            }

            return newSections
        })

        setDraggedContentInfo(null)
    }

    return (
        <div className="space-y-6">
            {/* Course Duration Setting */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Structure</CardTitle>
                    <CardDescription>
                        Configure your course duration and build sections (any number of weeks)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="weeks">Course Duration (Weeks)</Label>
                            <Select value={selectedWeeks.toString()} onValueChange={(v) => setSelectedWeeks(parseInt(v))}>
                                <SelectTrigger id="weeks">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                                        <SelectItem key={week} value={week.toString()}>
                                            {week} weeks {week === 8 && "(1 Quarter)"} {week === 16 && "(1 Semester)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2 pt-7">
                            <Badge variant="secondary">
                                {sections.length} Section{sections.length !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="outline">
                                {sections.reduce((sum, s) => sum + s.contents.length, 0)} Items
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-4">
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 text-sm text-blue-900 shadow-sm">
                    <GripVertical className="size-5 text-blue-600" />
                    <span>💡 <strong>Drag & Drop:</strong> Grab the <GripVertical className="inline size-4" /> icon to reorder sections and content items. Build your course exactly how you want!</span>
                </div>
                {sections.map((section, index) => (
                    <Card
                        key={section.id}
                        className={`border-l-4 border-l-blue-500 transition-all ${draggedSectionId === section.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleSectionDragStart(e, section.id)}
                        onDragOver={handleSectionDragOver}
                        onDrop={(e) => handleSectionDrop(e, section.id)}
                    >
                        <CardHeader className="cursor-move" onClick={() => toggleSection(section.id)}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="size-5 cursor-grab text-blue-600" />
                                        {section.isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                        <Badge variant="outline">Section {section.sectionNo}</Badge>
                                    </div>
                                    <Input
                                        value={section.title}
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-lg font-semibold"
                                        placeholder="Section title..."
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeSection(section.id)
                                    }}
                                >
                                    <Trash2 className="size-4 text-destructive" />
                                </Button>
                            </div>
                        </CardHeader>

                        {section.isExpanded && (
                            <CardContent className="space-y-4">
                                {/* Section Description */}
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={section.description || ""}
                                        onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                        placeholder="Describe what students will learn in this section..."
                                        rows={2}
                                    />
                                </div>

                                {/* Week Number */}
                                <div className="space-y-2">
                                    <Label>Week Number (Optional)</Label>
                                    <Input
                                        type="number"
                                        value={section.weekNo || ""}
                                        onChange={(e) => updateSection(section.id, { weekNo: parseInt(e.target.value) || undefined })}
                                        placeholder="Leave empty for custom sections..."
                                        min="1"
                                        max={selectedWeeks}
                                    />
                                </div>

                                {/* Contents */}
                                <div
                                    className="space-y-3"
                                    onDragOver={handleContentDragOver}
                                    onDrop={(e) => handleContentDrop(e, section.id)}
                                >
                                    <Label>Section Contents</Label>
                                    {section.contents.map(content => (
                                        <Card
                                            key={content.id}
                                            className={`border-dashed transition-all ${draggedContentInfo?.contentId === content.id ? 'opacity-50' : ''}`}
                                            draggable
                                            onDragStart={(e) => handleContentDragStart(e, section.id, content.id)}
                                            onDragOver={handleContentDragOver}
                                            onDrop={(e) => handleContentDrop(e, section.id, content.id)}
                                        >
                                            <CardContent className="space-y-3 pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="size-4 cursor-grab text-gray-400" />
                                                        {getContentIcon(content.type)}
                                                        <Badge variant="secondary">{content.type}</Badge>
                                                        {content.isRequired && <Badge variant="outline">Required</Badge>}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeContent(section.id, content.id)}
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>

                                                <Input
                                                    value={content.title}
                                                    onChange={(e) => updateContent(section.id, content.id, { title: e.target.value })}
                                                    placeholder="Content title..."
                                                />

                                                <Textarea
                                                    value={content.description || ""}
                                                    onChange={(e) => updateContent(section.id, content.id, { description: e.target.value })}
                                                    placeholder="Description or instructions..."
                                                    rows={2}
                                                />

                                                {(content.type === "FILE" || content.type === "VIDEO") && (
                                                    <Input
                                                        value={content.fileUrl || ""}
                                                        onChange={(e) => updateContent(section.id, content.id, { fileUrl: e.target.value })}
                                                        placeholder="File URL or upload path..."
                                                    />
                                                )}

                                                {content.type === "LINK" && (
                                                    <Input
                                                        value={content.linkUrl || ""}
                                                        onChange={(e) => updateContent(section.id, content.id, { linkUrl: e.target.value })}
                                                        placeholder="External link URL..."
                                                    />
                                                )}

                                                {content.type === "PAGE" && (
                                                    <Textarea
                                                        value={content.content || ""}
                                                        onChange={(e) => updateContent(section.id, content.id, { content: e.target.value })}
                                                        placeholder="Page content (supports HTML)..."
                                                        rows={4}
                                                    />
                                                )}

                                                {(content.type === "ASSIGNMENT" || content.type === "QUIZ") && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label>Points</Label>
                                                            <Input
                                                                type="number"
                                                                value={content.points || ""}
                                                                onChange={(e) => updateContent(section.id, content.id, { points: parseInt(e.target.value) || undefined })}
                                                                placeholder="100"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Due Date</Label>
                                                            <Input
                                                                type="date"
                                                                value={content.dueDate || ""}
                                                                onChange={(e) => updateContent(section.id, content.id, { dueDate: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {/* Add Content Buttons */}
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "FILE")}>
                                                <FileUp className="mr-2 size-3" /> File
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "ASSIGNMENT")}>
                                                <Clipboard className="mr-2 size-3" /> Assignment
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "LINK")}>
                                                <Link2 className="mr-2 size-3" /> Link
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "PAGE")}>
                                                <FileText className="mr-2 size-3" /> Page
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "VIDEO")}>
                                                <Video className="mr-2 size-3" /> Video
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "QUIZ")}>
                                                <Clipboard className="mr-2 size-3" /> Quiz
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => addContent(section.id, "DISCUSSION")}>
                                                <MessageSquare className="mr-2 size-3" /> Discussion
                                            </Button>
                                        </div>

                                        {/* Import from Course */}
                                        {(existingAssignments.length > 0 || existingDiscussions.length > 0) && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => {
                                                    setSelectedSectionForImport(section.id)
                                                    setShowImportDialog(true)
                                                }}
                                            >
                                                <Download className="mr-2 size-3" />
                                                Import from Course ({existingAssignments.length + existingDiscussions.length} items)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}

                {/* Add Section Button */}
                <Button
                    variant="outline"
                    className="w-full border-2 border-dashed"
                    onClick={addSection}
                >
                    <Plus className="mr-2 size-4" />
                    Add Another Section (No Limit)
                </Button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button variant="outline">Preview</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 size-4" />
                            Save Course Structure
                        </>
                    )}
                </Button>
            </div>

            {/* Import Dialog */}
            {showImportDialog && selectedSectionForImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowImportDialog(false)}>
                    <Card className="max-h-[80vh] w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Import AI-Designed Content</span>
                                <Button variant="ghost" size="sm" onClick={() => setShowImportDialog(false)}>
                                    ✕
                                </Button>
                            </CardTitle>
                            <CardDescription>
                                Select assignments, quizzes, or discussions designed with AI to add to this section
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[60vh] overflow-y-auto">
                            {/* Assignments Section */}
                            {existingAssignments.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="mb-3 flex items-center text-sm font-semibold">
                                        <Clipboard className="mr-2 size-4" />
                                        Assignments & Quizzes ({existingAssignments.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {existingAssignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent"
                                                onClick={() => {
                                                    importExistingAssignment(selectedSectionForImport, assignment)
                                                    setShowImportDialog(false)
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{assignment.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {assignment.type} • {assignment.points} points
                                                        {assignment.dueAt && ` • Due: ${new Date(assignment.dueAt).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                                <Download className="size-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Discussions Section */}
                            {existingDiscussions.length > 0 && (
                                <div>
                                    <h3 className="mb-3 flex items-center text-sm font-semibold">
                                        <MessageSquare className="mr-2 size-4" />
                                        Discussion Topics ({existingDiscussions.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {existingDiscussions.map((discussion) => (
                                            <div
                                                key={discussion.id}
                                                className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent"
                                                onClick={() => {
                                                    importExistingDiscussion(selectedSectionForImport, discussion)
                                                    setShowImportDialog(false)
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{discussion.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Click to add to section
                                                    </div>
                                                </div>
                                                <Download className="size-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {existingAssignments.length === 0 && existingDiscussions.length === 0 && (
                                <p className="py-8 text-center text-muted-foreground">
                                    No AI-designed content available yet. Create assignments or discussions using the Course Design Studio first.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
