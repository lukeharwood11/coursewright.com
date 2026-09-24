# AGENTS — `src/discussions/databridge/`

PostgREST for `discussions`, `discussion_messages`, `discussion_message_attachments`, `discussion_message_mentions`, and `discussion_reads`. Soft-delete via `deleted_at`. Never hard-delete discussion rows from the app. New posts go through `post_discussion_message` (message + @mentions in one transaction) so Activity does not double-ping class leads who were also mentioned. Mark read with an upsert on `discussion_reads`. Realtime `postgres_changes` channels live here; page hooks (and org chrome) subscribe and invalidate TanStack Query.
