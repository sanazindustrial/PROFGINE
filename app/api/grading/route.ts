import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
    return NextResponse.json({
        error: 'Grading service temporarily disabled during build'
    }, { status: 503 })
}