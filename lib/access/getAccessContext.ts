import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function getAccessContext() {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, role: true, email: true, name: true },
    });
    if (!user) throw new Error("UNAUTHORIZED");

    // Find user's organization membership
    const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: { org: { include: { subscription: true, usage: true } } },
    });

    if (!membership) {
        // User has no organization - create one for them
        const org = await prisma.organization.create({
            data: {
                name: `${user.name || user.email}'s Organization`,
                members: {
                    create: {
                        userId: user.id
                    }
                },
                subscription: {
                    create: {
                        tier: "FREE_TRIAL",
                        status: "TRIALING"
                    }
                },
                usage: {
                    create: {
                        studentsCount: 0,
                        coursesCount: 0,
                        assignmentsCount: 0,
                        aiGradesCount: 0,
                        plagiarismScansCount: 0
                    }
                }
            },
            include: {
                subscription: true,
                usage: true
            }
        });

        return {
            user,
            orgId: org.id,
            tier: org.subscription!.tier,
            status: org.subscription!.status,
            usage: org.usage,
        };
    }

    const tier = membership.org.subscription?.tier ?? "FREE_TRIAL";
    const status = membership.org.subscription?.status ?? "INCOMPLETE";

    return {
        user,
        orgId: membership.org.id,
        tier,
        status,
        usage: membership.org.usage,
    };
}

export type AccessContext = Awaited<ReturnType<typeof getAccessContext>>;