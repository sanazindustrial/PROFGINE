import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await requireSession();
    const { name } = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgName = (name?.trim() || `${user.name ?? "My"} Organization`).slice(0, 80);

    try {
        const org = await prisma.organization.create({
            data: {
                name: orgName,
                members: { create: { userId: user.id, orgRole: "OWNER" } },
                subscription: { create: { tier: "FREE_TRIAL", status: "TRIALING" } },
                usage: { create: {} },
            },
        });

        return NextResponse.json({ org }, { status: 201 });
    } catch (error) {
        console.error("Error creating organization:", error);
        return NextResponse.json(
            { error: "Failed to create organization" },
            { status: 500 }
        );
    }
}