# AGENTS — `src/app/`

Delivery shell: router, providers, layouts, auth/role gates.

## Scope

- `App.tsx`, `router.tsx`, `gates/`, `ScrollToTop` (reset shell main or window scroll on pathname change)
- Layouts: account shell (`/my`), org shells (`layouts/`)
- Catch-all error UI + boundary (`error/`)
- Route guards (UX only — RLS is the real gate)

## Rules

- Keep this layer thin — no course/roster business rules.
- Wire Supabase + TanStack Query providers here; domain `databridge/` uses them.
- Role decides chrome, not a separate codebase.

## Don’t

- Import domain internals in a way that creates circular mess — prefer domain `index.ts` public API.
- Treat UI gates as security.
