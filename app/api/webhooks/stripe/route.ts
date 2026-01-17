import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
    // Check if Stripe is configured
    if (!stripe) {
        return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: `Webhook Error: ${(err as Error).message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const ownerType = session.metadata?.ownerType as "USER" | "ORG";
                const ownerId = session.metadata?.ownerId;
                const tier = session.metadata?.tier as any;

                if (!ownerType || !ownerId) {
                    console.warn('Checkout session completed without required metadata');
                    break;
                }

                // subscription id is present for subscription mode
                const stripeSubscriptionId = session.subscription as string | null;
                const stripeCustomerId = session.customer as string | null;

                if (ownerType === "ORG") {
                    await prisma.orgSubscription.upsert({
                        where: { orgId: ownerId },
                        create: {
                            orgId: ownerId,
                            tier: tier ?? "BASIC",
                            status: "ACTIVE",
                            stripeCustomerId: stripeCustomerId ?? undefined,
                            stripeSubscriptionId: stripeSubscriptionId ?? undefined,
                        },
                        update: {
                            tier: tier ?? "BASIC",
                            status: "ACTIVE",
                            stripeCustomerId: stripeCustomerId ?? undefined,
                            stripeSubscriptionId: stripeSubscriptionId ?? undefined,
                        },
                    });
                    console.log(`Organization subscription activated: ${ownerId} with tier ${tier}`);
                } else {
                    await prisma.userSubscription.upsert({
                        where: { userId: ownerId },
                        create: {
                            userId: ownerId,
                            tier: tier ?? "BASIC",
                            status: "ACTIVE",
                            stripeCustomerId: stripeCustomerId ?? undefined,
                            stripeSubscriptionId: stripeSubscriptionId ?? undefined,
                        },
                        update: {
                            tier: tier ?? "BASIC",
                            status: "ACTIVE",
                            stripeCustomerId: stripeCustomerId ?? undefined,
                            stripeSubscriptionId: stripeSubscriptionId ?? undefined,
                        },
                    });
                    console.log(`User subscription activated: ${ownerId} with tier ${tier}`);
                }
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.created":
            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;

                // Find organization subscription by stripeCustomerId
                const orgSub = await prisma.orgSubscription.findFirst({
                    where: { stripeCustomerId: sub.customer as string },
                });

                // Find user subscription by stripeCustomerId
                const userSub = await prisma.userSubscription.findFirst({
                    where: { stripeCustomerId: sub.customer as string },
                });

                if (!orgSub && !userSub) {
                    console.warn(`No subscription found for Stripe customer ${sub.customer}`);
                    break;
                }

                const statusMap: Record<string, any> = {
                    active: "ACTIVE",
                    trialing: "TRIALING",
                    past_due: "PAST_DUE",
                    canceled: "CANCELED",
                    incomplete: "INCOMPLETE",
                };

                const newStatus = statusMap[sub.status] ?? "INCOMPLETE";
                const currentPeriodEnd = (sub as any).current_period_end
                    ? new Date((sub as any).current_period_end * 1000)
                    : null;

                const priceId = sub.items.data[0]?.price?.id ?? null;

                if (orgSub) {
                    await prisma.orgSubscription.update({
                        where: { orgId: orgSub.orgId },
                        data: {
                            status: newStatus,
                            stripeSubscriptionId: sub.id,
                            stripePriceId: priceId ?? undefined,
                            currentPeriodEnd: currentPeriodEnd ?? undefined,
                            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
                        },
                    });
                    console.log(`Organization subscription updated: ${orgSub.orgId}, status=${newStatus}`);
                }

                if (userSub) {
                    await prisma.userSubscription.update({
                        where: { userId: userSub.userId },
                        data: {
                            status: newStatus,
                            stripeSubscriptionId: sub.id,
                            stripePriceId: priceId ?? undefined,
                            currentPeriodEnd: currentPeriodEnd ?? undefined,
                            cancelAtPeriodEnd: (sub as any).cancel_at_period_end ?? false,
                        },
                    });
                    console.log(`User subscription updated: ${userSub.userId}, status=${newStatus}`);
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription;

                if (subscriptionId && typeof subscriptionId === 'string') {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    // Check both org and user subscriptions
                    const orgSub = await prisma.orgSubscription.findFirst({
                        where: { stripeCustomerId: subscription.customer as string },
                    });

                    const userSub = await prisma.userSubscription.findFirst({
                        where: { stripeCustomerId: subscription.customer as string },
                    });

                    if (orgSub) {
                        await prisma.orgSubscription.update({
                            where: { orgId: orgSub.orgId },
                            data: {
                                status: "ACTIVE",
                                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                            },
                        });
                        console.log(`Payment succeeded for org ${orgSub.orgId}`);
                    }

                    if (userSub) {
                        await prisma.userSubscription.update({
                            where: { userId: userSub.userId },
                            data: {
                                status: "ACTIVE",
                                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                            },
                        });
                        console.log(`Payment succeeded for user ${userSub.userId}`);
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription;

                if (subscriptionId && typeof subscriptionId === 'string') {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    // Check both org and user subscriptions
                    const orgSub = await prisma.orgSubscription.findFirst({
                        where: { stripeCustomerId: subscription.customer as string },
                    });

                    const userSub = await prisma.userSubscription.findFirst({
                        where: { stripeCustomerId: subscription.customer as string },
                    });

                    if (orgSub) {
                        await prisma.orgSubscription.update({
                            where: { orgId: orgSub.orgId },
                            data: {
                                status: "PAST_DUE",
                            },
                        });
                        console.log(`Payment failed for org ${orgSub.orgId}`);
                    }

                    if (userSub) {
                        await prisma.userSubscription.update({
                            where: { userId: userSub.userId },
                            data: {
                                status: "PAST_DUE",
                            },
                        });
                        console.log(`Payment failed for user ${userSub.userId}`);
                    }
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}