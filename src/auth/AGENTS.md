# AGENTS — `src/auth/`

Sign-up / sign-in: email + Google via Supabase Auth.

## Scope

- Login (`/login`) and signup (`/signup`) screens (STYLE_GUIDE)
- Account settings (`/my/settings`) — cross-org; sign out
- Account menu chrome (`AccountMenu`) — User (Settings, Sign out) + Organization (Org settings, Switch)
- Invite link entry → sign up / log in with **same email**
- Session helpers used by `app/` gates

Auth APIs call the browser Supabase client (`infrastructure/supabase/client.ts`). Without `.env.local`, the UI still loads and shows a setup notice.

## Rules

- Supabase Auth only — Google via Google Cloud OAuth wired into Supabase.
- Parents must have an account in P0 to view.
- Keep the screen calm and obvious.

## Don’t

- Build magic-link no-account viewing in P0.
- Put org/course business logic here.
