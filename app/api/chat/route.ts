import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: Request) {
    return NextResponse.json({ 
        error: 'Chat service temporarily disabled during build' 
    }, { status: 503 })
}