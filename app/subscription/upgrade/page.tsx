"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { FeatureLayout } from "@/components/feature-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { STRIPE_CONFIG } from "@/lib/stripe"
import {
    Crown,
    Check,
    Zap,
    Star,
    MessageSquare,
    GraduationCap,
    Users,
    Shield,
    Clock
} from "lucide-react"

export default function SubscriptionUpgrade() {
    const { data: session } = useSession()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleUpgrade = async (planType: 'BASIC' | 'PREMIUM' | 'ENTERPRISE') => {
        if (!session?.user) {
            alert('Please sign in to upgrade')
            return
        }

        setIsLoading(planType)

        try {
            const response = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tier: planType
                }),
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Error creating checkout session:', error)
            alert(error instanceof Error ? error.message : 'Error starting checkout. Please try again.')
        } finally {
            setIsLoading(null)
        }
    }

    const plans = [
        {
            name: "Basic",
            price: billingCycle === 'monthly' ? 29 : 290,
            description: "Perfect for individual professors and adjuncts",
            planType: 'BASIC' as const,
            features: STRIPE_CONFIG.PLANS.BASIC.features,
            color: "blue",
            popular: false,
            subscriptionType: "BASIC"
        },
        {
            name: "Premium",
            price: billingCycle === 'monthly' ? 79 : 790,
            description: "Advanced features for full-time professors",
            planType: 'PREMIUM' as const,
            features: STRIPE_CONFIG.PLANS.PREMIUM.features,
            color: "purple",
            popular: true,
            subscriptionType: "PREMIUM"
        },
        {
            name: "Enterprise",
            price: billingCycle === 'monthly' ? 'Custom' : 'Custom',
            description: "For departments and institutions",
            planType: 'ENTERPRISE' as const,
            features: STRIPE_CONFIG.PLANS.ENTERPRISE.features,
            color: "gold",
            popular: false,
            subscriptionType: "ENTERPRISE"
        }
    ]



    return (
        <FeatureLayout
            title="Upgrade Your Subscription"
            description="Choose the perfect plan to unlock unlimited AI-powered teaching assistance"
        >
            <div className="space-y-8">
                {/* Billing Cycle Toggle */}
                <div className="flex justify-center">
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`rounded-md px-4 py-2 transition-colors ${billingCycle === 'monthly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${billingCycle === 'yearly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Yearly
                            <Badge variant="secondary" className="bg-green-100 text-xs text-green-700">
                                Save 20%
                            </Badge>
                        </button>
                    </div>
                </div>

                {/* Trial Expired Notice */}
                <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <Clock className="size-5" />
                            Your Free Trial Has Ended
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">
                            Your 14-day free trial has expired. Upgrade now to continue using Professor GENIE&apos;s powerful AI features.
                            Your data and settings are preserved and will be available immediately after upgrading.
                        </p>
                    </CardContent>
                </Card>

                {/* Pricing Plans */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative ${plan.popular ? 'scale-105 border-purple-300 shadow-lg' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-1 text-white">
                                        <Star className="mr-1 size-3" />
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center">
                                <CardTitle className="flex items-center justify-center gap-2">
                                    {plan.name === 'Enterprise' ? (
                                        <Crown className="size-5 text-yellow-500" />
                                    ) : plan.name === 'Premium' ? (
                                        <Star className="size-5 text-purple-500" />
                                    ) : (
                                        <Zap className="size-5 text-blue-500" />
                                    )}
                                    {plan.name}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4">
                                    {plan.price === 'Custom' ? (
                                        <>
                                            <span className="text-4xl font-bold">Custom</span>
                                            <span className="text-gray-600"> Quote</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-bold">${plan.price}</span>
                                            <span className="text-gray-600">/{billingCycle}</span>
                                        </>
                                    )}
                                </div>
                                {billingCycle === 'yearly' && plan.price !== 'Custom' && (
                                    <p className="text-sm text-green-600">
                                        ${Math.round((Number(plan.price) / 12) * 10) / 10}/month
                                    </p>
                                )}
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Check className="mt-0.5 size-4 shrink-0 text-green-500" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleUpgrade(plan.planType)}
                                    disabled={isLoading === plan.planType}
                                    className={`w-full ${plan.popular
                                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                                        : plan.name === 'Enterprise'
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                                            : ''
                                        }`}
                                    size="lg"
                                >
                                    {isLoading === plan.planType
                                        ? 'Processing...'
                                        : plan.name === 'Enterprise'
                                            ? 'Contact Sales'
                                            : 'Subscribe Now'
                                    }
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Features Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>What You Get With Premium Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="mt-1 size-8 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold">Unlimited AI Responses</h3>
                                    <p className="text-sm text-gray-600">
                                        Generate as many discussion responses as you need with advanced AI models.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <GraduationCap className="mt-1 size-8 text-green-600" />
                                <div>
                                    <h3 className="font-semibold">Advanced Grading</h3>
                                    <p className="text-sm text-gray-600">
                                        Unlimited grading sessions with custom rubrics and detailed analytics.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Shield className="mt-1 size-8 text-purple-600" />
                                <div>
                                    <h3 className="font-semibold">Priority Support</h3>
                                    <p className="text-sm text-gray-600">
                                        Get priority customer support and access to new features first.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold">Can I cancel anytime?</h4>
                            <p className="text-sm text-gray-600">
                                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold">Is my data secure?</h4>
                            <p className="text-sm text-gray-600">
                                Absolutely. We use enterprise-grade encryption and never share your data with third parties.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold">Do you offer educational discounts?</h4>
                            <p className="text-sm text-gray-600">
                                Yes! Contact us for special pricing for educational institutions and bulk licenses.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FeatureLayout>
    )
}