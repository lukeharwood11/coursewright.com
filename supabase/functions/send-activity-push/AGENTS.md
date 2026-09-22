# AGENTS — `send-activity-push`

Send a Web Push for one unread Activity row to that person’s saved devices.

## Rules

- Called by `private.enqueue_activity_push` with header `x-webhook-secret`. `verify_jwt = false`. Reject any other caller.
- Secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ACTIVITY_PUSH_WEBHOOK_SECRET`) are **HN-018**. Never put them in the SPA.
- Load the row with the service role. Skip when `read_at` is set. Build the headline and `/my/…?activity=<id>` link here — do not trust a client URL.
- Delete a subscription when the push service says it is gone (404/410).
- Announcement email stays in `send-announcement-notification`.
