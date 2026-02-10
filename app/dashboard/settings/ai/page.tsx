import { requireSession } from '@/lib/auth'
import { UserAISettings } from '@/components/user-ai-settings'

export default async function AISettingsPage() {
    await requireSession()

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">AI Provider Settings</h1>
                <p className="mt-2 text-muted-foreground">
                    Configure your own AI API keys for enhanced privacy, security, and personalization.
                    Use your own keys to avoid platform rate limits and keep your data private.
                </p>
            </div>

            <UserAISettings />
        </div>
    )
}
