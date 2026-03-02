"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DiscussionResponse } from "@/components/discussion-response"
import { BulkDiscussionResponse } from "@/components/bulk-discussion-response"
import { FeatureLayout } from "@/components/feature-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

function DiscussionContent() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState("single")
    const [initialContent, setInitialContent] = useState<string | null>(null)

    // Check for content from bookmarklet
    useEffect(() => {
        const content = searchParams.get("content")
        const lms = searchParams.get("lms")
        const count = searchParams.get("count")

        if (content) {
            setInitialContent(content)
            setActiveTab("bulk")

            // Show success toast from bookmarklet
            const postCount = count ? parseInt(count) : 0
            const lmsName = lms ? lms.charAt(0).toUpperCase() + lms.slice(1) : 'LMS'

            toast({
                title: `📋 Content Received from ${lmsName}`,
                description: postCount > 0
                    ? `Extracted ${postCount} discussion post(s). Click "Find Student Posts" to parse them.`
                    : `Content loaded. Click "Find Student Posts" to parse student discussions.`,
            })
        }
    }, [searchParams])

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    Single Response
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                    <Users className="size-4" />
                    Bulk Responses
                </TabsTrigger>
            </TabsList>
            <TabsContent value="single">
                <DiscussionResponse />
            </TabsContent>
            <TabsContent value="bulk">
                <BulkDiscussionResponse initialContent={initialContent} />
            </TabsContent>
        </Tabs>
    )
}

export default function DiscussionGeneratorPage() {
    return (
        <FeatureLayout
            title="Discussion Response Generator"
            description="Create personalized AI responses to student discussions using multiple AI providers with automatic failover."
        >
            <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
                <DiscussionContent />
            </Suspense>
        </FeatureLayout>
    )
}