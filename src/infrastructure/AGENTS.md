# AGENTS — `src/infrastructure/`

Framework and client **details**. Keep quiet — domains scream.

## Scope

- Supabase browser client, storage helpers
- PostHog analytics client
- TanStack Query client
- Tiny shared utils (no business rules)

## Rules

- Domains call infrastructure through their `databridge/` modules, not scatter imports of ad hoc clients.
- No product vocabulary folders here.
- Generated DB types may live under `supabase/`.

## Don’t

- Add `CourseService` / domain logic here.
- Put Zustand server caches here — use TanStack Query in domains.
