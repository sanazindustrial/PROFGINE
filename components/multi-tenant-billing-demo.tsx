'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMultiTenantBilling } from '@/lib/multi-tenant-billing';

export function MultiTenantBillingDemo() {
    const { checkout, createOrg, loading } = useMultiTenantBilling();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleUserCheckout = async (tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE') => {
        try {
            setError(null);

            if (tier === 'FREE') {
                // Handle FREE tier - possibly redirect to signup or show a message
                alert('FREE tier is available at signup. No payment required.');
                return;
            }

            await checkout({ tier: tier as 'BASIC' | 'PREMIUM' | 'ENTERPRISE', ownerType: 'USER' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Checkout failed');
        }
    };

    const handleOrgCheckout = async (tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE') => {
        try {
            setError(null);
            // For demo purposes, using a placeholder org ID
            // In real app, you'd get this from user's organization context
            await checkout({ tier, ownerType: 'ORG', orgId: 'demo-org-id' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Checkout failed');
        }
    };

    const handleCreateOrg = async () => {
        try {
            setError(null);
            const result = await createOrg('My New Organization');
            setSuccess(`Organization created: ${result.org.name}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create organization');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Multi-Tenant Billing System</h2>

            {error && (
                <div className="rounded border border-red-200 bg-red-50 p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="rounded border border-green-200 bg-green-50 p-4">
                    <p className="text-green-600">{success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Individual User Subscriptions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Individual Subscriptions
                            <Badge variant="outline">USER</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Subscribe as an individual user. Great for personal use or small-scale teaching.
                        </p>

                        <div className="space-y-2">
                            <Button

                                onClick={() => handleUserCheckout('BASIC')}
                                disabled={loading}
                                className="w-full"
                                variant="outline"
                            >
                                Basic Plan - $29/month (200 credits)
                            </Button>

                            <Button
                                onClick={() => handleUserCheckout('PREMIUM')}
                                disabled={loading}
                                className="w-full"
                                variant="default"
                            >
                                Premium Plan - $79/month (500 credits)
                            </Button>

                            <Button
                                onClick={() => handleUserCheckout('ENTERPRISE')}
                                disabled={loading}
                                className="w-full"
                                variant="secondary"
                            >
                                Enterprise Plan - Custom Quote
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Organization Subscriptions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Organization Subscriptions
                            <Badge variant="outline">ORG</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Subscribe as an organization. Perfect for schools, universities, or team environments.
                        </p>

                        <Button
                            onClick={handleCreateOrg}
                            disabled={loading}
                            className="w-full"
                            variant="outline"
                        >
                            Create Organization First
                        </Button>

                        <div className="space-y-2">
                            <Button
                                onClick={() => handleOrgCheckout('BASIC')}
                                disabled={loading}
                                className="w-full"
                                variant="outline"
                            >
                                Org Basic - $39/month
                            </Button>

                            <Button
                                onClick={() => handleOrgCheckout('PREMIUM')}
                                disabled={loading}
                                className="w-full"
                                variant="default"
                            >
                                Org Premium - $99/month
                            </Button>

                            <Button
                                onClick={() => handleOrgCheckout('ENTERPRISE')}
                                disabled={loading}
                                className="w-full"
                                variant="secondary"
                            >
                                Org Enterprise - $199/month
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>How Multi-Tenant Billing Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded border p-4">
                            <h4 className="font-medium text-green-600">Organization First</h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                                If you&apos;re in an organization with an active subscription, that plan takes precedence.
                            </p>
                        </div>

                        <div className="rounded border p-4">
                            <h4 className="font-medium text-blue-600">Individual Fallback</h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                                If no org subscription, your personal subscription is used.
                            </p>
                        </div>

                        <div className="rounded border p-4">
                            <h4 className="font-medium text-gray-600">Free Trial Default</h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                                No subscriptions? You get a free trial with basic limits.
                            </p>
                        </div>
                    </div>

                    <div className="rounded bg-blue-50 p-4">
                        <h4 className="font-medium text-blue-900">Implementation Features:</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-800">
                            <li>• Auto-creates UserSubscription + UserUsageCounter on signup</li>
                            <li>• Single getBillingContext() function chooses best plan automatically</li>
                            <li>• Server-side access control prevents UI bypass</li>
                            <li>• Stripe webhooks update both org and user subscriptions</li>
                            <li>• Usage limits enforced at API level</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}