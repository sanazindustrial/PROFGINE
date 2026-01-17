import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const services = await prisma.systemHealth.findMany({
            orderBy: { service: 'asc' }
        })

        return NextResponse.json({ services })
    } catch (error) {
        console.error('GET /api/admin/health error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { service, status, lastError, responseTime, version, metadata } = await request.json()

        if (!service || !status) {
            return NextResponse.json({ error: "Service and status are required" }, { status: 400 })
        }

        const health = await prisma.systemHealth.upsert({
            where: { service },
            update: {
                status,
                lastTested: new Date(),
                lastError,
                responseTime,
                version,
                metadata,
                updatedAt: new Date()
            },
            create: {
                service,
                status,
                lastTested: new Date(),
                lastError,
                responseTime,
                version,
                metadata
            }
        })

        return NextResponse.json({ health })
    } catch (error) {
        console.error('POST /api/admin/health error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}