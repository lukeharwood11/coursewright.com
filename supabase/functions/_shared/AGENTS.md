# AGENTS — `supabase/functions/_shared/`

Shared helpers for Edge Functions (CORS, admin client, errors).

## Rules

- No use-case business flow that belongs in a named function folder.
- Safe shared utilities only; keep secrets via Deno env.
- `vapid.ts` loads Activity push keys (**HN-018**). No send loop here.
