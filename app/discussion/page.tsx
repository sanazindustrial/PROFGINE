"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DiscussionResponse } from "@/components/discussion-response"
import { BulkDiscussionResponse } from "@/components/bulk-discussion-response"
import { FeatureLayout } from "@/components/feature-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface StudentPost {
    id: string
    studentName: string
    content: string
    timestamp?: string
}

function DiscussionContent() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState("single")
    const [initialContent, setInitialContent] = useState<string | null>(null)
    const [initialPosts, setInitialPosts] = useState<StudentPost[] | null>(null)

    // Check for content from bookmarklet or localStorage import
    useEffect(() => {
        const content = searchParams.get("content")
        const lms = searchParams.get("lms")
        const count = searchParams.get("count")
        const imported = searchParams.get("imported")

        // Check localStorage for imported discussion (from bookmarklet)
        if (imported === "true") {
            try {
                const stored = localStorage.getItem("profgenie_imported_discussion")
                if (stored) {
                    const data = JSON.parse(stored)
                    // Only use if less than 5 minutes old
                    if (data.timestamp && Date.now() - data.timestamp < 300000) {
                        // If we have pre-parsed posts, use them directly
                        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
                            // Convert to expected format with IDs
                            const postsWithIds = data.posts.map((p: { studentName?: string; author?: string; content: string }, i: number) => ({
                                id: `imported-${i + 1}`,
                                studentName: p.studentName || p.author || `Student ${i + 1}`,
                                content: p.content,
                            }))
                            setInitialPosts(postsWithIds)
                            setActiveTab("bulk")

                            toast({
                                title: `✅ ${data.posts.length} Posts Imported from ${data.lmsType || 'LMS'}`,
                                description: "Posts loaded and ready! Configure settings and generate responses.",
                            })
                        } else {
                            // Fallback to raw content if no posts
                            setInitialContent(data.content)
                            setActiveTab("bulk")

                            toast({
                                title: `✅ Discussion Imported from ${data.lmsType || 'LMS'}`,
                                description: `Successfully imported content. Click "Find Student Posts" to parse them.`,
                            })
                        }

                        // Clear after reading
                        localStorage.removeItem("profgenie_imported_discussion")
                        return
                    }
                }
            } catch (e) {
                console.error("Error reading imported discussion:", e)
            }
        }

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
                <BulkDiscussionResponse initialContent={initialContent} initialPosts={initialPosts} />
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