import AdminDashboard from '@/components/admin-dashboard'
import { requireSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await requireSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <AdminDashboard />
}