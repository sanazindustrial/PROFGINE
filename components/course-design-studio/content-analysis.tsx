"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Lightbulb,
    AlertTriangle,
    Layers,
    RefreshCw,
    TrendingUp,
} from "lucide-react"
import type { ContentAnalysis } from "@/types/course-design-studio.types"

interface ContentAnalysisProps {
    courseId: string
    analysis?: ContentAnalysis | null
    onAnalyze: () => Promise<ContentAnalysis>
}

export function ContentAnalysis({ courseId, analysis, onAnalyze }: ContentAnalysisProps) {
    const [isRunning, setIsRunning] = useState(false)
    const [localAnalysis, setLocalAnalysis] = useState<ContentAnalysis | null>(analysis || null)
    const [error, setError] = useState<string | null>(null)

    const handleAnalyze = async () => {
        setIsRunning(true)
        setError(null)
        try {
            const result = await onAnalyze()
            setLocalAnalysis(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to analyze content")
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="size-5" />
                            Content Analysis
                        </CardTitle>
                        <CardDescription>
                            AI mapping of topics, coverage gaps, and overlaps.
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleAnalyze} disabled={isRunning}>
                        {isRunning ? (
                            <>
                                <RefreshCw className="mr-2 size-4 animate-spin" />
                                Analyzing
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 size-4" />
                                Run Analysis
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!localAnalysis ? (
                    <div className="text-sm text-muted-foreground">
                        Run analysis after uploading materials to generate insight.
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="size-4" />
                                    Main Topics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {localAnalysis.mainTopics?.length ? (
                                    localAnalysis.mainTopics.map(topic => (
                                        <div key={topic.id} className="flex items-center justify-between">
                                            <span className="text-sm">{topic.name}</span>
                                            <Badge variant="outline">{topic.importance}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No topics found yet.</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="size-4" />
                                    Coverage Gaps
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {localAnalysis.coverageGaps?.length ? (
                                    localAnalysis.coverageGaps.map((gap, index) => (
                                        <div key={`${gap.topic}-${index}`} className="space-y-1">
                                            <p className="text-sm font-medium">{gap.topic}</p>
                                            <p className="text-xs text-muted-foreground">{gap.reason}</p>
                                            <p className="text-xs text-primary">{gap.suggestion}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No gaps reported.</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Layers className="size-4" />
                                    Content Overlaps
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {localAnalysis.overlaps?.length ? (
                                    <ScrollArea className="h-48 pr-2">
                                        <div className="space-y-3">
                                            {localAnalysis.overlaps.map((overlap, index) => (
                                                <div key={`${overlap.topics.join("-")}-${index}`}>
                                                    <p className="text-sm font-medium">
                                                        {overlap.topics.join(" / ")}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {overlap.sources.join(", ")}
                                                    </p>
                                                    <p className="text-xs text-primary">
                                                        {overlap.recommendation}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="text-sm text-muted-foreground">No overlaps reported.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
