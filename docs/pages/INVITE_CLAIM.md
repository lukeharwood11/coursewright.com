# INVITE_CLAIM

**URL:** `/invite/<token>`  
**URL map:** [URLS.md](../URLS.md)

## Audience

Someone invited as org **owner**, **admin**, **instructor**, or **parent**. They must have (or create) an account on the **same email** as the invite.

## Purpose

Accept an emailed invite from `/invite/<token>`. Staff can also copy that same link. Parent and staff use the **same** token URL; role is on the invite.


## Behavior

- This page loads **without signing in**. It shows the organization and the **invited email**, then **Create account** (primary) or **Sign in**, carrying `next=/invite/<token>` and `email=` that address into [SIGNUP](./SIGNUP.md) / [LOGIN](./LOGIN.md).
- After sign-in with the matching email, show the organization name and the role they were invited as. Parent invites also show the student name.
- **Accept** claims the invite (same email) and opens that org’s home.
  - Staff: creates the staff membership.
  - Parent: creates parent membership (if needed) and links the parent to the student. **Does not** open course materials by itself — enrollment in an active published course still gates content.
- If the signed-in email does not match the invite, explain they need the invited email and offer **Sign out** — do not claim, and do not change their account email.
- Invalid or unknown token: plain “invite not found.”
- Already accepted, and this user is already in the org: offer to open the organization.
- Pending invites also appear after login on [ORG_PICKER](./ORG_PICKER.md) so the link is not the only way to accept.

## Data shown

- Organization **name**
- Invited **role** (owner / admin / instructor / parent)
- Student **name** when the invite is for a parent
- Invited **email** (always, so they know which address to use for the account)
- Signed-in **email** when it does not match
- Error / already-accepted state

## Contents

- Course Wright wordmark
- Short explanation: help run this organization (staff) or view materials for a student (parent)
- Role badge
- Invited email, named plainly
- **Create account** / **Sign in** when signed out
- **Accept invite** (primary) when signed in with the matching email
- **Sign out** when signed in with a different email
- Link back to organizations if they are signed in and want to wait

## Primary actions

- Create account / Sign in when needed → [SIGNUP](./SIGNUP.md) / [LOGIN](./LOGIN.md)
- Accept invite → [ORG_HOME](./ORG_HOME.md)
- Open organization if already a member

## Links to

- [LOGIN](./LOGIN.md) — when signed out (`next=/invite/<token>&email=…`)
- [SIGNUP](./SIGNUP.md) — create account with the invited email
- [ORG_HOME](./ORG_HOME.md) — after accept
- [ORG_PICKER](./ORG_PICKER.md) — back to organizations / other pending requests

## Notes

[FEATURES.md](../FEATURES.md) — Admin invites and parent invites (Resend email + copyable link). One token model; role is payload. Unsigned preview uses `get_invite` (HN-016).
