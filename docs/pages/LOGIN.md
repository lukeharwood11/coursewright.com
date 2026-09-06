# LOGIN

**URL:** `/login`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Returning users; parents/instructors/admins with accounts. Invitees who already have an account.

## Purpose

Sign in with **email** or **Google** (Supabase Auth).


## Behavior

- Unauthenticated. Offers email and Google sign-in via Supabase Auth.
- On success: redirect to `/my` ([ORG_PICKER](./ORG_PICKER.md)), last org, or invite destination when present.
- Link to signup for new users; invite-aware messaging when arriving from an invite (same email).
- Account required to view shared content in P0 (no magic-link view yet).

## Data shown

- Wordmark and short sign-in copy
- Auth controls (Google, email fields) — no course/roster data
- Error/validation messages for failed auth (TBD exact copy)
- Invite-aware copy when `next` is `/invite/<token>` — sign in with the invited email

## Contents

- Course Wright wordmark
- Short plain subcopy (e.g. sign in to see courses and materials — style guide voice)
- Google sign-in
- Email sign-in
- Link to [SIGNUP](./SIGNUP.md)
- Invite-aware messaging when arriving from [INVITE_CLAIM](./INVITE_CLAIM.md) — same email as invite
- Phone-friendly centered card layout ([STYLE_GUIDE.md](../STYLE_GUIDE.md))

## Primary actions

- Sign in with Google
- Sign in with email
- Go to sign up

## After success

- Default → [ORG_PICKER](./ORG_PICKER.md) (`/my`), or last org / invite destination when known
- Parents with active enrollments land on role-aware [ORG_HOME](./ORG_HOME.md)

## Links to

- [SIGNUP](./SIGNUP.md) — create account
- [ORG_PICKER](./ORG_PICKER.md) — default after success (`/my`); pending staff requests also show there
- [ORG_HOME](./ORG_HOME.md) — after success when org/invite destination is known
- [INVITE_CLAIM](./INVITE_CLAIM.md) — when `next=/invite/<token>`

## Notes

P0: account required to view shared content. Magic links later. [FEATURES.md](../FEATURES.md) Auth / parent access.
