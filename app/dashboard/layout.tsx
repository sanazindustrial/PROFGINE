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
                    role: session.user.role
                }}
            />

            {/* Main Content with Sidebar */}
            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden lg:block w-64 min-h-[calc(100vh-64px)] border-r bg-white dark:bg-gray-950">
                    <Sidebar />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>
        </div>
    )
}
