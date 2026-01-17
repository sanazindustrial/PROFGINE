"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Download, Users, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BulkEnrollmentProps {
    courseId: string
    courseName: string
}

export default function BulkEnrollmentManager({ courseId, courseName }: BulkEnrollmentProps) {
    const [csvData, setCsvData] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [results, setResults] = useState<any>(null)
    const [enrollmentTemplate, setEnrollmentTemplate] = useState<any>(null)

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type === "text/csv") {
            const reader = new FileReader()
            reader.onload = (e) => {
                setCsvData(e.target?.result as string)
            }
            reader.readAsText(file)
        }
    }

    const handleBulkEnrollment = async () => {
        if (!csvData.trim()) {
            alert("Please upload a CSV file or paste CSV data")
            return
        }

        setIsProcessing(true)
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll-bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    csvData,
                    notifyStudents: true
                })
            })

            if (response.ok) {
                const data = await response.json()
                setResults(data)
                setCsvData("")
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert("Failed to process bulk enrollment")
        } finally {
            setIsProcessing(false)
        }
    }

    const downloadTemplate = () => {
        const csvTemplate = `name,email,studentId,section
John Doe,john.doe@university.edu,12345,Section A
Jane Smith,jane.smith@university.edu,12346,Section B`

        const blob = new Blob([csvTemplate], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${courseName}_enrollment_template.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Enrollment</h2>
                <p className="text-gray-600">Course: {courseName}</p>
            </div>

            <Tabs defaultValue="bulk" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                    <TabsTrigger value="individual">Individual Add</TabsTrigger>
                    <TabsTrigger value="lms">LMS Import</TabsTrigger>
                </TabsList>

                <TabsContent value="bulk" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="size-5" />
                                Bulk Student Enrollment
                            </CardTitle>
                            <CardDescription>
                                Upload a CSV file to enroll multiple students at once
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={downloadTemplate}>
                                    <Download className="mr-2 size-4" />
                                    Download CSV Template
                                </Button>
                                <span className="text-sm text-gray-500">
                                    Required columns: name, email, studentId (optional), section (optional)
                                </span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="csv-upload">Upload CSV File</Label>
                                <Input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="csv-data">Or Paste CSV Data</Label>
                                <Textarea
                                    id="csv-data"
                                    value={csvData}
                                    onChange={(e) => setCsvData(e.target.value)}
                                    placeholder="name,email,studentId,section&#10;John Doe,john.doe@university.edu,12345,Section A&#10;Jane Smith,jane.smith@university.edu,12346,Section B"
                                    rows={8}
                                />
                            </div>

                            <Button
                                onClick={handleBulkEnrollment}
                                disabled={isProcessing || !csvData.trim()}
                                className="w-full"
                            >
                                {isProcessing ? "Processing..." : "Enroll Students"}
                            </Button>
                        </CardContent>
                    </Card>

                    {results && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="size-5" />
                                    Enrollment Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 grid grid-cols-3 gap-4">
                                    <div className="rounded-lg bg-green-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                                        <div className="text-sm text-green-700">Successfully Enrolled</div>
                                    </div>
                                    <div className="rounded-lg bg-red-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                                        <div className="text-sm text-red-700">Failed</div>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{results.summary.updated}</div>
                                        <div className="text-sm text-blue-700">Already Enrolled</div>
                                    </div>
                                </div>

                                {results.results.failed.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="flex items-center gap-2 font-semibold text-red-600">
                                            <AlertCircle className="size-4" />
                                            Failed Enrollments
                                        </h4>
                                        {results.results.failed.map((failed: any, index: number) => (
                                            <div key={index} className="rounded border border-red-200 bg-red-50 p-2">
                                                <p className="text-sm"><strong>{failed.name}</strong> ({failed.email})</p>
                                                <p className="text-xs text-red-600">{failed.error}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {results.results.successful.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="flex items-center gap-2 font-semibold text-green-600">
                                            <CheckCircle className="size-4" />
                                            Successful Enrollments
                                        </h4>
                                        <div className="max-h-48 overflow-y-auto">
                                            {results.results.successful.map((success: any, index: number) => (
                                                <div key={index} className="rounded border border-green-200 bg-green-50 p-2">
                                                    <p className="text-sm"><strong>{success.name}</strong> ({success.email})</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="individual" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-5" />
                                Add Individual Student
                            </CardTitle>
                            <CardDescription>
                                Manually add a single student to the course
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IndividualEnrollmentForm courseId={courseId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="lms" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>LMS Integration</CardTitle>
                            <CardDescription>
                                Import students and assignments from your Learning Management System
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LMSIntegrationForm courseId={courseId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function IndividualEnrollmentForm({ courseId }: { courseId: string }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        studentId: "",
        section: ""
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const csvData = `name,email,studentId,section\n${formData.name},${formData.email},${formData.studentId},${formData.section}`

            const response = await fetch(`/api/courses/${courseId}/enroll-bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    csvData,
                    notifyStudents: true
                })
            })

            if (response.ok) {
                alert("Student enrolled successfully!")
                setFormData({ name: "", email: "", studentId: "", section: "" })
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert("Failed to enroll student")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Student Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                />
            </div>

            <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@university.edu"
                    required
                />
            </div>

            <div>
                <Label htmlFor="studentId">Student ID (Optional)</Label>
                <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="12345"
                />
            </div>

            <div>
                <Label htmlFor="section">Section (Optional)</Label>
                <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="Section A"
                />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Enrolling..." : "Enroll Student"}
            </Button>
        </form>
    )
}

function LMSIntegrationForm({ courseId }: { courseId: string }) {
    const [lmsConfig, setLmsConfig] = useState({
        lmsType: "",
        apiKey: "",
        baseUrl: "",
        courseIdentifier: "",
        syncAssignments: true,
        syncGrades: true,
        syncDiscussions: false
    })
    const [isConnecting, setIsConnecting] = useState(false)

    const handleLMSIntegration = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsConnecting(true)

        try {
            const response = await fetch(`/api/courses/${courseId}/lms-integration?courseId=${courseId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(lmsConfig)
            })

            if (response.ok) {
                const data = await response.json()
                alert("LMS integration configured successfully!")
                console.log("Sync results:", data.syncResults)
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert("Failed to configure LMS integration")
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <form onSubmit={handleLMSIntegration} className="space-y-4">
            <div>
                <Label htmlFor="lmsType">LMS Type</Label>
                <Select value={lmsConfig.lmsType} onValueChange={(value) => setLmsConfig({ ...lmsConfig, lmsType: value })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select your LMS" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CANVAS">Canvas</SelectItem>
                        <SelectItem value="BLACKBOARD">Blackboard</SelectItem>
                        <SelectItem value="MOODLE">Moodle</SelectItem>
                        <SelectItem value="SCHOOLOGY">Schoology</SelectItem>
                        <SelectItem value="BRIGHTSPACE">Brightspace</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="baseUrl">LMS Base URL</Label>
                <Input
                    id="baseUrl"
                    value={lmsConfig.baseUrl}
                    onChange={(e) => setLmsConfig({ ...lmsConfig, baseUrl: e.target.value })}
                    placeholder="https://your-institution.instructure.com"
                    required
                />
            </div>

            <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                    id="apiKey"
                    type="password"
                    value={lmsConfig.apiKey}
                    onChange={(e) => setLmsConfig({ ...lmsConfig, apiKey: e.target.value })}
                    placeholder="Your LMS API key"
                    required
                />
            </div>

            <div>
                <Label htmlFor="courseIdentifier">Course ID/Identifier</Label>
                <Input
                    id="courseIdentifier"
                    value={lmsConfig.courseIdentifier}
                    onChange={(e) => setLmsConfig({ ...lmsConfig, courseIdentifier: e.target.value })}
                    placeholder="12345 or course-code"
                    required
                />
            </div>

            <Button type="submit" disabled={isConnecting} className="w-full">
                {isConnecting ? "Connecting..." : "Connect LMS"}
            </Button>
        </form>
    )
}