# AGENTS — `supabase/functions/`

Edge Functions for **complex / privileged** jobs only.

## Scope

- One folder per use case, e.g. `create-course-from-course/` (**P0**), `send-organization-invite/` (Resend), `create-course-from-template/` (**P1**)
- `_shared/` for cors, admin client, helpers
- P1: `stripe-webhook/`, template sync / promote

## Rules

- Screaming names: job/use case, not `api-v1`.
- Use service role only inside Functions, never in the SPA.
- Keep Functions few — if PostgREST + RLS suffice, don’t add a Function.
- **P0 candidates:** create-course-from-course (copy units/materials), send-organization-invite (Resend), invite claim, revert cascades.
- **P1 candidates:** template copy, sync, promote, Stripe webhooks.

## Don’t

- Proxy all CRUD through Functions.
- Put parent dashboard reads here.
- Ship template Functions as P0 product paths.
