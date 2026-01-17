import { EnhancedGrading } from '@/components/enhanced-grading'
import { requireSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function EnhancedGradingPage() {
    const session = await requireSession()

    if (!session?.user || (session.user.role !== 'PROFESSOR' && session.user.role !== 'ADMIN')) {
        redirect('/dashboard')
    }

    return <EnhancedGrading />
}