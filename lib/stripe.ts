import Stripe from 'stripe'

// Check if Stripe is properly configured (not using placeholder values)
const isStripeConfigured = process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes('placeholder');

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set in environment variables. Stripe functionality will be disabled.');
} else if (!isStripeConfigured) {
    console.warn('STRIPE_SECRET_KEY appears to be a placeholder value. Stripe functionality will be disabled.');
}

// Only initialize Stripe if properly configured
export const stripe = isStripeConfigured
    ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
    })
    : null;

// Legacy config for backward compatibility  
export const STRIPE_CONFIG = {
    PRICE_IDS: {
        BASIC: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
        PREMIUM: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder',
        ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
    },
    PLANS: {
        FREE: {
            name: 'Free',
            price: '$0/month',
            features: [
                '50 credits per month',
                'Unlimited students',
                'Basic AI assistance',
                'Trial users, individual testing'
            ],
            priceId: 'free',
        },
        BASIC: {
            name: 'Basic',
            price: '$29/month',
            features: [
                '200 credits per month',
                'Unlimited students',
                'Individual professors, adjuncts',
                'AI-powered grading assistance'
            ],
            priceId: process.env.STRIPE_PRICE_BASIC!,
        },
        PREMIUM: {
            name: 'Premium',
            price: '$79/month',
            features: [
                '500 credits per month',
                'Unlimited students',
                'Full-time professors, coordinators',
                'Advanced AI models',
                'Priority support'
            ],
            priceId: process.env.STRIPE_PRICE_PREMIUM!,
        },
        ENTERPRISE: {
            name: 'Enterprise',
            price: 'Custom Quote',
            features: [
                'Unlimited credits',
                'Unlimited students',
                'Universities, departments',
                'Custom integrations',
                'Dedicated support'
            ],
            priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
        }
    }
}