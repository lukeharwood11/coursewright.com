# AGENTS — `src/marketing/pricing/`

Public `/pricing` screen. Display only.

## Rules

- Ladder data and savings math live in [`../model/pricingPlans.ts`](../model/pricingPlans.ts). This folder renders them.
- Cards: Family (free), Family Pro, Microschool, School. Titles are Family / Microschool / School, plus Family Pro.
- Default interval is **yearly**. Microschool’s yearly label is `$695/mo` (not a computed yearly total).
- Every card ends with **Contact us** (`mailto:hi@`), aligned to the bottom of the card. No Buy, Checkout, or Stripe.
- Say billing is not live. Do not promise self-serve checkout.
- Do not invent extra tiers or dollar amounts.

## Don’t

- Gate product features from this page.
- Collect payment details.
