# AGENTS — `src/auth/account-settings/`

Cross-org account page (`/my/settings`).

## Scope

- Display name — persist to `profiles.name`
- Email — read-only (Auth-owned)
- Sign out

Page UI in `AccountSettingsPage.tsx` + `components/`; React wiring in `hooks/`; Supabase in `../api/profiles.ts`; validation in `../model/profile.ts`.

## Don’t

- Upload avatars or manage Google link in P0
- Edit org identity, staff, or billing here — that is `organizations/org-settings/`
