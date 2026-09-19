# AGENTS — `send-organization-invite`

Send a Resend **`organization-invite`** event for a pending `admin_invites` row (staff or parent).

## Rules

- API key stays in Edge Function secrets (`RESEND_API_KEY`, **HN-015**). Never the SPA.
- Invite rows are created with PostgREST + RLS. This Function only **sends** mail.
- Build `/invite/<token>` from an allowed SPA origin (or `SITE_URL`). Do not trust a client-supplied link.
- Same authorization as canceling an invite: owners/admins for staff; staff for parent. Not the invitee.
