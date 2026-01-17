import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
    // Check if Stripe is configured
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        return NextResponse.json({ session })
    } catch (error) {
        console.error('Error retrieving checkout session:', error)
        return NextResponse.json(
            { error: 'Error retrieving session' },
            { status: 500 }
        )
    }
}