# AGENTS — `src/announcements/databridge/`

PostgREST for `announcements` and `announcement_reads`. Soft-delete via `deleted_at`. Never hard-delete announcement rows from the app. Mark read with an upsert on `announcement_reads`. Optional email and Activity go through Edge Function `send-announcement-notification` (`notify_announcement`).
