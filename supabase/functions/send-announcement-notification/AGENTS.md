# AGENTS — `send-announcement-notification`

Send a Resend **`announcement-notification`** event to each parent email the announcement applies to, and write one Activity row per claimed family account (`notify_announcement`) before mail is attempted.

## Rules

- API key stays in Edge Function secrets (`RESEND_API_KEY`, **HN-015**). Never the SPA.
- Announcement rows are created with PostgREST + RLS. This Function only **sends** mail.
- Build `/my/<org-slug>/announcements/<id>` from an allowed SPA origin (or `SITE_URL`). Do not trust a client-supplied link.
- Same authorization as posting the announcement: owners/admins any audience; instructors for courses they teach, or roster-visible classes/students.
- Recipients are people who already have an account (`parent_student_links` → `profiles.email` with an active org membership). Do not email pending invites or `student_email` contact fields.
- One Resend Events call per unique email (no batch Events API). Payload includes `audience_summary` / `audience_list` for the named targets, not parent addresses.
