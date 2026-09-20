# AGENTS — `src/auth/`

Sign-up / sign-in: email (password or magic link) + Google via Supabase Auth. Signup **signs the person in** — do not send them to `/login` after a successful create.

## Scope

- Login (`/login`) and signup (`/signup`) screens (STYLE_GUIDE)
- Account settings (`/my/settings`) — cross-org; display name on `profiles`; sign out. Email is auth-owned (read-only). No avatar upload / Google link UI in P0
- Account menu chrome (`AccountMenu`) — User (Settings, **Send feedback**, Sign out) + Organization (Org settings, Switch)
- Invite link entry → `/invite/<token>` loads unsigned, then sign up / log in with **that invited email** (prefilled + named in copy)
- Session helpers used by `app/` gates

Auth APIs call the browser Supabase client (`infrastructure/supabase/client.ts`). Without Supabase env (`VITE_SUPABASE_*` from `.env.testing` or CI), the UI still loads and shows a setup notice.

## Rules

- Supabase Auth only — Google via Google Cloud OAuth wired into Supabase.
- Parents must have an account in P0 to view.
- Keep the screen calm and obvious.
- Signup is **email + password** or Google. On success with a session, keep it (`RedirectIfAuthed` → `/my`, or `next` when present). When confirmation is required, show an “Account created — check your email” success state (not an error). Password signup passes `emailRedirectTo` so confirmation links land on `/my` (or the invite `next` path). Magic-link stays on login for returning users.

## Don’t

- Build magic-link no-account viewing in P0.
- Put org/course business logic here.
- **Sign up a new account with username/password when testing — even a dummy one.** Emails are verified and get bounce-checked; never submit `/signup` in tests. Test auth via a failed sign-in, a real provisioned account, or Google OAuth instead.
