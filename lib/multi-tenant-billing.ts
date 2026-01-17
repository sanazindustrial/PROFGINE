// Client-side helper for multi-tenant billing
'use client';

import { useState } from 'react';

export type BillingOwnerType = 'USER' | 'ORG';
export type PaidTier = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

interface CheckoutOptions {
    tier: PaidTier;
    ownerType: BillingOwnerType;
    orgId?: string; // Required if ownerType === 'ORG'
}

export async function startMultiTenantCheckout(options: CheckoutOptions) {
    try {
        const response = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });

        const data = await response.json();

        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Failed to create checkout session');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        throw error;
    }
}

export async function createOrganization(name: string) {
    const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
    }

    return response.json();
}

export function useMultiTenantBilling() {
    const [loading, setLoading] = useState(false);

    const checkout = async (options: CheckoutOptions) => {
        setLoading(true);
        try {
            await startMultiTenantCheckout(options);
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const createOrg = async (name: string) => {
        setLoading(true);
        try {
            const result = await createOrganization(name);
            setLoading(false);
            return result;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    return {
        checkout,
        createOrg,
        loading,
    };
}