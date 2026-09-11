# SIGNUP

**URL:** `/signup`  
**URL map:** [URLS.md](../URLS.md)

## Audience

New users — including anyone creating an org, and parents/staff claiming invites.

## Purpose

Create an account with **email magic link / OTP** or **Google**. Password sign-up is not offered; password-enabled accounts sign in on [LOGIN](./LOGIN.md).


## Behavior

- Unauthenticated account creation (email OTP / magic link or Google). No password field.
- On success: invite claim when token present (path TBD), else `/my` to pick/create org.
- Anyone may create an org after signup (creator = first owner) via org picker.

## Data shown

- Wordmark and create-account copy
- Auth controls (Google, email) — no org list until after success
- Invite-aware messaging when claiming a seat / parent invite (TBD)
- Validation / error messages (TBD)

## Contents

- Wordmark + clear “create account” framing
- Google sign-up
- Email sign-up (magic link / OTP)
- Link to [LOGIN](./LOGIN.md)
- Invite-aware copy when arriving from invite (claim seat / parent access with same email)
- Anyone can create an org after signup (creator = first owner) via [ORG_PICKER](./ORG_PICKER.md)

## Primary actions

- Sign up with Google
- Sign up with email (magic link / OTP)
- Go to sign in

## After success

- Invite claim flow when token present (path TBD)
- Else → `/my` to pick or create org

## Links to

- [LOGIN](./LOGIN.md) — existing account
- [ORG_PICKER](./ORG_PICKER.md) — after success (pick or create org)
- Invite claim entry — TBD (no page file until path locked)

## Notes

[FEATURES.md](../FEATURES.md) — org creation, parent invites, admin/instructor invites. Password sign-up is not in P0; existing password users sign in on [LOGIN](./LOGIN.md).
