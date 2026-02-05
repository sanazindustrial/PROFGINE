import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import { UserRole, SubscriptionStatus } from "@prisma/client"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminUsersPage() {
    const session = await requireSession()

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        redirect("/dashboard")
    }

    const [users, totalUsers, admins, professors, students, activeSubscriptions] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                subscriptionType: true,
                createdAt: true,
                presentations: { select: { id: true } },
                _count: { select: { courses: true, enrollments: true } }
            }
        }),
        prisma.user.count(),
        prisma.user.count({ where: { role: UserRole.ADMIN } }),
        prisma.user.count({ where: { role: UserRole.PROFESSOR } }),
        prisma.user.count({ where: { role: UserRole.STUDENT } }),
        prisma.userSubscription.count({
            where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } }
        })
    ])

    const stats = {
        totalUsers,
        admins,
        professors,
        students,
        activeSubscriptions
    }

    return <UserManagement users={users} stats={stats} />
}
