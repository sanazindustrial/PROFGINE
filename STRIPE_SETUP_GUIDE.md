# Stripe Dashboard Setup Guide

## 🎯 Complete Setup Steps

### 1. Stripe Dashboard - Create Products & Prices

**Go to Stripe Dashboard → Products → Create Product**

#### Basic Plan

- **Name:** ProfGini Basic
- **Price:** $19/month recurring
- **Description:** Perfect for individual professors
- **Copy Price ID** → Replace `STRIPE_PRICE_BASIC` in `.env.local`

#### Premium Plan  

- **Name:** ProfGini Premium
- **Price:** $49/month recurring
- **Description:** Advanced features for power users
- **Copy Price ID** → Replace `STRIPE_PRICE_PREMIUM` in `.env.local`

#### Enterprise Plan

- **Name:** ProfGini Enterprise
- **Price:** $99/month recurring
- **Description:** For departments and institutions
- **Copy Price ID** → Replace `STRIPE_PRICE_ENTERPRISE` in `.env.local`

### 2. Stripe API Keys

**Go to Stripe Dashboard → Developers → API keys**

- Copy **Publishable key** → Replace `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`
- Copy **Secret key** → Replace `STRIPE_SECRET_KEY` in `.env.local`

### 3. Webhook Configuration

**Option A: For Local Development (Stripe CLI)**

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- Copy the `whsec_...` key → Replace `STRIPE_WEBHOOK_SECRET` in `.env.local`

**Option B: For Production Deployment**

- Go to Stripe Dashboard → Developers → Webhooks
- **Add endpoint:** `https://yourdomain.com/api/webhooks/stripe`
- **Select events:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Copy **Signing secret** → Replace `STRIPE_WEBHOOK_SECRET` in production env

### 4. Test the Integration

#### Test Flow

1. Start development server: `npm run dev`
2. Navigate to `/subscription/upgrade`
3. Click "Get Started" on any plan
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout → Should redirect to success page

#### Test Card Numbers

- **Visa:** 4242 4242 4242 4242
- **Visa (debit):** 4000 0566 5566 5556
- **Mastercard:** 5555 5555 5555 4444
- **American Express:** 3782 822463 10005
- **Declined:** 4000 0000 0000 0002

### 5. Production Deployment

#### Environment Variables for Vercel

```bash
# Add these in Vercel → Project → Settings → Environment Variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_BASIC=price_live_...
STRIPE_PRICE_PREMIUM=price_live_...
STRIPE_PRICE_ENTERPRISE=price_live_...
APP_URL=https://yourdomain.com
```

#### Switch to Live Mode

1. Toggle Stripe Dashboard to **Live mode**
2. Create **live versions** of all products/prices
3. Update webhook endpoint to production URL
4. Use **live API keys** in production environment

---

## 🔍 Testing Checklist

- [ ] Products created in Stripe Dashboard
- [ ] Price IDs copied to `.env.local`
- [ ] API keys configured
- [ ] Webhook endpoint working (test with Stripe CLI)
- [ ] Subscription flow works end-to-end
- [ ] Success/cancel pages display correctly
- [ ] AI features respect subscription limits
- [ ] Customer portal accessible

---

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid price ID"** → Double-check price IDs in Stripe Dashboard
2. **Webhook signature verification failed** → Ensure correct webhook secret
3. **"No organization found"** → Database migration may be incomplete
4. **API route 404** → Verify file structure matches documentation

### Debug Commands

```bash
# Test database connection
node scripts/test-db.js

# Check Prisma schema
npx prisma studio

# View webhook events
stripe events list --limit 10
```
