# AGENTS — `src/marketing/pricing/`

Public `/pricing` screen. Display only.

## Rules

- Ladder data and savings math live in [`../model/pricingPlans.ts`](../model/pricingPlans.ts). This folder renders them.
- Three cards: Family (free), Co-op, School. Do not show Family Pro.
- Default interval is **yearly**. Yearly shows savings versus monthly × 12.
- Every tier action is **Contact us** (`mailto:hi@`). No Buy, Checkout, or Stripe.
- Say billing is not live. Do not promise self-serve checkout.
- Do not invent extra tiers or dollar amounts.

## Don’t

- Gate product features from this page.
- Collect payment details.
