import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export async function requireRole(roles: UserRole[]) {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true, email: true, name: true },
    });
    if (!user) throw new Error("UNAUTHORIZED");
    if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
    return user;
}