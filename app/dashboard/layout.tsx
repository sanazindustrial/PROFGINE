import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/auth/signin")
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <TopNav
                user={{
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                    role: session.user.role,
                    isOwner: (session.user as any).isOwner
                }}
            />

            {/* Main Content with Sidebar */}
            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden min-h-[calc(100vh-64px)] w-64 border-r bg-white dark:bg-gray-950 lg:block">
                    <Sidebar />
                </aside>

                {/* Main Content Area */}
                <main className="min-h-[calc(100vh-64px)] flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}
