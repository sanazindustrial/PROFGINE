import { prisma } from "@/lib/prisma"
import { Button, Link, Table, Text, Badge } from "@radix-ui/themes"
import { requireRole } from "@/lib/guards"
import { UserRole } from "@prisma/client"

const AdminPanel = async () => {
  // Check if user is admin
  await requireRole([UserRole.ADMIN]);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
  // Remove invitation query since the model doesn't exist in schema
  const invitations: any[] = []

  const getRoleBadge = (role: string) => {
    const colors: { [key: string]: "red" | "blue" | "green" } = {
      ADMIN: "red",
      PROF: "blue",
      STUDENT: "green"
    }
    return <Badge color={colors[role] || "gray"}>{role}</Badge>
  }

  return (
    <section className="m-5">
      <h2 className="flex justify-center p-4">
        <Text size="5">👑 Admin Dashboard - User Management</Text>
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
          <Text size="5">📋 Current Users ({users.length})</Text>
        </h2>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
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
                <Table.Cell>{getRoleBadge(user.role)}</Table.Cell>
                <Table.Cell>{new Date(user.createdAt).toLocaleDateString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </section>

      <section className="m-5">
        <h2>
          <Text size="5">⏳ Pending Invitations ({invitations.length})</Text>
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

export default AdminPanel
