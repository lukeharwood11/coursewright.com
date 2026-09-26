# AGENTS — `src/marketing/pricing/`

Public `/pricing` screen. Display only.

## Rules

- Ladder data and savings math live in [`../model/pricingPlans.ts`](../model/pricingPlans.ts). This folder renders them.
- Cards: Family (free), Family Pro, Microschool, School. Titles are Family / Microschool / School, plus Family Pro.
- Default interval is **monthly**. Paid yearly prices are 10× monthly: Family Pro `$10/mo` or `$100/yr`, Microschool `$80/mo` or `$800/yr`, and School `$150/mo` or `$1,500/yr`.
- On the yearly interval, lead with the effective monthly rate (`$8.33`, `$66.67`, or `$125`) and show the yearly charge directly below it. Savings badge is dollar amount only (e.g. `Save $300`).
- Every card ends with a **Details** anchor to its full explanation. Paid cards also include **Contact us** (`mailto:hi@`) beside Details; the free Family card is Details only. No Buy, Checkout, or Stripe.
- Full plan details stay visible on the page for comparison and search indexing; do not hide the only explanation in a modal.
- Do not invent extra tiers or dollar amounts.

## Don’t

- Gate product features from this page.
- Collect payment details.
