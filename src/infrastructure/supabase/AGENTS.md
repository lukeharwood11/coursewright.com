# AGENTS — `src/infrastructure/supabase/`

Browser Supabase client (anon key) and Storage helpers.

## Scope

- `client.ts` — createClient
- `storage.ts` — upload/download helpers
- Generated `database.types.ts` (from `supabase gen types`)

## Rules

- Anon key only in the SPA; never service role.
- Prefer RLS-friendly patterns; privileged work → Edge Functions.
- Auth session via this client; Google + email per [STACK.md](../../../docs/STACK.md).

## Don’t

- Embed multi-step course copy (or **P1** template copy) here — that’s a Function.
- Commit secrets beyond public anon URL/key patterns in `.env.example`.
