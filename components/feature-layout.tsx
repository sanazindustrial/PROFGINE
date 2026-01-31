import { Sidebar } from "@/components/sidebar"
import { MarketingBanner } from "@/components/marketing-banner"

interface FeatureLayoutProps {
    children: React.ReactNode
    title: string
    description?: string
}

export function FeatureLayout({ children, title, description }: FeatureLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Marketing Banner - Logo Standard */}
            <MarketingBanner className="mb-6" />

            <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <div className="flex gap-6 lg:gap-10">
                    {/* Sidebar */}
                    <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
                        <div className="sticky top-24">
                            <Sidebar />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="min-w-0 flex-1">
                        <div className="space-y-8">
                            {/* Page Header */}
                            <div className="space-y-3">
                                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                                {description && (
                                    <p className="text-base text-muted-foreground sm:text-lg">{description}</p>
                                )}
                            </div>

                            {/* Page Content */}
                            <div className="animate-fade-in">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}