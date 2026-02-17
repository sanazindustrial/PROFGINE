// lib/session-manager.ts
// Session management with concurrent session limits and anti-sharing protection

import { prisma } from './prisma';

export interface SessionInfo {
    id: string;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceId: string | null;
    loginAt: Date;
    lastPing: Date;
    isActive: boolean;
    location?: string;
}

export interface SessionCheckResult {
    allowed: boolean;
    reason?: string;
    activeSessions?: SessionInfo[];
    maxSessions?: number;
    terminatedSessions?: string[];
}

// Platform owner emails - hardcoded for security
const OWNER_EMAILS = [
    'rjassaf12@gmail.com',
    'ohaddad12@gmail.com',
    'sanazindustrial@gmail.com',
    'versorabusiness@gmail.com'
];

/**
 * Check if a user is a platform owner
 */
export function isOwnerEmail(email: string): boolean {
    return OWNER_EMAILS.includes(email.toLowerCase());
}

/**
 * Get user's maximum concurrent sessions
 */
export async function getMaxSessions(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            isOwner: true,
            subscriptionType: true
        }
    });

    if (!user) return 2; // Default

    // Owner gets most sessions
    if (user.isOwner || user.role === 'ADMIN') {
        return 10;
    }

    // Premium users get more
    if (user.subscriptionType === 'PREMIUM' || user.subscriptionType === 'ENTERPRISE') {
        return 5;
    }

    return 2; // Default limit
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.clientSessionTracker.findMany({
        where: {
            userId,
            isActive: true
        },
        orderBy: { lastPing: 'desc' }
    });

    return sessions.map(s => ({
        id: s.id,
        userId: s.userId,
        ipAddress: s.ipAddress,
        userAgent: null,
        deviceId: null,
        loginAt: s.loginAt,
        lastPing: s.lastPing,
        isActive: s.isActive,
        location: s.location || undefined
    }));
}

/**
 * Check if a new session can be created
 * Implements anti-sharing detection based on IP changes
 */
export async function checkSessionAllowed(
    userId: string,
    newIpAddress?: string,
    newDeviceId?: string
): Promise<SessionCheckResult> {
    const maxSessions = await getMaxSessions(userId);
    const activeSessions = await getActiveSessions(userId);

    // Check for suspicious activity (rapid IP changes suggesting account sharing)
    if (newIpAddress && activeSessions.length > 0) {
        const recentSessions = activeSessions.filter(
            s => new Date().getTime() - s.lastPing.getTime() < 5 * 60 * 1000 // Last 5 minutes
        );

        const uniqueIps = new Set(
            recentSessions.map(s => s.ipAddress).filter(Boolean)
        );

        // If there are multiple different IPs in last 5 minutes, potentially sharing
        if (uniqueIps.size >= 2 && !uniqueIps.has(newIpAddress)) {
            // Log suspicious activity (console only - OwnerAccessLog model pending)
            console.warn('[SUSPICIOUS_ACTIVITY] Multiple IPs detected:', {
                userId,
                reason: 'Multiple IPs detected in short timeframe',
                ips: Array.from(uniqueIps),
                newIp: newIpAddress,
                timestamp: new Date().toISOString()
            });
        }
    }

    // If under limit, allow
    if (activeSessions.length < maxSessions) {
        return {
            allowed: true,
            activeSessions,
            maxSessions
        };
    }

    // Over limit - need to terminate oldest session
    const oldestSession = activeSessions[activeSessions.length - 1];

    // Terminate the oldest session
    await terminateSession(oldestSession.id, 'SYSTEM', 'Maximum concurrent sessions reached - oldest session terminated');

    return {
        allowed: true,
        activeSessions: activeSessions.slice(0, -1),
        maxSessions,
        terminatedSessions: [oldestSession.id],
        reason: 'Oldest session was terminated to allow new login'
    };
}

/**
 * Create a new session tracker entry
 */
export async function createSessionTracker(
    userId: string,
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: Record<string, unknown>
): Promise<void> {
    // First check if session is allowed
    const check = await checkSessionAllowed(userId, ipAddress);

    if (!check.allowed) {
        throw new Error(check.reason || 'Session not allowed');
    }

    await prisma.clientSessionTracker.create({
        data: {
            userId,
            sessionId,
            ipAddress,
            deviceInfo: deviceInfo || { userAgent },
            isActive: true,
            loginAt: new Date(),
            lastPing: new Date()
        }
    });
}

/**
 * Update session last activity
 */
export async function pingSession(sessionId: string): Promise<void> {
    await prisma.clientSessionTracker.updateMany({
        where: { sessionId },
        data: { lastPing: new Date() }
    });
}

/**
 * Terminate a specific session
 */
export async function terminateSession(
    trackerId: string,
    terminatedBy: string,
    reason?: string
): Promise<void> {
    await prisma.clientSessionTracker.update({
        where: { id: trackerId },
        data: {
            isActive: false,
            terminatedAt: new Date(),
            terminatedBy,
            reason
        }
    });
}

/**
 * Terminate all sessions for a user (useful for password change, etc.)
 */
export async function terminateAllSessions(
    userId: string,
    terminatedBy: string,
    reason?: string
): Promise<number> {
    const result = await prisma.clientSessionTracker.updateMany({
        where: { userId, isActive: true },
        data: {
            isActive: false,
            terminatedAt: new Date(),
            terminatedBy,
            reason: reason || 'All sessions terminated'
        }
    });

    // Also invalidate NextAuth sessions
    await prisma.session.deleteMany({
        where: { userId }
    });

    // Increment session version to invalidate JWTs
    await prisma.user.update({
        where: { id: userId },
        data: { sessionVersion: { increment: 1 } }
    });

    return result.count;
}

/**
 * Clean up stale sessions (no ping in last hour)
 */
export async function cleanupStaleSessions(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.clientSessionTracker.updateMany({
        where: {
            isActive: true,
            lastPing: { lt: oneHourAgo }
        },
        data: {
            isActive: false,
            terminatedAt: new Date(),
            terminatedBy: 'SYSTEM',
            reason: 'Session timeout due to inactivity'
        }
    });

    return result.count;
}

/**
 * Get all sessions across all users (owner only)
 */
export async function getAllActiveSessions(): Promise<{
    total: number;
    byUser: Record<string, SessionInfo[]>;
    suspicious: SessionInfo[];
}> {
    const sessions = await prisma.clientSessionTracker.findMany({
        where: { isActive: true },
        orderBy: { lastPing: 'desc' },
        include: {
            // Include user info if needed
        }
    });

    const byUser: Record<string, SessionInfo[]> = {};
    const suspicious: SessionInfo[] = [];

    for (const session of sessions) {
        const info: SessionInfo = {
            id: session.id,
            userId: session.userId,
            ipAddress: session.ipAddress,
            userAgent: null,
            deviceId: null,
            loginAt: session.loginAt,
            lastPing: session.lastPing,
            isActive: session.isActive,
            location: session.location || undefined
        };

        if (!byUser[session.userId]) {
            byUser[session.userId] = [];
        }
        byUser[session.userId].push(info);
    }

    // Detect suspicious activity - multiple IPs for same user in short time
    for (const [userId, userSessions] of Object.entries(byUser)) {
        if (userSessions.length > 1) {
            const recentSessions = userSessions.filter(
                s => new Date().getTime() - s.lastPing.getTime() < 10 * 60 * 1000
            );

            const uniqueIps = new Set(recentSessions.map(s => s.ipAddress).filter(Boolean));

            if (uniqueIps.size > 1) {
                suspicious.push(...recentSessions);
            }
        }
    }

    return {
        total: sessions.length,
        byUser,
        suspicious
    };
}
