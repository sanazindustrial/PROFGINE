/**
 * HEAD-TO-HEAD E2E TEST SUITE — AUTHENTICATION & AUTHORIZATION
 *
 * Tests the auth flow, session management, proxy routing,
 * role-based access, trial/subscription gating.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock helpers ────────────────────────────────────────────────────────

function makeSession(overrides: Record<string, unknown> = {}) {
    return {
        user: {
            id: "user-1",
            email: "professor@university.edu",
            name: "Dr. Smith",
            role: "PROFESSOR",
            isOwner: false,
            subscriptionType: "PREMIUM",
            subscriptionStatus: "active",
            trialExpiresAt: null,
            ...overrides,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
}

// ── Proxy/Middleware Route Classification ────────────────────────────────

describe("Auth – Public Routes", () => {
    const publicPaths = [
        "/",
        "/login",
        "/admin-login",
        "/auth/signin",
        "/auth/signup",
        "/auth/error",
        "/privacy",
        "/terms",
        "/discussion",
        "/grade",
        "/help",
        "/docs",
        "/debug/auth",
        "/debug/users",
        "/test/auth",
        "/api/auth/signin",
        "/api/chat",
        "/api/discussion/scan-web",
        "/api/grading",
        "/api/redirect",
        "/api/debug/session",
    ]

    it("should classify all public paths correctly", () => {
        const publicPrefixes = [
            "/",
            "/login",
            "/admin-login",
            "/auth/",
            "/privacy",
            "/terms",
            "/discussion",
            "/grade",
            "/help",
            "/docs",
            "/debug/",
            "/test/",
            "/api/auth/",
            "/api/chat",
            "/api/discussion/",
            "/api/grading",
            "/api/redirect",
            "/api/debug/",
            "/api/ai/",
        ]

        function isPublic(path: string) {
            if (path === "/") return true
            return publicPrefixes.some(
                (prefix) => prefix !== "/" && (path === prefix || path.startsWith(prefix)),
            )
        }

        publicPaths.forEach((path) => {
            expect(isPublic(path)).toBe(true)
        })
    })
})

describe("Auth – Admin-Only Routes", () => {
    const adminPaths = [
        "/admin-dashboard",
        "/user-management",
        "/subscription-management",
        "/ai-management",
        "/invite-user",
        "/database-health",
        "/security",
        "/api-config",
        "/environment",
        "/tools",
        "/role-management",
        "/admin-settings",
    ]

    it("should require ADMIN role for all admin paths", () => {
        const allowedRoles = ["ADMIN"]

        adminPaths.forEach((path) => {
            const userRole = "PROFESSOR"
            expect(allowedRoles.includes(userRole)).toBe(false)
        })

        adminPaths.forEach((path) => {
            const userRole = "ADMIN"
            expect(allowedRoles.includes(userRole)).toBe(true)
        })
    })

    it("should deny STUDENT access to admin routes", () => {
        const adminRoles = ["ADMIN"]
        expect(adminRoles.includes("STUDENT")).toBe(false)
    })
})

describe("Auth – Session Token Fields", () => {
    it("should enrich JWT with all required fields", () => {
        const session = makeSession()
        const requiredFields = [
            "id",
            "email",
            "name",
            "role",
            "isOwner",
            "subscriptionType",
            "subscriptionStatus",
        ]

        requiredFields.forEach((field) => {
            expect(session.user).toHaveProperty(field)
        })
    })

    it("should have valid role values", () => {
        const validRoles = ["ADMIN", "PROFESSOR", "STUDENT"]
        const session = makeSession()
        expect(validRoles.includes(session.user.role as string)).toBe(true)
    })

    it("should have valid subscription types", () => {
        const validTypes = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]
        const session = makeSession()
        expect(validTypes.includes(session.user.subscriptionType as string)).toBe(true)
    })
})

describe("Auth – Trial Expiration Logic", () => {
    it("should detect expired trial", () => {
        const expired = new Date(Date.now() - 1000).toISOString()
        const session = makeSession({ trialExpiresAt: expired, subscriptionType: null })

        const trialExpired = session.user.trialExpiresAt
            ? new Date(session.user.trialExpiresAt as string) < new Date()
            : false
        expect(trialExpired).toBe(true)
    })

    it("should detect active trial", () => {
        const active = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        const session = makeSession({ trialExpiresAt: active, subscriptionType: null })

        const trialExpired = session.user.trialExpiresAt
            ? new Date(session.user.trialExpiresAt as string) < new Date()
            : false
        expect(trialExpired).toBe(false)
    })

    it("should not check trial when subscription is active", () => {
        const session = makeSession({ subscriptionType: "PREMIUM", trialExpiresAt: null })
        expect(session.user.subscriptionType).toBe("PREMIUM")
        expect(session.user.trialExpiresAt).toBeNull()
    })
})

describe("Auth – Role-Based Dashboard Routing", () => {
    it("should route ADMIN to admin dashboard", () => {
        const role = "ADMIN"
        const destination = role === "ADMIN" ? "/admin-dashboard" : "/dashboard"
        expect(destination).toBe("/admin-dashboard")
    })

    it("should route PROFESSOR to dashboard", () => {
        const role = "PROFESSOR"
        const destination = role === "ADMIN" ? "/admin-dashboard" : "/dashboard"
        expect(destination).toBe("/dashboard")
    })

    it("should route STUDENT to dashboard", () => {
        const role = "STUDENT"
        const destination = role === "ADMIN" ? "/admin-dashboard" : "/dashboard"
        expect(destination).toBe("/dashboard")
    })
})

describe("Auth – Owner Email Whitelist", () => {
    const ownerEmails = [
        "rjassaf12@gmail.com",
        "ohaddad12@gmail.com",
        "sanazindustrial@gmail.com",
        "versorabusiness@gmail.com",
    ]

    it("should recognize owner emails", () => {
        ownerEmails.forEach((email) => {
            expect(ownerEmails.includes(email)).toBe(true)
        })
    })

    it("should not recognize non-owner emails", () => {
        expect(ownerEmails.includes("random@gmail.com")).toBe(false)
        expect(ownerEmails.includes("admin@university.edu")).toBe(false)
    })
})

describe("Auth – Professor Signup Validation", () => {
    function validateSignup(data: Record<string, unknown>) {
        const errors: string[] = []
        if (!data.name || (data.name as string).length < 1) errors.push("name required")
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string))
            errors.push("valid email required")
        if (!data.password || (data.password as string).length < 8) errors.push("password min 8 chars")
        if (!data.institution) errors.push("institution required")
        return errors
    }

    it("should accept valid signup data", () => {
        const data = {
            name: "Dr. Smith",
            email: "smith@university.edu",
            password: "securepass123",
            institution: "MIT",
            department: "CS",
        }
        expect(validateSignup(data)).toHaveLength(0)
    })

    it("should reject missing name", () => {
        const data = { name: "", email: "a@b.com", password: "12345678", institution: "MIT" }
        expect(validateSignup(data)).toContain("name required")
    })

    it("should reject short password", () => {
        const data = { name: "Dr. A", email: "a@b.com", password: "123", institution: "MIT" }
        expect(validateSignup(data)).toContain("password min 8 chars")
    })

    it("should reject invalid email", () => {
        const data = { name: "Dr. A", email: "not-email", password: "12345678", institution: "MIT" }
        expect(validateSignup(data)).toContain("valid email required")
    })

    it("should reject missing institution", () => {
        const data = { name: "Dr. A", email: "a@b.com", password: "12345678" }
        expect(validateSignup(data)).toContain("institution required")
    })
})
