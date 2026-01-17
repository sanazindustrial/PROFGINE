import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { priceIdForTier, PaidTier } from "@/lib/billing/plans";

type OwnerType = "USER" | "ORG";

type Body = {
    tier: PaidTier;
    ownerType: OwnerType;
    orgId?: string; // required if ownerType==="ORG"
};

export async function POST(req: Request) {
    try {
        // Check if Stripe is configured
        if (!stripe) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const session = await requireSession();
        const body = (await req.json()) as Body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, email: true, name: true, role: true },
        });
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { tier, ownerType, orgId } = body;

        // Resolve billing owner
        let ownerId: string;
        let stripeCustomerId: string | null = null;
        let customerName: string;

        if (ownerType === "USER") {
            ownerId = user.id;
            customerName = user.name || user.email || "User";

            const sub = await prisma.userSubscription.findUnique({ where: { userId: user.id } });
            stripeCustomerId = sub?.stripeCustomerId ?? null;

            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: user.email ?? undefined,
                    name: customerName,
                    metadata: { ownerType: "USER", ownerId },
                });
                stripeCustomerId = customer.id;

                await prisma.userSubscription.upsert({
                    where: { userId: user.id },
                    create: { userId: user.id, tier: "FREE_TRIAL", status: "INCOMPLETE", stripeCustomerId },
                    update: { stripeCustomerId },
                });
            }
        } else {
            // ORG subscription
            if (!orgId) return NextResponse.json({ error: "orgId required for ORG subscription" }, { status: 400 });

            // Verify membership and permissions
            const membership = await prisma.organizationMember.findFirst({
                where: { userId: user.id, orgId },
                include: { org: { include: { subscription: true } } },
            });

            if (!membership) {
                return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
            }

            if (membership.orgRole !== "OWNER" && membership.orgRole !== "ADMIN") {
                return NextResponse.json({ error: "Only organization owners/admins can manage subscriptions" }, { status: 403 });
            }

            ownerId = orgId;
            customerName = membership.org.name;
            stripeCustomerId = membership.org.subscription?.stripeCustomerId ?? null;

            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: user.email ?? undefined,
                    name: customerName,
                    metadata: { ownerType: "ORG", ownerId },
                });
                stripeCustomerId = customer.id;

                await prisma.orgSubscription.upsert({
                    where: { orgId: ownerId },
                    create: { orgId: ownerId, tier: "FREE_TRIAL", status: "INCOMPLETE", stripeCustomerId },
                    update: { stripeCustomerId },
                });
            }
        }

        // Create Checkout Session
        const priceId = priceIdForTier(tier);
        const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

        const checkout = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: stripeCustomerId!,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/billing/cancel`,
            allow_promotion_codes: true,
            metadata: { ownerType, ownerId, tier },
        });

        return NextResponse.json({ url: checkout.url }, { status: 200 });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create checkout session" },
            { status: 500 }
        );
    }
}