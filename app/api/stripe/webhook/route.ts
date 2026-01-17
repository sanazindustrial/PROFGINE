import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
    // Check if Stripe is configured
    if (!stripe) {
        return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await request.text()

    const h = await headers();
    const signature = h.get("stripe-signature") ?? "";

    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
        console.error('Webhook signature verification failed:', error)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionUpdate(subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionCanceled(subscription)
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice
                await handlePaymentSucceeded(invoice)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                await handlePaymentFailed(invoice)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Error processing webhook' },
            { status: 500 }
        )
    }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId
    if (!userId) return

    const planType = subscription.metadata.planType || 'BASIC'

    // Convert Stripe status to our enum
    let subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'
    switch (planType.toLowerCase()) {
        case 'premium':
            subscriptionType = 'PREMIUM'
            break
        case 'enterprise':
            // Map enterprise to premium since ENTERPRISE is not in the enum
            subscriptionType = 'PREMIUM'
            break
        default:
            subscriptionType = 'BASIC'
    }

    const currentPeriodEnd = (subscription as any).current_period_end

    await prisma.user.update({
        where: { id: userId },
        data: {
            subscriptionType,
            subscriptionExpiresAt: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
        },
    })

    console.log(`Updated subscription for user ${userId}: ${subscriptionType}`)
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId
    if (!userId) return

    await prisma.user.update({
        where: { id: userId },
        data: {
            subscriptionType: 'FREE',
            subscriptionExpiresAt: null,
            stripeSubscriptionId: null,
        },
    })

    console.log(`Canceled subscription for user ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
        if (!stripe) {
            console.error('Stripe is not configured')
            return
        }
        const subscription = await stripe.subscriptions.retrieve(
            (invoice as any).subscription
        )
        await handleSubscriptionUpdate(subscription)
    }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice: ${invoice.id}`)
    // You might want to send notification emails or update user status
}