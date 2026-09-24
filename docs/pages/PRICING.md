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
- Yearly leads with a lower whole-dollar effective monthly rate and shows the 10× annual charge below it, then savings versus monthly × 12. Family stays **Free** on both.
- Every card has **Details**, which scrolls to that plan’s full explanation below the comparison grid, plus **Contact us** (`mailto:hi@coursewright.com`). Do not add Buy, Checkout, or Stripe.

## Data shown

Display-only ladder (four cards).

| Plan | Monthly | Yearly | Limits called out |
|------|---------|--------|-------------------|
| **Family** | Free | Free | Up to 2 student profiles, 1 collaborator, 1 GB storage |
| **Family Pro** | $6 | $5/mo ($60 billed yearly; vs $72 — save $12, 2 months) | Up to 12 student profiles, up to 3 collaborators, 10 GB storage |
| **Microschool** | $72 | $60/mo ($720 billed yearly; vs $864 — save $144, 2 months) | Up to 60 student profiles, multiple staff, 50 GB. Highlights: full roles, announcements and discussions, Org Grading and report cards, branding |
| **School** | $102 | $85/mo ($1,020 billed yearly; vs $1,224 — save $204, 2 months) | Up to 200 student profiles, 200 GB, priority support and early access. Includes the Microschool plan |

Amounts live in `src/marketing/model/pricingPlans.ts`. Paid yearly prices are 10× monthly prices. Do not invent extra tiers or prices.

Detailed feature explanations:

- **Family:** course builder; weekly planning; signed-in sharing and print; create a course from a previous course
- **Family Pro:** everything in Family, with more student profiles, collaborators, and storage
- **Microschool:** everything in Family Pro; owner/admin/instructor/parent/student roles; announcements and discussions; organization grading, gradebooks, progress, and report cards; organization icon and accent color
- **School:** everything in Microschool; larger capacity; priority support; early access

## Contents

- Heading: Family, Microschool, and School
- Monthly / Yearly control (yearly selected on load)
- Four plan cards (Family, Family Pro, Microschool, School), each ending in **Details** and **Contact us**
- Full, visible plan-detail sections below the cards; each explains the audience, limits, inherited tier, and included features
- Links back to [HOME](./HOME.md) and [CONTACT](./CONTACT.md)
- In-app billing stays **P1** (Stripe stub). This page does not start a subscription

## Primary actions

- Switch Monthly / Yearly
- Open plan details
- Contact us (`hi@coursewright.com`)

## Links to

- [HOME](./HOME.md) — back to home
- [CONTACT](./CONTACT.md) — contact page
- mailto `hi@coursewright.com` — plan CTA (see [CONTACT](./CONTACT.md))
- via marketing footer: [HOME](./HOME.md), [ABOUT](./ABOUT.md), [PRICING](./PRICING.md), [DOCS](./DOCS.md), [LOGIN](./LOGIN.md), [SIGNUP](./SIGNUP.md), [CONTACT](./CONTACT.md), [PRIVACY](./PRIVACY.md), [TERMS](./TERMS.md), [COOKIES](./COOKIES.md)

## Notes

[FEATURES.md](../FEATURES.md) (P1 billing). Public list prices are for planning only until in-app billing ships.
