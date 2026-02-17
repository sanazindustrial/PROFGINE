// app/api/owner/clients/route.ts
// Owner-only API for managing client data, credits, and subscriptions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const OWNER_EMAILS = [
    'rjassaf12@gmail.com',
    'ohaddad12@gmail.com',
    'sanazindustrial@gmail.com',
    'versorabusiness@gmail.com'
];

async function requireOwner(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error('Unauthorized');
    }

    if (!OWNER_EMAILS.includes(session.user.email)) {
        throw new Error('Owner access required');
    }

    return session;
}

// GET - List all clients with their data
export async function GET(req: NextRequest) {
    try {
        const session = await requireOwner(req);
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const subscription = searchParams.get('subscription') || '';

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (subscription) {
            where.subscriptionType = subscription;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isOwner: true,
                    subscriptionType: true,
                    subscriptionExpiresAt: true,
                    creditBalance: true,
                    monthlyCredits: true,
                    createdAt: true,
                    _count: {
                        select: {
                            sessions: true,
                            courses: true,
                            submissions: true
                        }
                    },
                    userSubscription: {
                        select: {
                            tier: true,
                            status: true,
                            currentPeriodEnd: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        // Log access (console only - OwnerAccessLog model pending)
        console.log('[OWNER_ACCESS] VIEW_CLIENT_DATA:', {
            ownerId: session.user.email || session.user.id,
            resultsCount: users.length,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Owner clients API error:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: error.message?.includes('Unauthorized') ? 401 : 500 }
        );
    }
}

// PATCH - Update client credits or subscription
export async function PATCH(req: NextRequest) {
    try {
        const session = await requireOwner(req);
        const body = await req.json();

        const { userId, action, value, reason } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'ADD_CREDITS':
                result = await prisma.user.update({
                    where: { id: userId },
                    data: { creditBalance: { increment: value } }
                });

                await prisma.creditTransaction.create({
                    data: {
                        userId,
                        amount: value,
                        type: 'BONUS',
                        description: reason || `Credits added by owner: ${session.user.email}`
                    }
                });
                break;

            case 'SET_SUBSCRIPTION':
                result = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        subscriptionType: value
                    }
                });
                break;

            case 'SET_SESSION_LIMIT':
                // maxConcurrentSessions field not yet implemented - log to console
                console.log('[OWNER_ACTION] SET_SESSION_LIMIT requested but maxConcurrentSessions field pending:', {
                    userId,
                    sessionLimit: value
                });
                result = { success: true, message: 'Session limit setting pending - field not yet in schema' };
                break;

            case 'SET_ROLE':
                // Prevent changing owner roles
                const targetUser = await prisma.user.findUnique({ where: { id: userId } });
                if (targetUser?.isOwner && value !== 'OWNER') {
                    return NextResponse.json({ error: 'Cannot demote platform owner' }, { status: 403 });
                }

                result = await prisma.user.update({
                    where: { id: userId },
                    data: { role: value }
                });
                break;

            case 'SET_BUDGET':
                // CostControl model not yet implemented - log to console
                console.log('[OWNER_ACTION] SET_BUDGET requested but CostControl model pending:', {
                    userId,
                    budget: value.budget,
                    hardLimit: value.hardLimit
                });
                result = { success: true, message: 'Budget setting pending - CostControl model not yet implemented' };
                break;

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        // Log the action (console only - OwnerAccessLog model pending)
        console.log('[OWNER_ACTION]', {
            ownerId: session.user.email || session.user.id || 'unknown',
            action: action === 'ADD_CREDITS' ? 'MODIFY_CREDITS' :
                action === 'SET_SUBSCRIPTION' ? 'UPDATE_SUBSCRIPTION' :
                    action === 'SET_ROLE' ? 'USER_ROLE_CHANGE' : 'BILLING_ADJUSTMENT',
            targetId: userId,
            details: { action, value, reason },
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('Owner clients PATCH error:', error);
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
