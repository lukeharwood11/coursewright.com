# AGENTS — `src/billing/`

**P1 only.** Course Wright bills organizations (Stripe hypothesis). Not P0.

## Scope

- Stub / placeholder until P1
- Future: org subscription status UI for **owners** (not admins)

## Rules

- Do not block P0 flows on billing.
- Stripe webhooks belong in `supabase/functions/`, not this folder’s client secrets.

## Don’t

- Implement parent tuition collection (future / not P0–P1 org SaaS).
- Add Stripe secret keys to the SPA.
