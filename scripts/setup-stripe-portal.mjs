/**
 * One-time script: configure the Stripe Customer Portal for InvoiceOps.
 * Run once per Stripe account (test + production separately).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... node scripts/setup-stripe-portal.mjs
 *   # or with .env loaded:
 *   node -e "require('dotenv').config()" scripts/setup-stripe-portal.mjs
 */

import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if STRIPE_SECRET_KEY not already in environment
if (!process.env.STRIPE_SECRET_KEY) {
  try {
    const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    for (const line of env.split('\n')) {
      const [k, ...v] = line.split('=');
      if (k && !process.env[k]) process.env[k] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env file */ }
}

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) { console.error('STRIPE_SECRET_KEY missing'); process.exit(1); }

const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim() || 'price_1TPrFsEP2vmEedR8uncP6afm';
// productId is derived from the price if not overridden
let productId = process.env.STRIPE_PRO_PRODUCT_ID?.trim() || 'prod_UOeYxvT8mbg12O';

const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });

async function main() {
  const env = key.startsWith('sk_live') ? 'PRODUCTION' : 'TEST';

  // Auto-derive product from price if not explicitly set
  if (!process.env.STRIPE_PRO_PRODUCT_ID) {
    const price = await stripe.prices.retrieve(priceId);
    productId = typeof price.product === 'string' ? price.product : price.product.id;
  }

  console.log(`\nConfiguring Stripe Customer Portal [${env}]`);
  console.log(`  Price ID : ${priceId}`);
  console.log(`  Product  : ${productId}\n`);

  // Check for an existing default configuration
  const existing = await stripe.billingPortal.configurations.list({ is_default: true });
  if (existing.data.length > 0) {
    const cfg = existing.data[0];
    console.log(`Updating existing default configuration: ${cfg.id}`);
    const updated = await stripe.billingPortal.configurations.update(cfg.id, buildConfig(priceId, productId));
    console.log('✓ Portal configuration updated:', updated.id);
    return;
  }

  const config = await stripe.billingPortal.configurations.create({
    ...buildConfig(priceId, productId),
    default_return_url: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL.trim()}/dashboard/settings`
      : undefined,
  });

  console.log('✓ Portal configuration created:', config.id);

  // Set as default
  await stripe.billingPortal.configurations.update(config.id, { active: true });
  console.log('✓ Set as default portal configuration');
  console.log('\nDone. The Stripe Customer Portal now supports:');
  console.log('  • Plan switching (upgrade / downgrade)');
  console.log('  • Subscription cancellation (at period end)');
  console.log('  • Payment method update');
  console.log('  • Invoice history + PDF download');
}

function buildConfig(priceId, productId) {
  return {
    business_profile: {
      headline: 'InvoiceOps — Gérez votre abonnement',
      privacy_policy_url: process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL.trim()}/privacy-policy`
        : undefined,
      terms_of_service_url: process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL.trim()}/terms-of-service`
        : undefined,
    },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
        cancellation_reason: { enabled: true, options: ['too_expensive', 'missing_features', 'switched_service', 'other'] },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price', 'promotion_code'],
        proration_behavior: 'create_prorations',
        products: [{ product: productId, prices: [priceId] }],
      },
    },
  };
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
