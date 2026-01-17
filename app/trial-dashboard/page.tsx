"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { FeatureLayout } from "@/components/feature-layout"
import { TrialExpiredBanner } from "@/components/trial-expired-banner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Clock,
    MessageSquare,
    GraduationCap,
    Star,
    ArrowRight,
    Crown,
    Zap,
    CheckCircle,
    X
} from "lucide-react"

export default function TrialDashboard() {
    const { data: session } = useSession()
    const [trialDaysLeft, setTrialDaysLeft] = useState(14)
    const [usageStats, setUsageStats] = useState({
        discussionResponses: 5,
        gradingAssistance: 3,
        maxDiscussions: 20,
        maxGrading: 10
    })

    useEffect(() => {
        // Calculate trial days left (mock implementation)
        const trialStartDate = new Date()
        trialStartDate.setDate(trialStartDate.getDate() - 1) // Started 1 day ago
        const trialEndDate = new Date(trialStartDate)
        trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

        const today = new Date()
        const timeDiff = trialEndDate.getTime() - today.getTime()
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24))
        setTrialDaysLeft(Math.max(0, daysLeft))
    }, [])

    const discussionProgress = (usageStats.discussionResponses / usageStats.maxDiscussions) * 100
    const gradingProgress = (usageStats.gradingAssistance / usageStats.maxGrading) * 100

    return (
        <FeatureLayout
            title={`Welcome to your Free Trial, ${session?.user?.name?.split(' ')[0] || 'Professor'}! 🚀`}
            description="Explore Professor GENIE's powerful AI features with your 14-day free trial. Upgrade anytime for unlimited access."
        >
            {/* Trial Status Banner */}
            <TrialExpiredBanner remainingDays={trialDaysLeft} className="mb-6" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="size-5 text-blue-600" />
                            Discussion Generator
                        </CardTitle>
                        <CardDescription>
                            Generate AI-powered responses to student discussions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span>Usage</span>
                            <span className="font-medium">
                                {usageStats.discussionResponses}/{usageStats.maxDiscussions}
                            </span>
                        </div>
                        <Progress value={discussionProgress} className="h-2" />
                        <Button asChild className="w-full" variant={discussionProgress >= 100 ? "outline" : "default"}>
                            <Link href="/discussion">
                                {discussionProgress >= 100 ? (
                                    <>
                                        <X className="mr-2 size-4" />
                                        Trial Limit Reached
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="mr-2 size-4" />
                                        Try Now
                                    </>
                                )}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="size-5 text-green-600" />
                            Grading Assistant
                        </CardTitle>
                        <CardDescription>
                            AI-powered grading and feedback suggestions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span>Usage</span>
                            <span className="font-medium">
                                {usageStats.gradingAssistance}/{usageStats.maxGrading}
                            </span>
                        </div>
                        <Progress value={gradingProgress} className="h-2" />
                        <Button asChild className="w-full" variant={gradingProgress >= 100 ? "outline" : "default"}>
                            <Link href="/grade">
                                {gradingProgress >= 100 ? (
                                    <>
                                        <X className="mr-2 size-4" />
                                        Trial Limit Reached
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="mr-2 size-4" />
                                        Try Now
                                    </>
                                )}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Upgrade Prompt */}
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-800">
                            <Star className="size-5 text-yellow-500" />
                            Unlock Full Access
                        </CardTitle>
                        <CardDescription className="text-purple-600">
                            Get unlimited access to all AI features
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="size-4 text-green-500" />
                                <span>Unlimited AI responses</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="size-4 text-green-500" />
                                <span>Advanced grading features</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="size-4 text-green-500" />
                                <span>Priority AI provider access</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="size-4 text-green-500" />
                                <span>Export & save functionality</span>
                            </div>
                        </div>
                        <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                            <Link href="/subscription/upgrade">
                                <Zap className="mr-2 size-4" />
                                View Plans
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </FeatureLayout>
    )
}