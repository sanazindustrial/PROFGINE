// lib/session-manager.ts
// Session management with concurrent session limits and anti-sharing protection
// NOTE: ClientSessionTracker model not yet added to schema - functions are stubbed

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
    'rjassaf13@gmail.com',
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
    if (user.subscriptionType === 'PREMIUM') {
        return 5;
    }

    return 2; // Default limit
}

/**
 * Get active sessions for a user
 * NOTE: Stubbed - ClientSessionTracker model not yet in schema
 */
export async function getActiveSessions(_userId: string): Promise<SessionInfo[]> {
    // TODO: Implement when ClientSessionTracker model is added to schema
    return [];
}

/**
 * Check if a new session can be created
 * Implements anti-sharing detection based on IP changes
 * NOTE: Stubbed - always allows session until model is added
 */
export async function checkSessionAllowed(
    userId: string,
    _newIpAddress?: string,
    _newDeviceId?: string
): Promise<SessionCheckResult> {
    const maxSessions = await getMaxSessions(userId);

    // Always allow - session tracking not yet implemented
    return {
        allowed: true,
        activeSessions: [],
        maxSessions
    };
}

/**
 * Create a new session tracker entry
 * NOTE: Stubbed - ClientSessionTracker model not yet in schema
 */
export async function createSessionTracker(
    _userId: string,
    _sessionId: string,
    _ipAddress?: string,
    _userAgent?: string,
    _deviceInfo?: Record<string, unknown>
): Promise<void> {
    // TODO: Implement when ClientSessionTracker model is added to schema
    console.log('[SessionManager] createSessionTracker stubbed - model not in schema');
}

/**
 * Update session last activity
 * NOTE: Stubbed - ClientSessionTracker model not yet in schema
 */
export async function pingSession(_sessionId: string): Promise<void> {
    // TODO: Implement when ClientSessionTracker model is added to schema
}

/**
 * Terminate a specific session
 * NOTE: Stubbed - ClientSessionTracker model not yet in schema
 */
export async function terminateSession(
    _trackerId: string,
    _terminatedBy: string,
    _reason?: string
): Promise<void> {
    // TODO: Implement when ClientSessionTracker model is added to schema
}

/**
 * Terminate all sessions for a user (useful for password change, etc.)
 * NOTE: Partially stubbed - only NextAuth session invalidation works
 */
export async function terminateAllSessions(
    userId: string,
    _terminatedBy: string,
    _reason?: string
): Promise<number> {
    // Invalidate NextAuth sessions
    await prisma.session.deleteMany({
        where: { userId }
    });

    // Increment session version to invalidate JWTs
    await prisma.user.update({
        where: { id: userId },
        data: { sessionVersion: { increment: 1 } }
    });

    return 0;
}

/**
 * Clean up stale sessions (no ping in last hour)
 * NOTE: Stubbed - ClientSessionTracker model not yet in schema
 */
export async function cleanupStaleSessions(): Promise<number> {
    // TODO: Implement when ClientSessionTracker model is added to schema
    return 0;
}

/**
 * Get all sessions across all users (owner only)
 * NOTE: Stubbed - ClientSessionTracker model not yet in schema
 */
export async function getAllActiveSessions(): Promise<{
    total: number;
    byUser: Record<string, SessionInfo[]>;
    suspicious: SessionInfo[];
}> {
    // TODO: Implement when ClientSessionTracker model is added to schema
    return {
        total: 0,
        byUser: {},
        suspicious: []
    };
}
