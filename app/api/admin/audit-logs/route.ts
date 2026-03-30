import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
    })
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const action = url.searchParams.get('action')
    const resource = url.searchParams.get('resource')

    try {
        const where: any = {}
        if (action) where.action = { contains: action, mode: 'insensitive' }
        if (resource) where.resource = { contains: resource, mode: 'insensitive' }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ])

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Audit logs error:', error)
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }
}
