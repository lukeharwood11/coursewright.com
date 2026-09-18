# SIGNUP

**URL:** `/signup`  
**URL map:** [URLS.md](../URLS.md)

## Audience

New users — including anyone creating an org, and parents/staff claiming invites.

## Purpose

Create an account with **email + password** or **Google**. On success, the person is **signed in** (no extra trip to [LOGIN](./LOGIN.md)). Password-enabled accounts can also sign in later on login.


## Behavior

- Unauthenticated account creation (email + password or Google).
- Password sign-up calls Supabase `signUp` and **keeps the session** when Auth returns one (email confirmation is off in `supabase/config.toml`).
- If that email already has an account, tell them to sign in — do not send them to login automatically after a successful create.
- On success: [INVITE_CLAIM](./INVITE_CLAIM.md) when `next=/invite/<token>`, else `/my` to pick/create org (`RedirectIfAuthed`; pending staff requests also show there).
- Anyone may create an org after signup (creator = first owner) via org picker.

## Data shown

- Wordmark and create-account copy
- Auth controls (Google, email, password) — no org list until after success
- Invite-aware messaging when claiming an invite (`next=/invite/<token>`) — use the invited email
- Validation / error messages (TBD)

## Contents

- Wordmark + clear “create account” framing
- Google sign-up
- Email + password sign-up
- Link to [LOGIN](./LOGIN.md)
- Invite-aware copy when arriving from invite (claim seat / parent access with same email)
- Anyone can create an org after signup (creator = first owner) via [ORG_PICKER](./ORG_PICKER.md)

## Primary actions

- Sign up with Google
- Sign up with email and password
- Go to sign in

## After success

- Stay signed in
- [INVITE_CLAIM](./INVITE_CLAIM.md) when token present
- Else → `/my` to pick or create org (pending requests on [ORG_PICKER](./ORG_PICKER.md))

## Links to

- [LOGIN](./LOGIN.md) — existing account
- [ORG_PICKER](./ORG_PICKER.md) — after success (pick or create org; pending invite requests)
- [INVITE_CLAIM](./INVITE_CLAIM.md) — when `next=/invite/<token>`

## Notes

[FEATURES.md](../FEATURES.md) — org creation, parent invites, admin/instructor invites. Magic-link sign-in stays on [LOGIN](./LOGIN.md) for returning users.
