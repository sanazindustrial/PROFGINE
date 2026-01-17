import { requireSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getBillingContext } from "@/lib/access/getBillingContext";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        // Check if Stripe is configured
        if (!stripe) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const session = await requireSession();
        const { ownerType, orgId } = await request.json();

        if (ownerType === "ORG" && !orgId) {
            return NextResponse.json(
                { error: "orgId is required for ORG portal access" },
                { status: 400 }
            );
        }

        let stripeCustomerId: string | null = null;

        if (ownerType === "USER") {
            const userSub = await prisma.userSubscription.findUnique({
                where: { userId: session.user.id },
            });

            if (!userSub?.stripeCustomerId) {
                return NextResponse.json(
                    { error: "No personal Stripe customer found. Please upgrade first." },
                    { status: 400 }
                );
            }

            stripeCustomerId = userSub.stripeCustomerId;
        } else if (ownerType === "ORG") {
            const orgMember = await prisma.organizationMember.findFirst({
                where: {
                    userId: session.user.id,
                    orgId: orgId,
                },
                include: {
                    org: {
                        include: {
                            subscription: true,
                        },
                    },
                },
            });

            if (!orgMember) {
                return NextResponse.json(
                    { error: "Organization not found or access denied" },
                    { status: 404 }
                );
            }

            if (!orgMember.org.subscription?.stripeCustomerId) {
                return NextResponse.json(
                    { error: "No organization Stripe customer found. Please upgrade first." },
                    { status: 400 }
                );
            }

            stripeCustomerId = orgMember.org.subscription.stripeCustomerId;
        } else {
            return NextResponse.json(
                { error: "Invalid ownerType" },
                { status: 400 }
            );
        }

        if (!stripeCustomerId) {
            return NextResponse.json(
                { error: "No Stripe customer ID found" },
                { status: 400 }
            );
        }

        const billingPortalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
        });

        return NextResponse.json({ url: billingPortalSession.url });
    } catch (error) {
        console.error("[BILLING_PORTAL_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}