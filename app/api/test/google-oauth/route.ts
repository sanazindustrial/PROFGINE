import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const nextAuthUrl = process.env.NEXTAUTH_URL

    return NextResponse.json({
        status: "Google OAuth Configuration Test",
        clientId: clientId ? `${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 10)}` : "NOT SET",
        clientSecret: clientSecret ? "SET" : "NOT SET",
        nextAuthUrl: nextAuthUrl || "NOT SET",
        redirectUri: `${nextAuthUrl || 'http://localhost:3000'}/api/auth/callback/google`,
        timestamp: new Date().toISOString(),
        instructions: {
            step1: "Go to https://console.cloud.google.com/",
            step2: "Find OAuth client: " + (clientId ? clientId.substring(0, 20) + "..." : "NOT_SET"),
            step3: "Add redirect URI exactly: " + `${nextAuthUrl || 'http://localhost:3000'}/api/auth/callback/google`,
            step4: "Ensure OAuth consent screen is configured for external users",
            step5: "Add test user: sanazindustrial@gmail.com if in testing mode"
        }
    })
}