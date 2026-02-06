import { prisma } from "@/lib/prisma"
import { Button, Link, Text, Badge } from "@radix-ui/themes"
import { requireSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"
import { OwnerUserManagementTable } from "@/components/owner-user-management-table"

/**
 * USER MANAGEMENT - PLATFORM OWNERS
 * 
 * This page is for PLATFORM OWNERS ONLY (ADMIN role + isOwner flag).
 * Platform owners can view and manage:
 * - All professors
 * - All students  
 * - All administrators
 * 
 * Access Control:
 * - Only users with role === "ADMIN" AND isOwner === true can access
 * - Regular admins (without isOwner flag) are denied access
 * - Non-admin users are denied access
 */

const OwnerUserManagement = async () => {
  // Restrict access to platform owners only (ADMIN role + isOwner flag)
  const session = await requireSession();

  // Check if user is both ADMIN and OWNER
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  // Fetch user from database to check isOwner flag
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isOwner: true }
  });

  if (!currentUser?.isOwner) {
    redirect('/dashboard'); // Regular admins cannot access
  }

  // Fetch all users on the platform (professors, students, admins)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      userSubscription: true
    }
  })
  // Remove invitation query since the model doesn't exist in schema
  const invitations: any[] = []

  const getRoleBadge = (role: string) => {
    const colors: { [key: string]: "red" | "blue" | "green" } = {
      ADMIN: "red",
      PROFESSOR: "blue",
      STUDENT: "green"
    }
    return <Badge color={colors[role] || "gray"}>{role}</Badge>
  }

  return (
    <section className="m-5">
      <h2 className="flex justify-center p-4">
        <Text size="5">Platform Owner - All Users Management</Text>
      </h2>

      <div className="mb-5">
        <Button>
          <Link href="/invite-user" className="text-slate-50">
            Invite User
          </Link>
        </Button>
      </div>

      <section className="m-5">
        <h2 className="mb-4">
          <Text size="5">Current Users ({users.length})</Text>
        </h2>
        <OwnerUserManagementTable
          currentUserId={session.user.id}
          initialUsers={users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isOwner: user.isOwner,
            subscriptionType: user.subscriptionType,
            subscriptionExpiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : null,
            trialExpiresAt: user.trialExpiresAt ? user.trialExpiresAt.toISOString() : null,
            creditBalance: user.creditBalance ?? 0,
            monthlyCredits: user.monthlyCredits ?? 0,
            subscriptionTier: user.userSubscription?.tier ?? null,
            subscriptionStatus: user.userSubscription?.status ?? null,
            currentPeriodEnd: user.userSubscription?.currentPeriodEnd
              ? user.userSubscription.currentPeriodEnd.toISOString()
              : null,
          }))}
        />
      </section>

      <section className="m-5">
        <h2>
          <Text size="5">Pending Invitations ({invitations.length})</Text>
        </h2>
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
          Invitation management is available in the admin dashboard.
        </div>
      </section>
    </section>
  )
}

export default OwnerUserManagement
