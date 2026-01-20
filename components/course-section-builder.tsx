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
            alert("✅ Course sections saved successfully! Syllabus and resources have been updated.")

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

    return (
        <div className="space-y-6">
            {/* Course Duration Setting */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Structure</CardTitle>
                    <CardDescription>
                        Configure your course duration and build sections (no limitations)
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
                                    {Array.from({ length: 20 }, (_, i) => i + 8).map(week => (
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
                {sections.map((section, index) => (
                    <Card key={section.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="size-4 text-muted-foreground" />
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
                                <div className="space-y-3">
                                    <Label>Section Contents</Label>
                                    {section.contents.map(content => (
                                        <Card key={content.id} className="border-dashed">
                                            <CardContent className="space-y-3 pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
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
                                    <h3 className="mb-3 font-semibold text-sm flex items-center">
                                        <Clipboard className="mr-2 size-4" />
                                        Assignments & Quizzes ({existingAssignments.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {existingAssignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                                                onClick={() => {
                                                    importExistingAssignment(selectedSectionForImport, assignment)
                                                    setShowImportDialog(false)
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{assignment.title}</div>
                                                    <div className="text-muted-foreground text-xs">
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
                                    <h3 className="mb-3 font-semibold text-sm flex items-center">
                                        <MessageSquare className="mr-2 size-4" />
                                        Discussion Topics ({existingDiscussions.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {existingDiscussions.map((discussion) => (
                                            <div
                                                key={discussion.id}
                                                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                                                onClick={() => {
                                                    importExistingDiscussion(selectedSectionForImport, discussion)
                                                    setShowImportDialog(false)
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{discussion.title}</div>
                                                    <div className="text-muted-foreground text-xs">
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
                                <p className="text-center text-muted-foreground py-8">
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
