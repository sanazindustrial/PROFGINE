"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Download,
    FileText,
    Monitor,
    Eye,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Share2,
    Edit,
    Trash2,
    FileUp,
    Apple,
    FileDown
} from "lucide-react"

interface PresentationResultsProps {
    presentation: any
    course: any
}

export function PresentationResults({ presentation, course }: PresentationResultsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    const [isDownloading, setIsDownloading] = useState(false)

    const metadata = presentation.metadata ? JSON.parse(presentation.metadata) : {}

    const statusColor: Record<string, string> = {
        COMPLETED: "bg-green-100 text-green-800 border-green-200",
        PROCESSING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        FAILED: "bg-red-100 text-red-800 border-red-200"
    }

    const currentStatusColor = statusColor[presentation.status] || "bg-gray-100 text-gray-800 border-gray-200"

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this presentation?")) return

        setIsDeleting(true)
        setDeleteError("")

        try {
            const response = await fetch(`/api/presentations/${presentation.id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                // Show success message before redirect
                alert("✅ Presentation deleted successfully!")
                setTimeout(() => {
                    window.location.href = `/dashboard/courses/${course.id}/studio`
                }, 500)
            } else {
                setDeleteError("Failed to delete presentation")
            }
        } catch (error) {
            setDeleteError("An error occurred while deleting")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDownload = async (format: string) => {
        setIsDownloading(true)
        try {
            const response = await fetch("/api/presentations/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    presentationId: presentation.id,
                    format
                })
            })

            if (response.ok) {
                const data = await response.json()
                // Open download URL in new tab
                window.open(data.downloadUrl, "_blank")
            } else {
                alert("Failed to generate download")
            }
        } catch (error) {
            alert("An error occurred during download")
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href={`/dashboard/courses/${course.id}/studio`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Studio
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold mt-2">{presentation.title}</h1>
                    <p className="text-gray-600 mt-1">
                        Course: {course.title} {course.code ? `(${course.code})` : ""}
                    </p>
                </div>
                <Badge className={currentStatusColor}>
                    {presentation.status}
                </Badge>
            </div>

            {/* Success Alert */}
            {presentation.status === "COMPLETED" && (
                <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-900 font-medium">
                        🎉 Your presentation has been generated successfully! Download it below in your preferred format or create a new one.
                    </AlertDescription>
                </Alert>
            )}

            {/* Processing Alert */}
            {presentation.status === "PROCESSING" && (
                <Alert className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-sm">
                    <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
                    <AlertDescription className="text-yellow-900 font-medium">
                        ⏳ Your presentation is being generated... This usually takes 2-3 minutes. Refresh the page to check status.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error Alert */}
            {presentation.status === "FAILED" && (
                <Alert variant="destructive">
                    <AlertDescription>
                        Failed to generate presentation. {metadata.error || "Please try again."}
                    </AlertDescription>
                </Alert>
            )}

            {deleteError && (
                <Alert variant="destructive">
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Presentation Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5" />
                                Presentation Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Slide Count</p>
                                    <p className="text-2xl font-bold">{presentation.slideCount || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Duration</p>
                                    <p className="text-2xl font-bold">{presentation.targetDuration || 50} min</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Template</p>
                                    <p className="text-lg capitalize">{presentation.templateStyle?.replace(/-/g, ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Difficulty</p>
                                    <p className="text-lg capitalize">{metadata.difficultyLevel || 'Intermediate'}</p>
                                </div>
                            </div>

                            {presentation.description && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                                    <p className="text-gray-700">{presentation.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Download Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Download Presentation
                            </CardTitle>
                            <CardDescription>
                                Download slides and access lecture notes embedded in speaker notes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Primary Download Options */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Primary Formats</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {presentation.fileUrl && (
                                        <Button
                                            size="lg"
                                            className="w-full"
                                            onClick={() => handleDownload("pptx")}
                                            disabled={isDownloading}
                                        >
                                            <Monitor className="mr-2 h-4 w-4" />
                                            PowerPoint (Windows)
                                        </Button>
                                    )}

                                    {presentation.pdfUrl && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleDownload("pdf")}
                                            disabled={isDownloading}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            PDF
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Additional Format Options */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Additional Formats</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {presentation.fileUrl && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => handleDownload("keynote")}
                                                disabled={isDownloading}
                                            >
                                                <Apple className="mr-2 h-4 w-4" />
                                                Keynote (Mac)
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                                onClick={() => handleDownload("google-slides")}
                                                disabled={isDownloading}
                                            >
                                                <FileDown className="mr-2 h-4 w-4" />
                                                Google Slides (Upload to Drive)
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="outline" className="w-full justify-start" disabled>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Word (.docx) lecture notes (coming soon)
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" disabled>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Google Docs lecture notes (coming soon)
                                    </Button>
                                </div>
                            </div>

                            {presentation.previewUrl && (
                                <>
                                    <div className="pt-2 border-t">
                                        <Button size="lg" variant="secondary" className="w-full" asChild>
                                            <a href={presentation.previewUrl} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4" />
                                                Preview Online
                                            </a>
                                        </Button>
                                    </div>
                                </>
                            )}

                            <div className="pt-3 border-t flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-red-600 hover:text-red-700"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </div>

                            {/* Format Info */}
                            <div className="pt-2 border-t">
                                <p className="text-xs text-gray-600">
                                    <strong>Lecture notes:</strong> Included in slide speaker notes (PPTX, PDF)<br />
                                    <strong>Windows:</strong> Use PowerPoint (Windows) format<br />
                                    <strong>Mac:</strong> Use Keynote or PowerPoint format<br />
                                    <strong>Google Slides:</strong> Download PPTX and upload to Google Drive<br />
                                    <strong>PDF:</strong> For printing or viewing only (not editable)
                                </p>
                            </div>

                            {presentation.previewUrl && (
                                <Button size="lg" variant="secondary" className="w-full" asChild>
                                    <a href={presentation.previewUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview Online
                                    </a>
                                </Button>
                            )}

                            <div className="pt-3 border-t flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-red-600 hover:text-red-700"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Creation Info</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Created</span>
                                    <span className="font-medium">
                                        {new Date(presentation.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Updated</span>
                                    <span className="font-medium">
                                        {new Date(presentation.updatedAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Presentation ID</span>
                                    <span className="font-mono text-xs">{presentation.id}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/dashboard/courses/${course.id}/studio`}>
                                    <Monitor className="mr-2 h-4 w-4" />
                                    Create Another
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/dashboard/courses/${course.id}`}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Course
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/dashboard/courses/${course.id}/build-sections`}>
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Upload to Course
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-base text-blue-900">💡 Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-800 space-y-2">
                            <p>• Review and customize slides before class</p>
                            <p>• Add personal examples and stories</p>
                            <p>• Test animations and transitions</p>
                            <p>• Print lecture notes as reference</p>
                        </CardContent>
                    </Card>

                    {/* Next Steps */}
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                            <CardTitle className="text-base text-green-900">✨ Next Steps</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-green-800 space-y-2">
                            <p>• Add presentation to course sections</p>
                            <p>• Create assignments based on content</p>
                            <p>• Generate discussion questions</p>
                            <p>• Build quizzes for assessment</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    )
}
