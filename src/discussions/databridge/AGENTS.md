# AGENTS — `src/discussions/databridge/`

PostgREST for `discussions`, `discussion_messages`, `discussion_message_attachments`, and `discussion_reads`. Soft-delete via `deleted_at`. Never hard-delete discussion rows from the app. Mark read with an upsert on `discussion_reads`. Realtime `postgres_changes` channels live here; page hooks (and org chrome) subscribe and invalidate TanStack Query.
