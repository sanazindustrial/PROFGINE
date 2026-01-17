"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureLayout } from "@/components/feature-layout"
import { CreditCard, Calendar, AlertCircle } from "lucide-react"

export default function ManageSubscription() {
    const { data: session } = useSession()
    const [subscriptionData, setSubscriptionData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchSubscriptionData = useCallback(async () => {
        try {
            // This would fetch subscription data from your API
            // For now, we'll use session data
            setSubscriptionData({
                plan: session?.user?.subscriptionType || 'FREE',
                status: 'active',
                nextBilling: session?.user?.subscriptionExpiresAt
            })
        } catch (error) {
            console.error('Error fetching subscription:', error)
        } finally {
            setLoading(false)
        }
    }, [session?.user?.subscriptionType, session?.user?.subscriptionExpiresAt])

    useEffect(() => {
        if (session?.user) {
            fetchSubscriptionData()
        }
    }, [session, fetchSubscriptionData])

    const handleCancelSubscription = async () => {
        if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
            // Implement cancellation logic here
            alert('Subscription cancellation feature coming soon!')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'canceled': return 'bg-red-100 text-red-800'
            case 'past_due': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPlanName = (plan: string) => {
        switch (plan) {
            case 'BASIC': return 'Basic Plan'
            case 'PREMIUM': return 'Premium Plan'
            case 'ENTERPRISE': return 'Enterprise Plan'
            default: return 'Free Trial'
        }
    }

    if (loading) {
        return (
            <FeatureLayout title="Manage Subscription" description="Manage your ProfGini subscription">
                <div className="flex h-64 items-center justify-center">
                    <div className="animate-pulse">Loading subscription details...</div>
                </div>
            </FeatureLayout>
        )
    }

    return (
        <FeatureLayout
            title="Manage Subscription"
            description="View and manage your Professor GENIE subscription"
        >
            <div className="space-y-6">
                {/* Current Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="size-5" />
                            Current Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {getPlanName(subscriptionData?.plan)}
                                </h3>
                                <p className="text-gray-600">
                                    {subscriptionData?.plan === 'FREE'
                                        ? 'Free trial with limited features'
                                        : 'Full access to premium features'
                                    }
                                </p>
                            </div>
                            <Badge className={getStatusColor(subscriptionData?.status)}>
                                {subscriptionData?.status}
                            </Badge>
                        </div>

                        {subscriptionData?.nextBilling && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="size-4" />
                                Next billing: {new Date(subscriptionData.nextBilling).toLocaleDateString()}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Billing History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="py-8 text-center text-gray-600">
                            No billing history available yet.
                        </p>
                    </CardContent>
                </Card>

                {/* Actions */}
                {subscriptionData?.plan !== 'FREE' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="size-5" />
                                Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Canceling your subscription will downgrade your account to the free tier at the end of your current billing period.
                                </p>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelSubscription}
                                >
                                    Cancel Subscription
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {subscriptionData?.plan === 'FREE' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upgrade Your Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-600">
                                Unlock the full power of Professor GENIE with a premium subscription.
                            </p>
                            <Button onClick={() => window.location.href = '/subscription/upgrade'}>
                                View Plans
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </FeatureLayout>
    )
}