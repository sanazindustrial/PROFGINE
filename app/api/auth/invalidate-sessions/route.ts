import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up user by email (not session.user.id which may differ)
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Increment sessionVersion — all other JWTs with the old version
    // will be invalidated on next request via the jwt callback check
    await prisma.user.update({
        where: { id: user.id },
        data: { sessionVersion: { increment: 1 } },
    });

    return NextResponse.json({ success: true, message: "All other sessions have been signed out." });
}
