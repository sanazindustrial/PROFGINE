import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { priceIdForTier, PaidTier } from "@/lib/billing/plans";
import { getBillingContext, ensureUserSubscription } from "@/lib/access/getBillingContext";

export async function POST(req: Request) {
    try {
        const user = await requireRole(["ADMIN", "PROFESSOR"]);
        const { tier, ownerType = "USER", orgId } = (await req.json()) as {
            tier: PaidTier;
            ownerType?: "USER" | "ORG";
            orgId?: string;
        };

        // Ensure user has subscription records
        await ensureUserSubscription(user.id);

        let stripeCustomerId: string | null = null;
        let metadata: Record<string, string>;

        if (ownerType === "ORG") {
            // Organization subscription
            if (!orgId) {
                return NextResponse.json({ error: "Organization ID required for org subscription" }, { status: 400 });
            }

            // Verify user has access to this organization
            const membership = await prisma.organizationMember.findFirst({
                where: {
                    userId: user.id,
                    orgId,
                    orgRole: { in: ["OWNER", "ADMIN"] } // Only owners/admins can purchase
                },
                include: { org: { include: { subscription: true } } }
            });

            if (!membership) {
                return NextResponse.json({ error: "Not authorized to manage this organization's subscription" }, { status: 403 });
            }

            // Check if Stripe is configured
            if (!stripe) {
                return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
            }

            // Get or create Stripe customer for organization
            stripeCustomerId = membership.org.subscription?.stripeCustomerId ?? null;
            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: user.email ?? undefined,
                    name: `${membership.org.name} (${user.name || user.email})`,
                    metadata: { orgId, ownerType: "ORG" },
                });
                stripeCustomerId = customer.id;

                // Update organization subscription with customer ID
                await prisma.orgSubscription.upsert({
                    where: { orgId },
                    create: { orgId, stripeCustomerId, tier: "FREE_TRIAL", status: "TRIALING" },
                    update: { stripeCustomerId },
                });
            }

            metadata = { ownerType: "ORG", ownerId: orgId, tier };
        } else {
            // Individual user subscription
            const userSub = await prisma.userSubscription.findUnique({
                where: { userId: user.id }
            });

            // Check if Stripe is configured
            if (!stripe) {
                return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
            }

            // Get or create Stripe customer for user
            stripeCustomerId = userSub?.stripeCustomerId ?? null;
            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: user.email ?? undefined,
                    name: user.name ?? undefined,
                    metadata: { userId: user.id, ownerType: "USER" },
                });
                stripeCustomerId = customer.id;

                // Update user subscription with customer ID
                await prisma.userSubscription.update({
                    where: { userId: user.id },
                    data: { stripeCustomerId }
                });
            }

            metadata = { ownerType: "USER", ownerId: user.id, tier };
        }

        // Create Checkout Session
        const priceId = priceIdForTier(tier);
        const appUrl = process.env.APP_URL!;

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/billing/cancel`,
            allow_promotion_codes: true,
            metadata,
        });

        return NextResponse.json({ url: session.url }, { status: 200 });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}