import { Sidebar } from "@/components/sidebar"

interface FeatureLayoutProps {
    children: React.ReactNode
    title: string
    description?: string
}

export function FeatureLayout({ children, title, description }: FeatureLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="hidden w-64 shrink-0 lg:block">
                        <div className="sticky top-20">
                            <Sidebar />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="min-w-0 flex-1">
                        <div className="space-y-6">
                            {/* Page Header */}
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                                {description && (
                                    <p className="text-muted-foreground">{description}</p>
                                )}
                            </div>

                            {/* Page Content */}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}