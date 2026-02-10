import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export function getAllowedEmailDomains(): string[] {
    const raw = process.env.ALLOWED_EMAIL_DOMAINS || process.env.ALLOWED_UNIVERSITY_DOMAINS || "";
    const domains = raw
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean);

    return domains.length > 0 ? domains : [".edu"];
}

export function isAllowedUniversityEmail(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;

    return getAllowedEmailDomains().some((allowed) => {
        if (allowed.startsWith(".")) {
            return domain.endsWith(allowed);
        }

        return domain === allowed || domain.endsWith(`.${allowed}`);
    });
}

/**
 * Utility functions for user role management
 */

export async function assignUserRole(userId: string, role: UserRole) {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        console.log(`✅ User role updated: ${updatedUser.email} -> ${role}`);
        return updatedUser;
    } catch (error) {
        console.error("❌ Error updating user role:", error);
        throw error;
    }
}

export async function getUserWithRole(email: string) {
    return await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });
}

export async function createUserWithRole(email: string, name?: string, role: UserRole = UserRole.PROFESSOR) {
    try {
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || null,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        console.log(`✅ User created: ${newUser.email} with role ${role}`);
        return newUser;
    } catch (error) {
        console.error("❌ Error creating user:", error);
        throw error;
    }
}

export function determineRoleFromEmail(email: string): UserRole {
    // Custom logic to determine role based on email domain or patterns

    if (isAllowedUniversityEmail(email)) {
        return UserRole.PROFESSOR;
    }

    return UserRole.STUDENT;
}

export async function getAllUsers() {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            _count: {
                select: {
                    courses: true,
                    submissions: true,
                    posts: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getUsersByRole(role: UserRole) {
    return await prisma.user.findMany({
        where: { role },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}