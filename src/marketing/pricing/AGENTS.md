# AGENTS — `src/marketing/pricing/`

Public `/pricing` screen. Display only.

## Rules

- Ladder data and savings math live in [`../model/pricingPlans.ts`](../model/pricingPlans.ts). This folder renders them.
- Cards: Family (free), Family Pro, Microschool, School. Titles are Family / Microschool / School, plus Family Pro.
- Default interval is **yearly**. Paid yearly prices are 10× monthly: Family Pro `$6/mo` or `$60/yr`, Microschool `$72/mo` or `$720/yr`, and School `$102/mo` or `$1,020/yr`.
- On the yearly interval, lead with the lower whole-dollar effective monthly rate (`$5`, `$60`, or `$85`) and show the yearly charge directly below it.
- Every card ends with a **Details** anchor to its full explanation and **Contact us** (`mailto:hi@`), aligned together at the bottom. No Buy, Checkout, or Stripe.
- Full plan details stay visible on the page for comparison and search indexing; do not hide the only explanation in a modal.
- Do not invent extra tiers or dollar amounts.

## Don’t

- Gate product features from this page.
- Collect payment details.
