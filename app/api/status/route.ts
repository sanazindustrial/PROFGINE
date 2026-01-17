import { NextResponse } from "next/server"

export async function GET() {
    return NextResponse.json({
        message: "Status endpoint disabled",
        timestamp: new Date().toISOString()
    })
}