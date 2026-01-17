import { NextRequest, NextResponse } from 'next/server'
import { signOut } from 'next-auth/react'

export async function POST(req: NextRequest) {
    try {
        // Clear the direct-auth cookie
        const response = NextResponse.json({ success: true })
        response.cookies.set('direct-auth', '', {
            expires: new Date(0),
            path: '/'
        })

        return response
    } catch (error) {
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
}