"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type {
    AcademicLevel,
    CourseDetails,
    DeliveryMode,
    FormattingStandard,
    LearningModel,
    AIUsagePolicy,
    AssessmentWeighting,
    BulkCourseImport,
} from "@/types/course-design-studio.types"

interface CourseInformationProps {
    courseId: string
    courseTitle?: string | null
    courseCode?: string | null
    initialDetails?: Partial<CourseDetails> | null
    hasDesign: boolean
    onSaved?: (details: Partial<CourseDetails>) => void
    onBulkImport?: (result: unknown) => void
}

const emptyWeighting: AssessmentWeighting = {
    exams: undefined,
    assignments: undefined,
    projects: undefined,
    participation: undefined,
    quizzes: undefined,
    discussions: undefined,
    final: undefined,
}

const toNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

const normalizeEnum = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "_")

const academicLevelMap: Record<string, AcademicLevel> = {
    UG: "UNDERGRADUATE",
    UNDERGRADUATE: "UNDERGRADUATE",
    GRAD: "GRADUATE",
    GRADUATE: "GRADUATE",
    DOCTORAL: "DOCTORAL",
    PHD: "DOCTORAL",
    PROFESSIONAL: "PROFESSIONAL",
    CERTIFICATE: "CERTIFICATE",
}

const deliveryModeMap: Record<string, DeliveryMode> = {
    ONLINE: "ONLINE",
    HYBRID: "HYBRID",
    IN_PERSON: "IN_PERSON",
    HYFLEX: "HYFLEX",
}

const learningModelMap: Record<string, LearningModel> = {
    LECTURE: "LECTURE",
    CASE_BASED: "CASE_BASED",
    PROJECT_BASED: "PROJECT_BASED",
    FLIPPED: "FLIPPED",
    SEMINAR: "SEMINAR",
    LAB: "LAB",
    PRACTICUM: "PRACTICUM",
    MIXED: "MIXED",
}

const formattingStandardMap: Record<string, FormattingStandard> = {
    APA: "APA",
    MLA: "MLA",
    CHICAGO: "CHICAGO",
    HARVARD: "HARVARD",
    IEEE: "IEEE",
    INSTITUTIONAL: "INSTITUTIONAL",
}

const aiUsageMap: Record<string, AIUsagePolicy> = {
    NOT_PERMITTED: "NOT_PERMITTED",
    PERMITTED_WITH_DISCLOSURE: "PERMITTED_WITH_DISCLOSURE",
    PERMITTED_ALL: "PERMITTED_ALL",
    COURSE_SPECIFIC: "COURSE_SPECIFIC",
}

const splitList = (value: string) =>
    value
        .split(/[,;\n]/)
        .map(item => item.trim())
        .filter(Boolean)

const splitCsvLine = (line: string) => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i]
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i += 1
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === "," && !inQuotes) {
            result.push(current)
            current = ""
        } else {
            current += char
        }
    }

    result.push(current)
    return result.map(cell => cell.trim())
}

const headerKeyMap: Record<string, keyof CourseDetails> = {
    title: "title",
    course_title: "title",
    coursecode: "code",
    code: "code",
    credits: "creditHours",
    credithours: "creditHours",
    contacthours: "contactHours",
    academiclevel: "academicLevel",
    termlength: "termLength",
    deliverymode: "deliveryMode",
    prerequisites: "prerequisites",
    programalignment: "programAlignment",
    learningmodel: "learningModel",
    participationrules: "participationRules",
    weeklyworkloadhours: "weeklyWorkloadHours",
    formattingstandard: "formattingStandard",
    accessibilityrequired: "accessibilityRequired",
    aiusagepolicy: "aiUsagePolicy",
    accreditationbody: "accreditationBody",
}

const weightingKeys: Record<string, keyof AssessmentWeighting> = {
    exams: "exams",
    assignments: "assignments",
    projects: "projects",
    participation: "participation",
    quizzes: "quizzes",
    discussions: "discussions",
    final: "final",
}

export function CourseInformation({
    courseId,
    courseTitle,
    courseCode,
    initialDetails,
    hasDesign,
    onSaved,
    onBulkImport,
}: CourseInformationProps) {
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [bulkStatus, setBulkStatus] = useState<string | null>(null)
    const [bulkError, setBulkError] = useState<string | null>(null)
    const [bulkCourses, setBulkCourses] = useState<Partial<CourseDetails>[]>([])
    const [details, setDetails] = useState<Partial<CourseDetails>>({
        creditHours: initialDetails?.creditHours ?? 3,
        contactHours: initialDetails?.contactHours ?? 3,
        academicLevel: initialDetails?.academicLevel ?? "UNDERGRADUATE",
        termLength: initialDetails?.termLength ?? 16,
        deliveryMode: initialDetails?.deliveryMode ?? "ONLINE",
        prerequisites: initialDetails?.prerequisites ?? [],
        programAlignment: initialDetails?.programAlignment ?? "",
        learningModel: initialDetails?.learningModel ?? "LECTURE",
        assessmentWeighting: initialDetails?.assessmentWeighting ?? emptyWeighting,
        participationRules: initialDetails?.participationRules ?? "",
        weeklyWorkloadHours: initialDetails?.weeklyWorkloadHours ?? 9,
        formattingStandard: initialDetails?.formattingStandard ?? "APA",
        accessibilityRequired: initialDetails?.accessibilityRequired ?? true,
        aiUsagePolicy: initialDetails?.aiUsagePolicy ?? "PERMITTED_WITH_DISCLOSURE",
        accreditationBody: initialDetails?.accreditationBody ?? "",
    })

    const prerequisitesText = useMemo(
        () => (details.prerequisites || []).join(", "),
        [details.prerequisites]
    )

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)
        setError(null)

        try {
            const response = await fetch("/api/course-design-studio", {
                method: hasDesign ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: hasDesign ? "update-details" : "initialize",
                    courseId,
                    details: {
                        ...details,
                        prerequisites: details.prerequisites || [],
                    },
                }),
            })

            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to save course details")
            }

            setMessage("Course information saved successfully.")
            onSaved?.(payload.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to save course details")
        } finally {
            setSaving(false)
        }
    }

    const parseCsv = (text: string) => {
        const rows = text.split(/\r?\n/).filter(Boolean)
        if (rows.length < 2) {
            throw new Error("CSV must include a header row and at least one data row.")
        }

        const headers = splitCsvLine(rows[0]).map(header =>
            header.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "")
        )

        return rows.slice(1).map(line => {
            const cells = splitCsvLine(line)
            const entry: Partial<CourseDetails> = { assessmentWeighting: { ...emptyWeighting } }

            headers.forEach((header, index) => {
                const rawValue = cells[index] ?? ""
                if (!rawValue) return

                if (header in weightingKeys) {
                    const weightKey = weightingKeys[header]
                    const weightValue = toNumber(rawValue)
                    if (weightValue !== undefined) {
                        entry.assessmentWeighting = {
                            ...(entry.assessmentWeighting || emptyWeighting),
                            [weightKey]: weightValue,
                        }
                    }
                    return
                }

                const mappedKey = headerKeyMap[header]
                if (!mappedKey) return

                switch (mappedKey) {
                    case "creditHours":
                    case "contactHours":
                    case "termLength":
                    case "weeklyWorkloadHours":
                        entry[mappedKey] = toNumber(rawValue) as never
                        break
                    case "prerequisites":
                        entry.prerequisites = splitList(rawValue)
                        break
                    case "academicLevel":
                        entry.academicLevel = academicLevelMap[normalizeEnum(rawValue)]
                        break
                    case "deliveryMode":
                        entry.deliveryMode = deliveryModeMap[normalizeEnum(rawValue)]
                        break
                    case "learningModel":
                        entry.learningModel = learningModelMap[normalizeEnum(rawValue)]
                        break
                    case "formattingStandard":
                        entry.formattingStandard = formattingStandardMap[normalizeEnum(rawValue)]
                        break
                    case "aiUsagePolicy":
                        entry.aiUsagePolicy = aiUsageMap[normalizeEnum(rawValue)]
                        break
                    case "accessibilityRequired":
                        entry.accessibilityRequired = rawValue.toLowerCase() === "true"
                        break
                    default:
                        entry[mappedKey] = rawValue as never
                        break
                }
            })

            return entry
        })
    }

    const handleBulkFile = async (file: File) => {
        setBulkError(null)
        setBulkStatus(null)
        setBulkCourses([])

        if (file.name.toLowerCase().endsWith(".xlsx")) {
            setBulkError("XLSX import is not supported in-browser yet. Please upload CSV or JSON.")
            return
        }

        try {
            const text = await file.text()
            if (file.name.toLowerCase().endsWith(".json")) {
                const parsed = JSON.parse(text)
                const courses = Array.isArray(parsed) ? parsed : parsed?.courses
                if (!Array.isArray(courses)) {
                    throw new Error("JSON must be an array or include a 'courses' array.")
                }
                setBulkCourses(courses)
            } else {
                setBulkCourses(parseCsv(text))
            }
        } catch (err) {
            setBulkError(err instanceof Error ? err.message : "Unable to parse file")
        }
    }

    const handleBulkImport = async () => {
        if (!bulkCourses.length) {
            setBulkError("No courses parsed for import.")
            return
        }

        setBulkStatus(null)
        setBulkError(null)

        try {
            const importData: BulkCourseImport = {
                format: "csv",
                courses: bulkCourses,
            }

            const response = await fetch("/api/course-design-studio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "bulk-import",
                    courseId,
                    importData,
                }),
            })

            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload?.error || "Bulk import failed")
            }

            setBulkStatus("Bulk course import completed.")
            onBulkImport?.(payload.data)
        } catch (err) {
            setBulkError(err instanceof Error ? err.message : "Bulk import failed")
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Course Information
                        {!hasDesign && <Badge variant="secondary">Not initialized</Badge>}
                    </CardTitle>
                    <CardDescription>
                        Set academic context once and reuse across all AI tools.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {(courseTitle || courseCode) && (
                        <div className="flex flex-wrap gap-2">
                            {courseTitle && <Badge variant="outline">{courseTitle}</Badge>}
                            {courseCode && <Badge variant="outline">{courseCode}</Badge>}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Credit Hours</Label>
                            <Input
                                type="number"
                                value={details.creditHours ?? ""}
                                onChange={(e) => setDetails(prev => ({ ...prev, creditHours: toNumber(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Hours</Label>
                            <Input
                                type="number"
                                value={details.contactHours ?? ""}
                                onChange={(e) => setDetails(prev => ({ ...prev, contactHours: toNumber(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Academic Level</Label>
                            <Select
                                value={details.academicLevel || "UNDERGRADUATE"}
                                onValueChange={(value) => setDetails(prev => ({ ...prev, academicLevel: value as AcademicLevel }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNDERGRADUATE">Undergraduate</SelectItem>
                                    <SelectItem value="GRADUATE">Graduate</SelectItem>
                                    <SelectItem value="DOCTORAL">Doctoral</SelectItem>
                                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                                    <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Term Length (weeks)</Label>
                            <Input
                                type="number"
                                value={details.termLength ?? ""}
                                onChange={(e) => setDetails(prev => ({ ...prev, termLength: toNumber(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Delivery Mode</Label>
                            <Select
                                value={details.deliveryMode || "ONLINE"}
                                onValueChange={(value) => setDetails(prev => ({ ...prev, deliveryMode: value as DeliveryMode }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ONLINE">Online</SelectItem>
                                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                                    <SelectItem value="IN_PERSON">In-person</SelectItem>
                                    <SelectItem value="HYFLEX">HyFlex</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Learning Model</Label>
                            <Select
                                value={details.learningModel || "LECTURE"}
                                onValueChange={(value) => setDetails(prev => ({ ...prev, learningModel: value as LearningModel }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LECTURE">Lecture</SelectItem>
                                    <SelectItem value="CASE_BASED">Case-based</SelectItem>
                                    <SelectItem value="PROJECT_BASED">Project-based</SelectItem>
                                    <SelectItem value="FLIPPED">Flipped</SelectItem>
                                    <SelectItem value="SEMINAR">Seminar</SelectItem>
                                    <SelectItem value="LAB">Lab</SelectItem>
                                    <SelectItem value="PRACTICUM">Practicum</SelectItem>
                                    <SelectItem value="MIXED">Mixed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Formatting Standard</Label>
                            <Select
                                value={details.formattingStandard || "APA"}
                                onValueChange={(value) => setDetails(prev => ({ ...prev, formattingStandard: value as FormattingStandard }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="APA">APA</SelectItem>
                                    <SelectItem value="MLA">MLA</SelectItem>
                                    <SelectItem value="CHICAGO">Chicago</SelectItem>
                                    <SelectItem value="HARVARD">Harvard</SelectItem>
                                    <SelectItem value="IEEE">IEEE</SelectItem>
                                    <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Weekly Workload (hours)</Label>
                            <Input
                                type="number"
                                value={details.weeklyWorkloadHours ?? ""}
                                onChange={(e) => setDetails(prev => ({ ...prev, weeklyWorkloadHours: toNumber(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Prerequisites</Label>
                        <Textarea
                            placeholder="Comma-separated prerequisites"
                            value={prerequisitesText}
                            onChange={(e) => setDetails(prev => ({ ...prev, prerequisites: splitList(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Program Alignment</Label>
                        <Input
                            value={details.programAlignment || ""}
                            onChange={(e) => setDetails(prev => ({ ...prev, programAlignment: e.target.value }))}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Participation Rules</Label>
                            <Textarea
                                value={details.participationRules || ""}
                                onChange={(e) => setDetails(prev => ({ ...prev, participationRules: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Accreditation Body</Label>
                            <Input
                                value={details.accreditationBody || ""}
                                onChange={(e) => setDetails(prev => ({ ...prev, accreditationBody: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>AI Usage Policy</Label>
                            <Select
                                value={details.aiUsagePolicy || "PERMITTED_WITH_DISCLOSURE"}
                                onValueChange={(value) => setDetails(prev => ({ ...prev, aiUsagePolicy: value as AIUsagePolicy }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOT_PERMITTED">Not permitted</SelectItem>
                                    <SelectItem value="PERMITTED_WITH_DISCLOSURE">Permitted with disclosure</SelectItem>
                                    <SelectItem value="PERMITTED_ALL">Permitted all</SelectItem>
                                    <SelectItem value="COURSE_SPECIFIC">Course specific</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Accessibility Required</Label>
                            <Select
                                value={details.accessibilityRequired ? "true" : "false"}
                                onValueChange={(value) => setDetails(prev => ({ ...prev, accessibilityRequired: value === "true" }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Assessment Weighting (total %)</Label>
                            <Input
                                placeholder="Optional overview (ex: 40/40/20)"
                                value={""}
                                onChange={() => undefined}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {Object.entries(weightingKeys).map(([label, key]) => (
                            <div className="space-y-2" key={key}>
                                <Label className="capitalize">{label}</Label>
                                <Input
                                    type="number"
                                    value={(details.assessmentWeighting?.[key] ?? "") as string | number}
                                    onChange={(e) =>
                                        setDetails(prev => ({
                                            ...prev,
                                            assessmentWeighting: {
                                                ...(prev.assessmentWeighting || emptyWeighting),
                                                [key]: toNumber(e.target.value),
                                            },
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    {(message || error) && (
                        <Alert variant={error ? "destructive" : "default"}>
                            <AlertDescription>{error || message}</AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Course Details"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Bulk Course Information</CardTitle>
                    <CardDescription>
                        Import structured course metadata via CSV or JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="file"
                        accept=".csv,.json,.xlsx"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleBulkFile(file)
                        }}
                    />
                    {bulkCourses.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            Parsed {bulkCourses.length} course record(s).
                        </div>
                    )}
                    {(bulkStatus || bulkError) && (
                        <Alert variant={bulkError ? "destructive" : "default"}>
                            <AlertDescription>{bulkError || bulkStatus}</AlertDescription>
                        </Alert>
                    )}
                    <Button variant="secondary" onClick={handleBulkImport} disabled={!bulkCourses.length}>
                        Import Course Data
                    </Button>
                    <div className="text-xs text-muted-foreground">
                        CSV headers should match field names like title, code, creditHours, academicLevel,
                        termLength, deliveryMode, learningModel, formattingStandard, and assessment weights.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
