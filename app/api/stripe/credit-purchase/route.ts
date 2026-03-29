import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Credit packages with prices in cents
const CREDIT_PACKAGES = {
    '50': { credits: 50, priceInCents: 499, label: '50 Credits' },
    '150': { credits: 150, priceInCents: 1299, label: '150 Credits' },
    '500': { credits: 500, priceInCents: 3999, label: '500 Credits' },
    '1000': { credits: 1000, priceInCents: 6999, label: '1000 Credits' },
} as const

type PackageKey = keyof typeof CREDIT_PACKAGES

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!stripe) {
            return NextResponse.json({ error: 'Payment system is not configured' }, { status: 503 })
        }

        const { packageId } = await request.json()

        if (!packageId || !CREDIT_PACKAGES[packageId as PackageKey]) {
            return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
        }

        const pkg = CREDIT_PACKAGES[packageId as PackageKey]

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, stripeCustomerId: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Create or reuse Stripe customer
        let customerId = user.stripeCustomerId
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email!,
                metadata: { userId: user.id },
            })
            customerId = customer.id
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId }
            })
        }

        // Create a one-time checkout session for credit purchase
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `ProfGenie ${pkg.label}`,
                            description: `${pkg.credits} AI credits for grading, discussions, and course features`,
                        },
                        unit_amount: pkg.priceInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
                type: 'credit_purchase',
                credits: String(pkg.credits),
                packageId,
            },
            success_url: `${request.nextUrl.origin}/dashboard/credits?purchase=success&credits=${pkg.credits}`,
            cancel_url: `${request.nextUrl.origin}/dashboard/credits?purchase=cancelled`,
        })

        return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
    } catch (error) {
        console.error('Error creating credit purchase session:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}

// Return available packages
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packages = Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => ({
        id,
        credits: pkg.credits,
        price: (pkg.priceInCents / 100).toFixed(2),
        label: pkg.label,
    }))

    return NextResponse.json({ packages, stripeConfigured: !!stripe })
}
