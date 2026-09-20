# AGENTS — `src/notifications/databridge/`

PostgREST for `notifications` (own rows only). Mark read with an update on `read_at`. Realtime `postgres_changes` channels live here; page hooks (and org chrome) subscribe and invalidate TanStack Query. Never insert notification rows from the app.
