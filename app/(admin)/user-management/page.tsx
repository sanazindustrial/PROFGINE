import { prisma } from "@/lib/prisma"
import { Button, Link, Table, Text, Badge } from "@radix-ui/themes"
import { requireSession } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { redirect } from "next/navigation"

/**
 * USER MANAGEMENT - FOR PLATFORM OWNERS ONLY
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
    orderBy: { createdAt: 'desc' }
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
        <h2>
          <Text size="5">Current Users ({users.length})</Text>
        </h2>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Joined</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user: any) => (
              <Table.Row key={user.id}>
                <Table.Cell>
                  {user.name || 'No name set'}
                </Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  {getRoleBadge(user.role)}
                </Table.Cell>
                <Table.Cell>
                  {user.isOwner ? <Badge color="purple">Owner</Badge> : '-'}
                </Table.Cell>
                <Table.Cell>{new Date(user.createdAt).toLocaleDateString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </section>

      <section className="m-5">
        <h2>
          <Text size="5">Pending Invitations ({invitations.length})</Text>
        </h2>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Invited</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Expires</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {invitations.map((invitation: any) => (
              <Table.Row key={invitation.id}>
                <Table.Cell>{invitation.email}</Table.Cell>
                <Table.Cell>{getRoleBadge(invitation.role)}</Table.Cell>
                <Table.Cell>{new Date(invitation.createdAt).toLocaleDateString()}</Table.Cell>
                <Table.Cell>{new Date(invitation.validThrough).toLocaleDateString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </section>
    </section>
  )
}

export default OwnerUserManagement
