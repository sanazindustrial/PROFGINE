import { getServerSession } from "next-auth/next"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        return NextResponse.json({
            authenticated: !!session,
            session: session,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent'),
        })
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to get session',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}