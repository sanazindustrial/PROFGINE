import { requireSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RoleManagementClient from './role-management-client'

// Owner emails with full access
const OWNER_EMAILS = [
    'rjassaf13@gmail.com',
    'ohaddad12@gmail.com',
    'sanazindustrial@gmail.com',
    'versorabusiness@gmail.com'
]

export default async function RoleManagementPage() {
    const session = await requireSession()

    if (!session?.user) {
        redirect('/auth/signin')
    }

    const userEmail = session.user.email?.toLowerCase() || ''
    const isOwner = OWNER_EMAILS.includes(userEmail)
    // Cast role to string for comparison since Prisma enum may not match at runtime
    const userRole = String(session.user.role)
    const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER'

    // Only owners and admins can access this page
    if (!isOwner && !isAdmin) {
        redirect('/dashboard')
    }

    return <RoleManagementClient isOwner={isOwner} />
}
