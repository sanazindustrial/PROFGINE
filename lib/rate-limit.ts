/**
 * In-memory rate limiter for API routes.
 * Uses a sliding-window approach with automatic cleanup.
 *
 * For production at scale, swap this for Redis-backed rate limiting.
 */

interface RateLimitEntry {
    timestamps: number[]
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

function getStore(name: string): Map<string, RateLimitEntry> {
    let store = stores.get(name)
    if (!store) {
        store = new Map()
        stores.set(name, store)
    }
    return store
}

// Periodic cleanup to prevent memory leaks — removes entries older than windowMs
let cleanupScheduled = false
function scheduleCleanup() {
    if (cleanupScheduled) return
    cleanupScheduled = true
    // Run cleanup every 5 minutes
    setInterval(() => {
        const now = Date.now()
        for (const [, store] of stores) {
            for (const [key, entry] of store) {
                // Remove entries where all timestamps are expired (older than 15 min)
                entry.timestamps = entry.timestamps.filter((t) => now - t < 15 * 60 * 1000)
                if (entry.timestamps.length === 0) {
                    store.delete(key)
                }
            }
        }
    }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
    /** Unique store name (e.g., "contact", "auth", "ai-chat") */
    name: string
    /** Maximum requests allowed within the window */
    maxRequests: number
    /** Time window in milliseconds */
    windowMs: number
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    retryAfterMs: number | null
}

/**
 * Check rate limit for a given identifier (typically IP address or user ID).
 */
export function checkRateLimit(
    config: RateLimitConfig,
    identifier: string
): RateLimitResult {
    scheduleCleanup()

    const store = getStore(config.name)
    const now = Date.now()

    let entry = store.get(identifier)
    if (!entry) {
        entry = { timestamps: [] }
        store.set(identifier, entry)
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs)

    if (entry.timestamps.length >= config.maxRequests) {
        const oldestInWindow = entry.timestamps[0]
        const retryAfterMs = config.windowMs - (now - oldestInWindow)
        return {
            allowed: false,
            remaining: 0,
            retryAfterMs,
        }
    }

    entry.timestamps.push(now)

    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        retryAfterMs: null,
    }
}

/**
 * Get client IP from request headers (works behind proxies).
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    const realIp = request.headers.get("x-real-ip")
    if (realIp) return realIp
    return "unknown"
}

/**
 * Pre-configured rate limiters for common use cases.
 */
export const rateLimiters = {
    contact: { name: "contact", maxRequests: 3, windowMs: 15 * 60 * 1000 } as RateLimitConfig,
    auth: { name: "auth", maxRequests: 10, windowMs: 15 * 60 * 1000 } as RateLimitConfig,
    aiChat: { name: "ai-chat", maxRequests: 30, windowMs: 60 * 1000 } as RateLimitConfig,
    upload: { name: "upload", maxRequests: 10, windowMs: 60 * 1000 } as RateLimitConfig,
    api: { name: "api", maxRequests: 60, windowMs: 60 * 1000 } as RateLimitConfig,
    invitation: { name: "invitation", maxRequests: 5, windowMs: 60 * 1000 } as RateLimitConfig,
}
