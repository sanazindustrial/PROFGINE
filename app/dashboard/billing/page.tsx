import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import BillingClient from "./BillingClient";
import { getBillingContext } from "@/lib/access/getBillingContext";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
    const session = await requireSession();
    const email = session.user.email!;

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
        // If requireSession didn't throw, this is a mismatch:
        throw new Error("User not found");
    }

    // Current effective plan (ORG > USER > FREE_TRIAL)
    const ctx = await getBillingContext();

    // Organizations the user belongs to (for ORG billing choice)
    const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        include: {
            org: {
                include: {
                    subscription: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    // Individual subscription info (for portal availability & display)
    const userSub = await prisma.userSubscription.findUnique({
        where: { userId: user.id },
    });

    const orgs = memberships.map((m) => ({
        orgId: m.orgId,
        orgName: m.org.name,
        orgRole: m.orgRole,
        // show the org plan status for transparency
        tier: m.org.subscription?.tier ?? "FREE_TRIAL",
        status: m.org.subscription?.status ?? "TRIALING",
        stripeCustomerId: m.org.subscription?.stripeCustomerId ?? null,
    }));

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold">Billing</h1>
                <p className="text-sm opacity-80">
                    Manage your subscription and access to premium modules.
                </p>
            </div>

            <div className="space-y-2 rounded-2xl border p-4">
                <div className="text-sm opacity-70">Current effective plan</div>
                <div className="text-lg font-medium">
                    {ctx.tier}{" "}
                    <span className="text-sm font-normal opacity-70">({ctx.status})</span>
                </div>
                <div className="text-sm opacity-80">
                    Billing owner:{" "}
                    <span className="font-medium">
                        {ctx.ownerType === "ORG" ? "Organization" : "Personal"}
                    </span>
                </div>
                {ctx.ownerType === "ORG" ? (
                    <div className="text-sm opacity-80">
                        Organization ID: <span className="font-mono">{ctx.ownerId}</span>
                    </div>
                ) : (
                    <div className="text-sm opacity-80">
                        User: <span className="font-medium">{user.email}</span>
                    </div>
                )}
            </div>

            <BillingClient
                user={{
                    id: user.id,
                    email: user.email,
                    name: user.name ?? "",
                    role: user.role as any,
                }}
                effective={{
                    ownerType: ctx.ownerType,
                    ownerId: ctx.ownerId,
                    tier: ctx.tier,
                    status: ctx.status,
                }}
                orgs={orgs}
                userSubscription={{
                    tier: userSub?.tier ?? "FREE_TRIAL",
                    status: userSub?.status ?? "TRIALING",
                    stripeCustomerId: userSub?.stripeCustomerId ?? null,
                }}
            />
        </div>
    );
}