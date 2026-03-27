import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        const body = await request.json()

        // Handle research synthesis action (NotebookLM)
        if (body.action === 'research') {
            const { aiQualityService } = await import('@/lib/services/ai-quality.service')
            const result = await aiQualityService.researchSynthesize(
                body.topic,
                body.context || '',
                body.depth || 'intermediate'
            )
            return NextResponse.json({ result })
        }

        const { agents, qualityMode, autoEnhance, multiPassReview } = body

        // Store settings (in a real implementation, save to database)
        console.log(`AI Features updated by ${session.user.email}:`, {
            qualityMode,
            autoEnhance,
            multiPassReview,
            agentCount: Object.keys(agents || {}).length,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        if (error?.message === 'Not authenticated') {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        console.error('Error saving AI features:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}

export async function GET() {
    try {
        const session = await requireSession()

        return NextResponse.json({
            qualityMode: 'enhanced',
            autoEnhance: true,
            multiPassReview: true,
            agents: {},
        })
    } catch (error: any) {
        if (error?.message === 'Not authenticated') {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
}
