# PRICING

**URL:** `/pricing`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Org decision-makers checking cost before they write in.

## Purpose

Show the public plan ladder so people can plan. Billing is **not** live. This page does not check out.


## Behavior

- Public marketing page. No subscription data. No payment form.
- **Monthly | Yearly** segmented control. **Yearly is the default.**
- Yearly shows savings versus monthly × 12 for paid plans. Family stays **Free** on both.
- Every plan action is **Contact us** (`mailto:hi@coursewright.com`). Do not add Buy, Checkout, or Stripe.
- Footer states that the prices are for planning and billing is not live yet.

## Data shown

Display-only ladder (three cards). Do **not** show Family Pro.

| Plan | Monthly | Yearly | Limits called out |
|------|---------|--------|-------------------|
| **Family** | Free | Free | Up to 6 student profiles, up to 2 staff, 2 GB storage |
| **Co-op** | $79 | $790 (vs $948 — save $158, about 2 months) | Up to 60 student profiles, multiple staff, 50 GB. Highlights: full roles, announcements and discussions, Org Grading and report cards, branding |
| **School** | $99 | $990 (vs $1,188 — save $198, about 2 months) | Up to 200 student profiles, 200 GB, priority support and early access. Includes the Co-op plan |

Amounts live in `src/marketing/model/pricingPlans.ts`. Do not invent extra tiers or prices.

Churches and ministries use the Co-op plan. There is no separate church plan.

## Contents

- Heading: Family, Co-op, and School
- Monthly / Yearly control (yearly selected on load)
- Three plan cards, each ending in **Contact us**
- Honest note: prices are for planning; billing isn’t live; no self-serve checkout; contact for a design-partner seat or early access
- One line: churches and ministries use the same Co-op plan
- Links back to [HOME](./HOME.md) and [CONTACT](./CONTACT.md)
- In-app billing stays **P1** (Stripe stub). This page does not start a subscription

## Primary actions

- Switch Monthly / Yearly
- Contact us (`hi@coursewright.com`)

## Links to

- [HOME](./HOME.md) — back to home
- [CONTACT](./CONTACT.md) — contact page
- mailto `hi@coursewright.com` — plan CTA (see [CONTACT](./CONTACT.md))
- via marketing footer: [HOME](./HOME.md), [ABOUT](./ABOUT.md), [PRICING](./PRICING.md), [DOCS](./DOCS.md), [LOGIN](./LOGIN.md), [SIGNUP](./SIGNUP.md), [CONTACT](./CONTACT.md), [PRIVACY](./PRIVACY.md), [TERMS](./TERMS.md), [COOKIES](./COOKIES.md)

## Notes

[FEATURES.md](../FEATURES.md) (P1 billing). Public list prices are for planning only until in-app billing ships.
