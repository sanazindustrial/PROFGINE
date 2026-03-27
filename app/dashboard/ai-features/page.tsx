import { requireSession } from '@/lib/auth'
import { AIFeaturesClient } from './ai-features-client'

export default async function AIFeaturesPage() {
    await requireSession()

    return (
        <div className="container max-w-6xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">AI Features & Agents</h1>
                <p className="mt-2 text-muted-foreground">
                    Connect external AI services, configure AI agents, and enhance content generation quality.
                </p>
            </div>
            <AIFeaturesClient />
        </div>
    )
}
