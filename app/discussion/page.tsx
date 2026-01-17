"use client"

import { DiscussionResponse } from "@/components/discussion-response"
import { FeatureLayout } from "@/components/feature-layout"

export default function DiscussionGeneratorPage() {
    return (
        <FeatureLayout
            title="Discussion Response Generator"
            description="Create personalized AI responses to student discussions using multiple AI providers with automatic failover."
        >
            <DiscussionResponse />
        </FeatureLayout>
    )
}